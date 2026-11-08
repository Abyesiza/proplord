import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

export type UserRole = 'admin' | 'landlord' | 'caretaker' | 'tenant';

/** Authenticated caller; `db` is a client whose queries run under the caller's RLS. */
export interface AuthContext {
  userId: string;
  email?: string;
  token: string;
  db: SupabaseClient;
}

const ROLES_KEY = 'roles';

export function bearerToken(header?: string): string | undefined {
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { auth?: AuthContext }>();
    const token = bearerToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    const { data, error } = await this.supabase.fresh().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid session');

    const db = this.supabase.forUser(token);
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (roles?.length) {
      const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single<{ role: UserRole }>();
      if (!profile || !roles.includes(profile.role)) {
        throw new ForbiddenException(`Requires role: ${roles.join(' or ')}`);
      }
    }

    req.auth = { userId: data.user.id, email: data.user.email, token, db };
    return true;
  }
}

/** Requires a valid session, optionally restricted to the given roles. */
export const Authed = (...roles: UserRole[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(AuthGuard));

export const Auth = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthContext =>
    context.switchToHttp().getRequest<{ auth: AuthContext }>().auth,
);
