import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { AuthContext } from '../auth/auth.guard';
import { assertStaffOfProperty } from '../common/access';
import { toColumns } from '../common/case';
import { unwrap, unwrapRows } from '../common/db-error';
import { DEFAULT_TERMS, type TermClause } from './default-terms';
import {
  CreatePropertyDTO,
  CreateUnitDTO,
  PROPERTY_TYPES,
  UpdatePropertyDTO,
  UpdateTermsDTO,
  UpdateUnitDTO,
} from './properties.dto';

const UNIT_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  apartments: 'Unit',
  rental_rooms: 'Room',
  house: 'House',
  hostel: 'Room',
  commercial: 'Shop',
  mixed_use: 'Unit',
  other: 'Unit',
};

/** Changes whenever any clause changes, so tenants have to accept the new wording. */
const termsVersion = (clauses: TermClause[]) =>
  createHash('sha256')
    .update(JSON.stringify(clauses.map((c) => [c.title, c.body, c.required])))
    .digest('hex')
    .slice(0, 16);

@Injectable()
export class PropertiesService {
  /** Creates the property and, when asked, its units in one go. */
  async create(ctx: AuthContext, dto: CreatePropertyDTO) {
    const { unitCount, unitLabel, defaultRent, ...details } = dto;
    const property = unwrap(
      await ctx.db
        .from('properties')
        .insert({ ...toColumns(details), owner_id: ctx.userId })
        .select()
        .single<{ id: string } & Record<string, unknown>>(),
    );

    if (unitCount) {
      const label = unitLabel ?? UNIT_LABELS[dto.propertyType ?? 'apartments'];
      const units = Array.from({ length: unitCount }, (_, i) => ({
        property_id: property.id,
        name: `${label} ${i + 1}`,
        rent_amount: defaultRent ?? 0,
      }));
      const result = await ctx.db.from('units').insert(units);
      if (result.error) {
        // No transaction across REST calls, so undo the property by hand.
        await ctx.db.from('properties').delete().eq('id', property.id);
        unwrap({ data: null, error: result.error });
      }
    }
    return property;
  }

  async list(ctx: AuthContext) {
    return unwrap(
      await ctx.db
        .from('properties')
        .select('*, units(count)')
        .order('created_at', { ascending: false }),
    );
  }

  async get(ctx: AuthContext, id: string) {
    return unwrap(
      await ctx.db
        .from('properties')
        .select('*, units(*)')
        .eq('id', id)
        .single(),
    );
  }

  async update(ctx: AuthContext, id: string, dto: UpdatePropertyDTO) {
    return unwrap(
      await ctx.db
        .from('properties')
        .update(toColumns(dto))
        .eq('id', id)
        .select()
        .single(),
    );
  }

  async remove(ctx: AuthContext, id: string) {
    unwrapRows(
      await ctx.db.from('properties').delete().eq('id', id).select('id'),
    );
    return { deleted: true };
  }

  async listUnits(ctx: AuthContext, propertyId: string) {
    return unwrap(
      await ctx.db
        .from('units')
        .select('*')
        .eq('property_id', propertyId)
        .order('name'),
    );
  }

  async createUnit(ctx: AuthContext, propertyId: string, dto: CreateUnitDTO) {
    return unwrap(
      await ctx.db
        .from('units')
        .insert({ ...toColumns(dto), property_id: propertyId })
        .select()
        .single(),
    );
  }

  async updateUnit(ctx: AuthContext, id: string, dto: UpdateUnitDTO) {
    return unwrap(
      await ctx.db
        .from('units')
        .update(toColumns(dto))
        .eq('id', id)
        .select()
        .single(),
    );
  }

  async removeUnit(ctx: AuthContext, id: string) {
    unwrapRows(await ctx.db.from('units').delete().eq('id', id).select('id'));
    return { deleted: true };
  }

  /** Custom terms if the landlord edited them, otherwise the default set. */
  private async loadTerms(ctx: AuthContext, propertyId: string) {
    const property = unwrap(
      await ctx.db
        .from('properties')
        .select('owner_id, terms, terms_enabled')
        .eq('id', propertyId)
        .single<{
          owner_id: string;
          terms: TermClause[] | null;
          terms_enabled: boolean;
        }>(),
    );
    const clauses = property.terms ?? DEFAULT_TERMS;
    return {
      ownerId: property.owner_id,
      enabled: property.terms_enabled,
      isDefault: property.terms === null,
      clauses,
      version: termsVersion(clauses),
    };
  }

