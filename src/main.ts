import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MongoDuplicateKeyFilter } from './common/filters/mongo-duplicate-key.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalFilters(new MongoDuplicateKeyFilter(app.get(HttpAdapterHost).httpAdapter));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
