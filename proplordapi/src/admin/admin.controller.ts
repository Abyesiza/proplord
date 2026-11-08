import { Controller, Get } from '@nestjs/common';
import { Authed } from '../auth/auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Authed('admin')
  @Get('overview')
  overview() {
    return this.admin.stats();
  }

  @Authed('admin')
  @Get('landlords')
  landlords() {
    return this.admin.landlords();
  }

  @Authed('admin')
  @Get('properties')
  properties() {
    return this.admin.properties();
  }
}
