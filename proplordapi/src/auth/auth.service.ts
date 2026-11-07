import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Session, User } from '@supabase/supabase-js';
import { unwrap } from '../common/db-error';
import { SupabaseService } from '../supabase/supabase.service';
import type { UserRole } from './auth.guard';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
}

/** Accounts created with only a username get a placeholder address, since Supabase Auth needs one. */
export const usernameToEmail = (username: string) =>
  `${username}@users.proplord.local`;

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async signup(input: { email: string; password: string; fullName: string }) {
    await this.createUser({
      email: input.email,
      password: input.password,
      metadata: { full_name: input.fullName, role: 'landlord' },
    });
    return this.loginWithEmail(input.email, input.password);
  }

  async createUser(input: {
    email: string;
    password: string;
    metadata: Record<string, string>;
  }): Promise<User> {
    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: input.metadata,
    });
    if (error || !data.user) {
      if (error?.code === 'email_exists') {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw new BadRequestException(
        error?.message ?? 'Could not create account',
      );
    }
    return data.user;
  }

  async login(identifier: string, password: string) {
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data } = await this.supabase.admin
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .maybeSingle<{ email: string | null }>();
      if (!data?.email) throw new UnauthorizedException('Invalid credentials');
      email = data.email;
    }
    return this.loginWithEmail(email, password);
  }

  async loginWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase
      .fresh()
      .auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.sessionPayload(data.session, data.user.id);
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase
      .fresh()
      .auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Session expired');
    }
    return this.sessionPayload(data.session, data.user.id);
  }

  async profile(token: string, userId: string): Promise<Profile> {
    return unwrap(
      await this.supabase
        .forUser(token)
        .from('profiles')
        .select('id, role, full_name, email, username, phone')
        .eq('id', userId)
        .single<Profile>(),
    );
  }

  private async sessionPayload(session: Session, userId: string) {
    return {
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
      },
      user: await this.profile(session.access_token, userId),
    };
  }
}
