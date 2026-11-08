import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import {
  assertMemberInProperty,
  assertStaffOfProperty,
} from '../common/access';
import { toColumns } from '../common/case';
import { unwrap, unwrapRows } from '../common/db-error';
import {
  installmentAmount,
  isValidDate,
  normalizeStart,
  periodEnd,
  totalFor,
  type Frequency,
} from '../common/periods';
import { CreateChargeDTO, CreatePaymentDTO } from './billing.dto';

const WHO = 'id, unit:units(name), profile:profiles(full_name, username)';
const CHARGE_SELECT = `*, member:property_members(${WHO})`;
const PAYMENT_SELECT = `*, member:property_members(${WHO}), charge:charges(description, amount, due_date), receipt:receipts(id, receipt_number, issued_at)`;
const RECEIPT_SELECT = `*, property:properties(name, address_line, city, country, currency), payment:payments(amount, method, reference, note, paid_at, frequency, period_start, period_end, period_count, charge:charges(description), member:property_members(${WHO}))`;

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
    await assertStaffOfProperty(ctx, propertyId);
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
    await assertStaffOfProperty(ctx, propertyId);
    await assertMemberInProperty(ctx, propertyId, dto.memberId);
    const { periodStart, periodCount, ...details } = dto;
    const periods =
      periodStart || periodCount
        ? await this.coveredPeriods(ctx, dto, periodStart, periodCount)
        : {};
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
          ...toColumns(details),
          ...periods,
          property_id: propertyId,
          recorded_by: ctx.userId,
        })
        .select('id')
        .single<{ id: string }>(),
    );
    // Re-read: the receipt is created by an AFTER trigger and isn't visible to the insert's RETURNING.
    return this.getPayment(ctx, payment.id);
  }

  /**
   * Works out the periods a payment covers from the tenant's plan, and insists the amount
   * is exactly periods x per-period amount and that none of them are already paid.
   */
  private async coveredPeriods(
    ctx: AuthContext,
    dto: CreatePaymentDTO,
    periodStart?: string,
    periodCount?: number,
  ) {
    if (!periodStart || !periodCount) {
      throw new BadRequestException(
        'periodStart and periodCount must be sent together',
      );
    }
    if (!isValidDate(periodStart)) {
      throw new BadRequestException('periodStart is not a valid date');
    }

    const member = unwrap(
      await ctx.db
        .from('property_members')
        .select('payment_frequency, agreed_amount, unit:units(rent_amount)')
        .eq('id', dto.memberId)
        .single<{
          payment_frequency: Frequency;
          agreed_amount: number | null;
          unit: { rent_amount: number } | null;
        }>(),
    );
    const installment = installmentAmount(
      member.payment_frequency,
      member.unit?.rent_amount ?? 0,
      member.agreed_amount,
    );
    if (installment <= 0) {
      throw new BadRequestException(
        'This tenant has no rent set. Assign a unit with rent or set an agreed amount first.',
      );
    }
    const expected = totalFor(installment, periodCount);
    if (Math.abs(dto.amount - expected) >= 0.01) {
      throw new BadRequestException(
        `${periodCount} period(s) at ${installment} come to ${expected}, but the amount is ${dto.amount}`,
      );
    }

    const start = normalizeStart(periodStart, member.payment_frequency);
    const end = periodEnd(start, member.payment_frequency, periodCount);
    const { data: overlap } = await ctx.db
      .from('payments')
      .select('id')
      .eq('member_id', dto.memberId)
      .in('status', ['pending', 'completed'])
      .lt('period_start', end)
      .gt('period_end', start)
      .limit(1);
    if (overlap?.length) {
      throw new BadRequestException(
        'Some of these periods are already paid for this tenant',
      );
    }

    return {
      frequency: member.payment_frequency,
      period_start: start,
      period_count: periodCount,
      period_end: end,
    };
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
