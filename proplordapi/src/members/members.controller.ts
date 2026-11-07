import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth, Authed, type AuthContext } from '../auth/auth.guard';
import { CreateMemberDTO, UpdateMemberDTO } from './members.dto';
import { MembersService } from './members.service';

const uuid = new ParseUUIDPipe();

@Controller()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Authed()
  @Get('members')
  listAll(
    @Auth() ctx: AuthContext,
    @Query('propertyId', new ParseUUIDPipe({ optional: true }))
    propertyId?: string,
  ) {
    return this.members.list(ctx, propertyId);
  }

  @Authed()
  @Get('properties/:propertyId/members')
  list(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
  ) {
    return this.members.list(ctx, propertyId);
  }

  @Authed('landlord')
  @Post('properties/:propertyId/members')
  create(
    @Auth() ctx: AuthContext,
    @Param('propertyId', uuid) propertyId: string,
    @Body() dto: CreateMemberDTO,
  ) {
    return this.members.createWithCredentials(ctx, propertyId, dto);
  }

  @Authed('landlord')
  @Patch('members/:id')
  update(
    @Auth() ctx: AuthContext,
    @Param('id', uuid) id: string,
    @Body() dto: UpdateMemberDTO,
  ) {
    return this.members.update(ctx, id, dto);
  }

  @Authed('landlord')
  @Delete('members/:id')
  remove(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.members.remove(ctx, id);
  }
}
