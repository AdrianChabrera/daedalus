import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComponentsModule } from './components/components.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BuildsModule } from './builds/builds.module';
import { CompatibilityModule } from './compatibility/compatibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env'] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ComponentsModule,
    AuthModule,
    UsersModule,
    BuildsModule,
    CompatibilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
