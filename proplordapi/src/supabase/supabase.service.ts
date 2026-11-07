import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly key: string;

  /** Anonymous client; RLS applies as the `anon` role. */
  readonly anon: SupabaseClient;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('DB_SUPABASE_URL');
    this.key = config.getOrThrow<string>('DB_SUPABASE_PUBLISHABLE_KEY');
    this.anon = createClient(this.url, this.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /** Client acting as the user owning `accessToken`, so RLS policies apply to them. */
  forUser(accessToken: string): SupabaseClient {
    return createClient(this.url, this.key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