  private async tenantMemberId(ctx: AuthContext, propertyId: string) {
    const { data } = await ctx.db
      .from('property_members')
      .select('id')
      .eq('property_id', propertyId)
      .eq('user_id', ctx.userId)
      .eq('role', 'tenant')
      .eq('status', 'active')
      .maybeSingle<{ id: string }>();
    return data?.id ?? null;
  }

  async getTerms(ctx: AuthContext, propertyId: string) {
    const terms = await this.loadTerms(ctx, propertyId);
    const visible = terms.enabled || terms.ownerId === ctx.userId;

    // Only tenants have an acceptance to report.
    let acceptance: { accepted: boolean; acceptedAt: string | null } | null =
      null;
    const memberId = await this.tenantMemberId(ctx, propertyId);
    if (memberId) {
      const { data } = await ctx.db
        .from('terms_acceptances')
        .select('accepted_at')
        .eq('member_id', memberId)
        .eq('terms_hash', terms.version)
        .maybeSingle<{ accepted_at: string }>();
      acceptance = {
        accepted: Boolean(data),
        acceptedAt: data?.accepted_at ?? null,
      };
    }

    return {
      enabled: terms.enabled,
      isDefault: terms.isDefault,
      version: terms.version,
      clauses: visible ? terms.clauses : [],
      acceptance,
    };
  }

  /** Records that the calling tenant accepted the wording currently in force. */
  async acceptTerms(ctx: AuthContext, propertyId: string) {
    const terms = await this.loadTerms(ctx, propertyId);
    if (!terms.enabled || terms.clauses.length === 0) {
      throw new BadRequestException('This property has no terms to accept');
    }
    const memberId = await this.tenantMemberId(ctx, propertyId);
    if (!memberId) {
      throw new ForbiddenException('You are not a tenant of this property');
    }
    const { error } = await ctx.db.from('terms_acceptances').insert({
      property_id: propertyId,
      member_id: memberId,
      terms_hash: terms.version,
    });
    // 23505: already accepted this wording.
    if (error && error.code !== '23505') unwrap({ data: null, error });
    return this.getTerms(ctx, propertyId);
  }

  /** Who has accepted the current wording, for the landlord and caretakers. */
  async listAcceptances(ctx: AuthContext, propertyId: string) {
    await assertStaffOfProperty(ctx, propertyId);
    const terms = await this.loadTerms(ctx, propertyId);
    const tenants = unwrap(
      await ctx.db
        .from('property_members')
        .select('id, unit:units(name), profile:profiles(full_name, username)')
        .eq('property_id', propertyId)
        .eq('role', 'tenant')
        .eq('status', 'active')
        .order('created_at'),
    ) as unknown as {
      id: string;
      unit: { name: string } | null;
      profile: { full_name: string | null; username: string | null } | null;
    }[];
    const accepted = new Map(
      (
        unwrap(
          await ctx.db
            .from('terms_acceptances')
            .select('member_id, accepted_at')
            .eq('property_id', propertyId)
            .eq('terms_hash', terms.version),
        ) as { member_id: string; accepted_at: string }[]
      ).map((a) => [a.member_id, a.accepted_at]),
    );

    return {
      version: terms.version,
      tenants: tenants.map((m) => ({
        memberId: m.id,
        name: m.profile?.full_name ?? m.profile?.username ?? 'Unknown',
        unit: m.unit?.name ?? null,
        acceptedAt: accepted.get(m.id) ?? null,
      })),
    };
  }

  async updateTerms(ctx: AuthContext, propertyId: string, dto: UpdateTermsDTO) {
    unwrapRows(
      await ctx.db
        .from('properties')
        .update({
          terms: dto.clauses.map(({ title, body, required }) => ({
            title,
            body,
            required,
          })),
          terms_enabled: dto.enabled,
        })
        .eq('id', propertyId)
        .select('id'),
    );
    return this.getTerms(ctx, propertyId);
  }

  async resetTerms(ctx: AuthContext, propertyId: string) {
    unwrapRows(
      await ctx.db
        .from('properties')
        .update({ terms: null })
        .eq('id', propertyId)
        .select('id'),
    );
    return this.getTerms(ctx, propertyId);
  }
}
