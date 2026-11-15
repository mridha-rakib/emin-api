import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MongoServerError } from 'mongodb';

/** Turns MongoDB duplicate-key errors (E11000) into a 409 with the conflicting field instead of a generic 500. */
@Catch(MongoServerError)
export class MongoDuplicateKeyFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    if (exception.code === 11000) {
      const field = Object.keys((exception as MongoServerError & { keyValue?: Record<string, unknown> }).keyValue ?? {})[0] ?? 'value';
      const conflict: HttpException = new ConflictException(`A record with this ${field} already exists.`);
      return super.catch(conflict, host);
    }
    return super.catch(exception, host);
  }
}
