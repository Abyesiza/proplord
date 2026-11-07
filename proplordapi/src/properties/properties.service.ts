import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import { toColumns } from '../common/case';
import { unwrap, unwrapRows } from '../common/db-error';
import {
  CreatePropertyDTO,
  CreateUnitDTO,
  PROPERTY_TYPES,
  UpdatePropertyDTO,
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
}
