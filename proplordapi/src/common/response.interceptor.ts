import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { camelize } from './case';

export interface SuccessEnvelope<T = unknown> {
  status: 'success';
  data: T;
}

/** Wraps every successful response as `{ status: 'success', data }` with camelCase keys. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessEnvelope> {
    return next
      .handle()
      .pipe(map((data) => ({ status: 'success', data: camelize(data) })));
  }
}
