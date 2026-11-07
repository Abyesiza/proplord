import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Auth, Authed, type AuthContext } from '../auth/auth.guard';
import { CreateChargeDTO, CreatePaymentDTO } from './billing.dto';
import { BillingService } from './billing.service';

const uuid = new ParseUUIDPipe();
const optionalUuid = new ParseUUIDPipe({ optional: true });

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Authed()
  @Get('charges')
  listAllCharges(
    @Auth() ctx: AuthContext,
    @Query('propertyId', optionalUuid) propertyId?: string,
    @Query('memberId', optionalUuid) memberId?: string,
  ) {
    return this.billing.listCharges(ctx, propertyId, memberId);
  }

  @Authed()
  @Get('properties/:propertyId/charges')
  listCharges(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
    @Query('memberId', optionalUuid) memberId?: string,
  ) {
    return this.billing.listCharges(ctx, propertyId, memberId);
  }

  @Authed('landlord')
  @Post('properties/:propertyId/charges')
  createCharge(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
    @Body() dto: CreateChargeDTO,
  ) {
    return this.billing.createCharge(ctx, propertyId, dto);
  }

  @Authed('landlord')
  @Post('charges/:id/cancel')
  cancelCharge(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.billing.cancelCharge(ctx, id);
  }

  @Authed()
  @Get('payments')
  listPayments(
    @Auth() ctx: AuthContext,
    @Query('propertyId', optionalUuid) propertyId?: string,
  ) {
    return this.billing.listPayments(ctx, propertyId);
  }

  @Authed()
  @Get('payments/:id')
  getPayment(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.billing.getPayment(ctx, id);
  }

  @Authed('landlord')
  @Post('properties/:propertyId/payments')
  recordPayment(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
    @Body() dto: CreatePaymentDTO,
  ) {
    return this.billing.recordPayment(ctx, propertyId, dto);
  }

  @Authed()
  @Get('receipts')
  listReceipts(
    @Auth() ctx: AuthContext,
    @Query('propertyId', optionalUuid) propertyId?: string,
  ) {
    return this.billing.listReceipts(ctx, propertyId);
  }

  @Authed()
  @Get('receipts/:id')
  getReceipt(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.billing.getReceipt(ctx, id);
  }
}
