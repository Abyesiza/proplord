import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { AuthService } from '../auth/auth.service';
import type { AuthContext } from '../auth/auth.guard';
import { assertOwnsProperty, assertUnitInProperty } from '../common/access';
import { unwrap, unwrapRows } from '../common/db-error';
import { SupabaseService } from '../supabase/supabase.service';
import { AcceptInvitationDTO, CreateInvitationDTO } from './invitations.dto';

const PUBLIC_COLUMNS =
  'id, property_id, unit_id, email, role, status, expires_at, accepted_at, created_at';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

interface InvitationRow {
  id: string;
  property_id: string;
  unit_id: string | null;
  email: string;
  role: 'tenant' | 'manager';
  status: string;
  expires_at: string;
  property: { name: string } | null;
  unit: { name: string } | null;
}

@Injectable()
export class InvitationsService {
  private readonly webOrigin: string;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.webOrigin = (
      config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  /** The raw token only exists in the returned link; the DB stores its hash. */
  async create(ctx: AuthContext, propertyId: string, dto: CreateInvitationDTO) {
    await assertOwnsProperty(ctx, propertyId);
    if (dto.unitId) await assertUnitInProperty(ctx, propertyId, dto.unitId);

    const token = randomBytes(32).toString('hex');
    const invitation = unwrap(
      await ctx.db
        .from('invitations')
        .insert({
          property_id: propertyId,
          unit_id: dto.unitId ?? null,
          invited_by: ctx.userId,
          email: dto.email,
          token_hash: hashToken(token),
        })
        .select(PUBLIC_COLUMNS)
        .single<Record<string, unknown>>(),
    );
    return { ...invitation, invite_url: `${this.webOrigin}/invite/${token}` };
  }

  async list(ctx: AuthContext, propertyId: string) {
    return unwrap(
      await ctx.db
        .from('invitations')
        .select(PUBLIC_COLUMNS)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false }),
    );
  }

  async revoke(ctx: AuthContext, id: string) {
    unwrapRows(
      await ctx.db
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', id)
        .eq('status', 'pending')
        .select('id'),
    );
    return { revoked: true };
  }

  async preview(token: string) {
    const invitation = await this.findByToken(token);
    const { data: account } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('email', invitation.email)
      .maybeSingle();
    return {
      email: invitation.email,
      propertyName: invitation.property?.name ?? null,
      unitName: invitation.unit?.name ?? null,
      valid: this.isUsable(invitation),
      hasAccount: Boolean(account),
    };
  }

  async accept(
    token: string,
    dto: AcceptInvitationDTO,
    callerToken: string | undefined,
  ) {
    const invitation = await this.findByToken(token);
    if (!this.isUsable(invitation)) {
      throw new GoneException('This invitation is no longer valid');
    }

    let userId: string;
    let password: string | undefined;
    if (callerToken) {
      const { data, error } = await this.supabase
        .fresh()
        .auth.getUser(callerToken);
      if (error || !data.user)
        throw new UnauthorizedException('Invalid session');
      if (data.user.email?.toLowerCase() !== invitation.email) {
        throw new ForbiddenException(
          'This invitation was sent to another email',
        );
      }
      userId = data.user.id;
    } else {
      if (!dto.password || !dto.fullName) {
        throw new BadRequestException('fullName and password are required');
      }
      password = dto.password;
      userId = (
        await this.auth.createUser({
          email: invitation.email,
          password,
          metadata: { full_name: dto.fullName, role: 'tenant' },
        })
      ).id;
    }

    // Claiming first makes the token single-use even under concurrent requests.
    unwrapRows(
      await this.supabase.admin
        .from('invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)
        .eq('status', 'pending')
        .select('id'),
    );

    const { error } = await this.supabase.admin
      .from('property_members')
      .insert({
        property_id: invitation.property_id,
        user_id: userId,
        unit_id: invitation.unit_id,
        role: invitation.role,
        origin: 'invite',
      });
    if (error && error.code !== '23505') {
      throw new ConflictException('Could not join the property');
    }

    const session = password
      ? await this.auth.loginWithEmail(invitation.email, password)
      : null;
    return { propertyId: invitation.property_id, ...session };
  }

  private async findByToken(token: string): Promise<InvitationRow> {
    return unwrap(
      await this.supabase.admin
        .from('invitations')
        .select(
          'id, property_id, unit_id, email, role, status, expires_at, property:properties(name), unit:units(name)',
        )
        .eq('token_hash', hashToken(token))
        .single<InvitationRow>(),
    );
  }

  private isUsable(invitation: InvitationRow) {
    return (
      invitation.status === 'pending' &&
      new Date(invitation.expires_at) > new Date()
    );
  }
}
