import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import { AuthService, usernameToEmail } from '../auth/auth.service';
import { assertOwnsProperty, assertUnitInProperty } from '../common/access';
import { toColumns } from '../common/case';
import { unwrap, unwrapRows } from '../common/db-error';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateMemberDTO, UpdateMemberDTO } from './members.dto';

const MEMBER_SELECT =
  '*, profile:profiles(full_name, email, username, phone), unit:units(name, rent_amount)';

type MemberRow = { profile?: { email: string | null } | null };

/** Placeholder login addresses are an implementation detail, not contact info. */
const hidePlaceholderEmail = <T extends MemberRow>(row: T): T => {
  if (row.profile?.email?.endsWith('@users.proplord.local')) {
    row.profile.email = null;
  }
  return row;
};

@Injectable()
export class MembersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly auth: AuthService,
  ) {}

  async list(ctx: AuthContext, propertyId?: string) {
    let query = ctx.db
      .from('property_members')
      .select(MEMBER_SELECT)
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    return (unwrap(await query) as MemberRow[]).map(hidePlaceholderEmail);
  }

  /** Landlord creates a username/password login for a tenant and attaches it to the property. */
  async createWithCredentials(
    ctx: AuthContext,
    propertyId: string,
    dto: CreateMemberDTO,
  ) {
    await assertOwnsProperty(ctx, propertyId);
    const role = dto.role ?? 'tenant';
    const unitId = role === 'tenant' ? dto.unitId : undefined;
    if (unitId) await assertUnitInProperty(ctx, propertyId, unitId);

    const { data: taken } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('username', dto.username)
      .maybeSingle();
    if (taken) throw new ConflictException('Username is already taken');

    const user = await this.auth.createUser({
      email: usernameToEmail(dto.username),
      password: dto.password,
      metadata: {
        full_name: dto.fullName,
        username: dto.username,
        role,
      },
    });

    const result = await ctx.db
      .from('property_members')
      .insert({
        property_id: propertyId,
        user_id: user.id,
        unit_id: unitId ?? null,
        role,
        origin: 'credentials',
      })
      .select(MEMBER_SELECT)
      .single();
    if (result.error) {
      await this.supabase.admin.auth.admin.deleteUser(user.id);
    }
    return hidePlaceholderEmail(unwrap(result));
  }

  async update(ctx: AuthContext, id: string, dto: UpdateMemberDTO) {
    if (dto.unitId) {
      const member = unwrap(
        await ctx.db
          .from('property_members')
          .select('property_id')
          .eq('id', id)
          .single<{ property_id: string }>(),
      );
      await assertUnitInProperty(ctx, member.property_id, dto.unitId);
    }
    return hidePlaceholderEmail(
      unwrap(
        await ctx.db
          .from('property_members')
          .update(toColumns(dto))
          .eq('id', id)
          .select(MEMBER_SELECT)
          .single<MemberRow>(),
      ),
    );
  }

  async remove(ctx: AuthContext, id: string) {
    unwrapRows(
      await ctx.db.from('property_members').delete().eq('id', id).select('id'),
    );
    return { deleted: true };
  }
}
