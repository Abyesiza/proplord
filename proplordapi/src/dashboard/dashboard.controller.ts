import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { Auth, Authed, type AuthContext } from '../auth/auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Authed()
  @Get('summary')
  summary(
    @Auth() ctx: AuthContext,
    @Query('propertyId', new ParseUUIDPipe({ optional: true }))
    propertyId?: string,
  ) {
    return this.dashboard.summary(ctx, propertyId);
  }

  @Authed('admin', 'landlord', 'caretaker')
  @Get('rent-tracker')
  rentTracker(
    @Auth() ctx: AuthContext,
    @Query('month') month?: string,
    @Query('propertyId', new ParseUUIDPipe({ optional: true }))
    propertyId?: string,
  ) {
    return this.dashboard.rentTracker(ctx, month, propertyId);
  }
}
