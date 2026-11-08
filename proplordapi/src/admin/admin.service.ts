import { Injectable } from '@nestjs/common';
import { unwrap } from '../common/db-error';
import { SupabaseService } from '../supabase/supabase.service';

/** Platform-wide reporting. Reads through the service role, so only call it behind the admin guard. */
@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  stats() {
    return this.rpc('admin_platform_stats');
  }

  landlords() {
    return this.rpc('admin_landlords');
  }

  properties() {
    return this.rpc('admin_properties');
  }

  private async rpc(fn: string) {
    return unwrap(await this.supabase.admin.rpc(fn));
  }
}
