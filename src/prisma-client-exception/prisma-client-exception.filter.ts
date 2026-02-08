import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;

    const ctx = host.switchToHttp();

    switch (exception.code) {
      case 'P2002': {
        const statusCode = HttpStatus.CONFLICT;
        const target = exception.meta?.target;
        const formattedFields = Array.isArray(target)
          ? target.map((field) => `\`${String(field)}\``).join(', ')
          : typeof target === 'string'
            ? target
            : undefined;

        const message = formattedFields
          ? `Unique constraint failed on the fields: (${formattedFields})`
          : 'Unique constraint failed.';

        httpAdapter.reply(
          ctx.getResponse(),
          { statusCode, message },
          statusCode,
        );
        return;
      }

      case 'P2025': {
        const statusCode = HttpStatus.NOT_FOUND;
        const message =
          typeof exception.meta?.cause === 'string'
            ? exception.meta.cause
            : 'Record not found.';

        httpAdapter.reply(
          ctx.getResponse(),
          { statusCode, message },
          statusCode,
        );
        return;
      }

      default:
        super.catch(exception, host);
    }
  }
}
