import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

let container: StartedPostgreSqlContainer;

export async function startTestDatabase(): Promise<TypeOrmModuleOptions> {
  container = await new PostgreSqlContainer('postgres:16').start();

  return {
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    autoLoadEntities: true,
    synchronize: true,
  };
}

export async function stopTestDatabase(): Promise<void> {
  await container?.stop();
}
