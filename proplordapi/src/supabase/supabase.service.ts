import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const noSession = { persistSession: false, autoRefreshToken: false };

@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly key: string;
  private readonly secretKey?: string;
  private adminClient?: SupabaseClient;

  /** Shared anonymous client for read-only checks; never sign in with it. */
  readonly anon: SupabaseClient;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('DB_SUPABASE_URL');
    this.key = config.getOrThrow<string>('DB_SUPABASE_PUBLISHABLE_KEY');
    this.secretKey = config.get<string>('DB_SUPABASE_SECRET_KEY');
    this.anon = createClient(this.url, this.key, { auth: noSession });
  }

  /** New anonymous client; sign-in state lives in memory, so never share one across requests. */
  fresh(): SupabaseClient {
    return createClient(this.url, this.key, { auth: noSession });
  }

  /** Client acting as the user owning `accessToken`, so RLS policies apply to them. */
  forUser(accessToken: string): SupabaseClient {
    return createClient(this.url, this.key, {
      auth: noSession,
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  /** Bypasses RLS. Only for flows with no acting user (account creation, invite tokens). */
  get admin(): SupabaseClient {
    if (!this.secretKey) {
      throw new ServiceUnavailableException(
        'DB_SUPABASE_SECRET_KEY is not configured on the API',
      );
    }
    this.adminClient ??= createClient(this.url, this.secretKey, {
      auth: noSession,
    });
    return this.adminClient;
  }
}
