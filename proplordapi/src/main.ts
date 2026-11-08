import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // WEB_ORIGIN is the frontend; CORS_ORIGINS adds more, comma separated.
  const origins = [
    process.env.WEB_ORIGIN,
    ...(process.env.CORS_ORIGINS ?? '').split(','),
  ]
    .map((origin) => origin?.trim().replace(/\/+$/, ''))
    .filter((origin): origin is string => Boolean(origin));
  app.enableCors({
    origin: origins.length ? origins : ['http://localhost:3000'],
  });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
