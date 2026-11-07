import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  Auth,
  Authed,
  bearerToken,
  type AuthContext,
} from '../auth/auth.guard';
import { AcceptInvitationDTO, CreateInvitationDTO } from './invitations.dto';
import { InvitationsService } from './invitations.service';

const uuid = new ParseUUIDPipe();
const strict = { default: { limit: 10, ttl: 60_000 } };

@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Authed('landlord')
  @Post('properties/:propertyId/invitations')
  create(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
    @Body() dto: CreateInvitationDTO,
  ) {
    return this.invitations.create(ctx, propertyId, dto);
  }

  @Authed('landlord')
  @Get('properties/:propertyId/invitations')
  list(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
  ) {
    return this.invitations.list(ctx, propertyId);
  }

  @Authed('landlord')
  @Delete('invitations/:id')
  revoke(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.invitations.revoke(ctx, id);
  }

  /** Public: lets the invite page show who invited whom before signing up. */
  @Throttle(strict)
  @Get('invitations/preview/:token')
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  /** Public. Send a bearer token to accept as an existing account; otherwise a new account is created. */
  @Throttle(strict)
  @HttpCode(200)
  @Post('invitations/accept')
  accept(
    @Body() dto: AcceptInvitationDTO,
    @Headers('authorization') authorization?: string,
  ) {
    return this.invitations.accept(dto.token, dto, bearerToken(authorization));
  }
}
