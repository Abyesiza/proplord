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
  const origins = [
    process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    'https://proplord.vercel.app',
  ];
  app.enableCors({ origin: origins });
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
