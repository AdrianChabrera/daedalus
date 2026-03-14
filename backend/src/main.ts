import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Eliminar, solo para prueba de conexión entre frontend y backend
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
