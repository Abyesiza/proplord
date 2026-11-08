import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext } from '../auth/auth.guard';
import { unwrap } from '../common/db-error';
import { SupabaseService } from '../supabase/supabase.service';

const WHO = 'id, unit:units(name), profile:profiles(full_name, username)';

interface ChargeRow {
  amount: number;
  due_date: string;
  payments: { amount: number; status: string }[];
}

const balanceOf = (charge: ChargeRow) =>
  charge.amount -
  charge.payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

/** Aggregates are computed under the caller's RLS, so tenants only ever see their own figures. */
@Injectable()
export class DashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Who has paid for a month (YYYY-MM, default current). Admins see every property;
   * landlords and caretakers only the ones RLS lets them read.
   */
  async rentTracker(ctx: AuthContext, month?: string, propertyId?: string) {
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('month must be YYYY-MM');
    }
    const profile = unwrap(
      await ctx.db
        .from('profiles')
        .select('role')
        .eq('id', ctx.userId)
        .single<{ role: string }>(),
    );

    let scope: string[] | null = null;
    if (profile.role !== 'admin') {
      const owned = unwrap(await ctx.db.from('properties').select('id'));
      scope = (owned as { id: string }[]).map((p) => p.id);
      if (propertyId && !scope.includes(propertyId)) {
        throw new NotFoundException('Not found');
      }
    }

    return unwrap(
      await this.supabase.admin.rpc('rent_tracker', {
        p_month: `${month ?? new Date().toISOString().slice(0, 7)}-01`,
        p_scope: scope,
        p_property: propertyId ?? null,
      }),
    );
  }

  async summary(ctx: AuthContext, propertyId?: string) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const today = new Date().toISOString().slice(0, 10);

    /** Narrows a query to the selected property; RLS still limits it to what the caller may see. */
    const scope = <T>(query: T, column = 'property_id'): T =>
      propertyId
        ? (query as unknown as { eq(c: string, v: string): T }).eq(
            column,
            propertyId,
          )
        : query;

    const [properties, units, tenants, monthPayments, open, recent] =
      await Promise.all([
        scope(ctx.db.from('properties').select('id, currency'), 'id'),
        scope(ctx.db.from('units').select('id', { count: 'exact' }).limit(0)),
        scope(
          ctx.db
            .from('property_members')
            .select('id', { count: 'exact' })
            .eq('role', 'tenant')
            .eq('status', 'active')
            .limit(0),
        ),
        scope(
          ctx.db
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('paid_at', monthStart.toISOString()),
        ),
        scope(
          ctx.db
            .from('charges')
            .select(
              `*, member:property_members(${WHO}), payments(amount, status)`,
            )
            .in('status', ['pending', 'partial', 'overdue'])
            .order('due_date'),
        ),
        scope(
          ctx.db
            .from('payments')
            .select(
              `*, member:property_members(${WHO}), receipt:receipts(id, receipt_number)`,
            )
            .order('paid_at', { ascending: false })
            .limit(5),
        ),
      ]);

    const propertyRows = unwrap(properties) as { currency: string }[];
    const openCharges = (unwrap(open) as (ChargeRow & object)[]).map(
      (charge) => ({ ...charge, balance: balanceOf(charge) }),
    );
    const unpaid = openCharges.filter((c) => c.balance > 0);

    return {
      currency: propertyRows[0]?.currency ?? 'UGX',
      properties: propertyRows.length,
      units: units.count ?? 0,
      tenants: tenants.count ?? 0,
      collectedThisMonth: (
        unwrap(monthPayments) as { amount: number }[]
      ).reduce((sum, p) => sum + p.amount, 0),
      outstanding: unpaid.reduce((sum, c) => sum + c.balance, 0),
      overdueCount: unpaid.filter((c) => c.due_date < today).length,
      dueSoon: unpaid.slice(0, 5),
      recentPayments: unwrap(recent),
    };
  }
}
