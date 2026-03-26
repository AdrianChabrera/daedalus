import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Eliminar, solo para prueba de conexión entre frontend y backend
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on: http://localhost:${port}`);
}
bootstrap();
