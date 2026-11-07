import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import { toColumns } from '../common/case';
import { unwrap, unwrapRows } from '../common/db-error';
import {
  CreatePropertyDTO,
  CreateUnitDTO,
  UpdatePropertyDTO,
  UpdateUnitDTO,
} from './properties.dto';

@Injectable()
export class PropertiesService {
  async create(ctx: AuthContext, dto: CreatePropertyDTO) {
    return unwrap(
      await ctx.db
        .from('properties')
        .insert({ ...toColumns(dto), owner_id: ctx.userId })
        .select()
        .single(),
    );
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
