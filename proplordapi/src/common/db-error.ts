import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';

/** Returns `data` or throws the HTTP error matching a PostgREST failure. */
export function unwrap<T>(result: {
  data: T | null;
  error: PostgrestError | null;
}): T {
  const { data, error } = result;
  if (error) {
    switch (error.code) {
      case 'PGRST116':
        throw new NotFoundException('Not found');
      case '42501':
        throw new ForbiddenException('You do not have access to this resource');
      case '23505':
        throw new ConflictException('Already exists');
      case '23503':
      case '23514':
      case '22P02':
        throw new BadRequestException(error.message);
      default:
        throw new InternalServerErrorException(error.message);
    }
  }
  if (data === null) throw new NotFoundException('Not found');
  return data;
}

/** For writes that RLS may silently filter out: an empty result means no access or no match. */
export function unwrapRows<T>(result: {
  data: T[] | null;
  error: PostgrestError | null;
}): T[] {
  const rows = unwrap(result);
  if (rows.length === 0) throw new NotFoundException('Not found');
  return rows;
}
