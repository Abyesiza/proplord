import { BadRequestException } from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import { unwrap } from './db-error';

/** 404s unless the caller owns the property (RLS hides other people's rows). */
export async function assertOwnsProperty(ctx: AuthContext, propertyId: string) {
  unwrap(
    await ctx.db
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('owner_id', ctx.userId)
      .single(),
  );
}

export async function assertUnitInProperty(
  ctx: AuthContext,
  propertyId: string,
  unitId: string,
) {
  const { data } = await ctx.db
    .from('units')
    .select('id')
    .eq('id', unitId)
    .eq('property_id', propertyId)
    .maybeSingle();
  if (!data)
    throw new BadRequestException('Unit does not belong to this property');
}

export async function assertMemberInProperty(
  ctx: AuthContext,
  propertyId: string,
  memberId: string,
) {
  const { data } = await ctx.db
    .from('property_members')
    .select('id')
    .eq('id', memberId)
    .eq('property_id', propertyId)
    .maybeSingle();
  if (!data)
    throw new BadRequestException('Member does not belong to this property');
}
