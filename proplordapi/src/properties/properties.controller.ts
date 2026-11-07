import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth, Authed, type AuthContext } from '../auth/auth.guard';
import {
  CreatePropertyDTO,
  CreateUnitDTO,
  UpdatePropertyDTO,
  UpdateUnitDTO,
} from './properties.dto';
import { PropertiesService } from './properties.service';

const uuid = new ParseUUIDPipe();

@Controller()
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Authed('landlord')
  @Post('properties')
  create(@Auth() ctx: AuthContext, @Body() dto: CreatePropertyDTO) {
    return this.properties.create(ctx, dto);
  }

  @Authed()
  @Get('properties')
  list(@Auth() ctx: AuthContext) {
    return this.properties.list(ctx);
  }

  @Authed()
  @Get('properties/:id')
  get(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.get(ctx, id);
  }

  @Authed('landlord')
  @Patch('properties/:id')
  update(
    @Auth() ctx: AuthContext,
    @Param('id', uuid) id: string,
    @Body() dto: UpdatePropertyDTO,
  ) {
    return this.properties.update(ctx, id, dto);
  }

  @Authed('landlord')
  @Delete('properties/:id')
  remove(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.remove(ctx, id);
  }

  @Authed()
  @Get('properties/:id/units')
  listUnits(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.listUnits(ctx, id);
  }

  @Authed('landlord')
  @Post('properties/:id/units')
  createUnit(
    @Auth() ctx: AuthContext,
    @Param('id', uuid) id: string,
    @Body() dto: CreateUnitDTO,
  ) {
    return this.properties.createUnit(ctx, id, dto);
  }

  @Authed('landlord')
  @Patch('units/:id')
  updateUnit(
    @Auth() ctx: AuthContext,
    @Param('id', uuid) id: string,
    @Body() dto: UpdateUnitDTO,
  ) {
    return this.properties.updateUnit(ctx, id, dto);
  }

  @Authed('landlord')
  @Delete('units/:id')
  removeUnit(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.removeUnit(ctx, id);
  }
}
