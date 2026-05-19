import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { startTestDatabase, stopTestDatabase } from './test-database';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ComponentsModule } from '../src/components/components.module';
import { BuildsModule } from '../src/builds/builds.module';
import { CompatibilityModule } from '../src/compatibility/compatibility.module';
import { PublishModule } from '../src/publish/publish.module';
import { FavoritesModule } from '../src/favorites/favorites.module';
import { ReviewsModule } from '../src/reviews/reviews.module';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

let app: INestApplication;

export async function createTestApp(): Promise<INestApplication> {
  const dbOptions = await startTestDatabase();

  const moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
      TypeOrmModule.forRoot(dbOptions),
      AuthModule,
      UsersModule,
      ComponentsModule,
      BuildsModule,
      CompatibilityModule,
      PublishModule,
      FavoritesModule,
      ReviewsModule,
    ],
  })
    .overrideProvider(CloudinaryService)
    .useValue({
      uploadImage: jest
        .fn()
        .mockResolvedValue('https://fake-url.com/image.jpg'),
      deleteImage: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

  app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

export async function closeTestApp(): Promise<void> {
  await app?.close();
  await stopTestDatabase();
}
