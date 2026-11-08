import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { Auth, Authed, type AuthContext } from '../auth/auth.guard';
import {
  CreatePropertyDTO,
  CreateUnitDTO,
  UpdatePropertyDTO,
  UpdateTermsDTO,
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

  @Authed()
  @Get('properties/:id/terms')
  getTerms(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.getTerms(ctx, id);
  }

  @Authed('landlord')
  @Put('properties/:id/terms')
  updateTerms(
    @Auth() ctx: AuthContext,
    @Param('id', uuid) id: string,
    @Body() dto: UpdateTermsDTO,
  ) {
    return this.properties.updateTerms(ctx, id, dto);
  }

  @Authed('landlord')
  @Post('properties/:id/terms/reset')
  @HttpCode(200)
  resetTerms(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.resetTerms(ctx, id);
  }

  @Authed('tenant')
  @Post('properties/:id/terms/accept')
  @HttpCode(200)
  acceptTerms(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.acceptTerms(ctx, id);
  }

  @Authed('landlord', 'caretaker')
  @Get('properties/:id/terms/acceptances')
  listAcceptances(@Auth() ctx: AuthContext, @Param('id', uuid) id: string) {
    return this.properties.listAcceptances(ctx, id);
  }
}
