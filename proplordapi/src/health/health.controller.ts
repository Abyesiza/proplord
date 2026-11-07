import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  // Succeeds once the schema is applied: RLS returns zero rows to anon, a missing table errors.
  @Get()
  async check() {
    // HEAD requests drop PostgREST error bodies, so use a real GET.
    const { error } = await this.supabase.anon
      .from('properties')
      .select('id')
      .limit(1);
    if (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: error.message,
      });
    }
    return { status: 'ok', database: 'ok' };
  }
}
