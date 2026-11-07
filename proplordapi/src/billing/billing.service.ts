import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import { assertMemberInProperty, assertOwnsProperty } from '../common/access';
import { toColumns } from '../common/case';
import { unwrap, unwrapRows } from '../common/db-error';
import { CreateChargeDTO, CreatePaymentDTO } from './billing.dto';

const WHO = 'id, unit:units(name), profile:profiles(full_name, username)';
const CHARGE_SELECT = `*, member:property_members(${WHO})`;
const PAYMENT_SELECT = `*, member:property_members(${WHO}), charge:charges(description, amount, due_date), receipt:receipts(id, receipt_number, issued_at)`;
const RECEIPT_SELECT = `*, property:properties(name, address_line, city, country, currency), payment:payments(amount, method, reference, note, paid_at, charge:charges(description), member:property_members(${WHO}))`;

@Injectable()
export class BillingService {
  // Charges

  async listCharges(ctx: AuthContext, propertyId?: string, memberId?: string) {
    let query = ctx.db
      .from('charges')
      .select(CHARGE_SELECT)
      .order('due_date', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    if (memberId) query = query.eq('member_id', memberId);
    return unwrap(await query);
  }

  async createCharge(
    ctx: AuthContext,
    propertyId: string,
    dto: CreateChargeDTO,
  ) {
    await assertOwnsProperty(ctx, propertyId);
    await assertMemberInProperty(ctx, propertyId, dto.memberId);
    return unwrap(
      await ctx.db
        .from('charges')
        .insert({ ...toColumns(dto), property_id: propertyId })
        .select(CHARGE_SELECT)
        .single(),
    );
  }

  async cancelCharge(ctx: AuthContext, id: string) {
    const rows = unwrapRows(
      await ctx.db
        .from('charges')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .neq('status', 'paid')
        .select(CHARGE_SELECT),
    );
    return rows[0];
  }

  // Payments

  async listPayments(ctx: AuthContext, propertyId?: string) {
    let query = ctx.db
      .from('payments')
      .select(PAYMENT_SELECT)
      .order('paid_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    return unwrap(await query);
  }

  async getPayment(ctx: AuthContext, id: string) {
    return unwrap(
      await ctx.db
        .from('payments')
        .select(PAYMENT_SELECT)
        .eq('id', id)
        .single(),
    );
  }

  /** Completed payments get a receipt from a DB trigger. */
  async recordPayment(
    ctx: AuthContext,
    propertyId: string,
    dto: CreatePaymentDTO,
  ) {
    await assertOwnsProperty(ctx, propertyId);
    await assertMemberInProperty(ctx, propertyId, dto.memberId);
    if (dto.chargeId) {
      const { data } = await ctx.db
        .from('charges')
        .select('id')
        .eq('id', dto.chargeId)
        .eq('property_id', propertyId)
        .eq('member_id', dto.memberId)
        .neq('status', 'cancelled')
        .maybeSingle();
      if (!data) {
        throw new BadRequestException('Charge does not match this member');
      }
    }

    const payment = unwrap(
      await ctx.db
        .from('payments')
        .insert({
          ...toColumns(dto),
          property_id: propertyId,
          recorded_by: ctx.userId,
        })
        .select('id')
        .single<{ id: string }>(),
    );
    // Re-read: the receipt is created by an AFTER trigger and isn't visible to the insert's RETURNING.
    return this.getPayment(ctx, payment.id);
  }

  // Receipts

  async listReceipts(ctx: AuthContext, propertyId?: string) {
    let query = ctx.db
      .from('receipts')
      .select(RECEIPT_SELECT)
      .order('issued_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    return unwrap(await query);
  }

  async getReceipt(ctx: AuthContext, id: string) {
    return unwrap(
      await ctx.db
        .from('receipts')
        .select(RECEIPT_SELECT)
        .eq('id', id)
        .single(),
    );
  }
}
