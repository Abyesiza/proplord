import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

export interface FailureEnvelope {
  status: 'failed';
  error: { code: string; message: string; details?: unknown };
}

/** Problem-details style error envelope: `{ status: 'failed', error: { code, message, details? } }`. */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const known = exception instanceof HttpException;
    if (!known) this.logger.error(exception);

    const status = known
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = known ? exception.getResponse() : undefined;
    const raw =
      typeof body === 'object' && body !== null
        ? (body as { message?: unknown }).message
        : body;

    const details = Array.isArray(raw) ? raw : undefined;
    const message = details
      ? 'Validation failed'
      : typeof raw === 'string'
        ? raw
        : 'Internal server error';

    const failure: FailureEnvelope = {
      status: 'failed',
      error: {
        code: HttpStatus[status] ?? 'ERROR',
        message,
        ...(details && { details }),
      },
    };
    res.status(status).json(failure);
  }
}
