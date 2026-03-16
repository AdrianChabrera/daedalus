import { Socket } from '../entities/secondary-entities/socket.entity';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Cpu } from '../entities/main-entities/cpu.entity';
import { Octokit } from '@octokit/rest';
import { mapCpu } from './mappers/cpu.mapper';

dotenv.config();

const REPO_OWNER = 'buildcores';
const REPO_NAME = 'buildcores-open-db';
const OPEN_DB_PATH = 'open-db';
const CATEGORY = 'CPU';
const BATCH_SIZE = 5;
const BATCH_DELAY = 300;

function createDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5433', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Socket, Cpu],
    synchronize: true,
    logging: false,
  });
}

function createOctoKit(): Octokit {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'buildcores-migration/3.0',
  });
}

async function listJsonFiles(
  octokit: Octokit,
  category: string,
): Promise<Array<{ name: string; path: string }>> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `${OPEN_DB_PATH}/${category}`,
    });

    if (!Array.isArray(data)) return [];

    return data
      .filter((f) => f.type === 'file' && f.name.endsWith('.json'))
      .map((f) => ({ name: f.name, path: f.path }));
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) {
      console.error(`Categoría [${category}] no encontrada en el repositorio.`);
      return [];
    }
    throw err;
  }
}

async function fetchJson(
  octokit: Octokit,
  path: string,
): Promise<Record<string, unknown>> {
  const { data } = await octokit.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
  });

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`Respuesta inesperada para ${path}`);
  }

  const raw = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

async function runMigration(): Promise<void> {
  const dataSource = createDataSource();
  await dataSource.initialize();
  console.log('Conexión a base de datos establecida.');
  const cpuRepo = dataSource.getRepository(Cpu);
  const socketRepository = dataSource.getRepository(Socket);
  const octokit = createOctoKit();

  console.log(`[${CATEGORY}] Obteniendo listado de archivos...`);
  const files = await listJsonFiles(octokit, CATEGORY);

  if (files.length === 0) {
    console.error(`[${CATEGORY}] No se encontraron archivos. Abortando.`);
    await dataSource.destroy();
    return;
  }

  console.log(`[${CATEGORY}] ${files.length} archivos encontrados.\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        try {
          const rawJson = await fetchJson(octokit, file.path);

          if (!rawJson.opendb_id || typeof rawJson.opendb_id !== 'string') {
            console.warn(`  [skip] ${file.name}: sin opendb_id`);
            skipped++;
            return;
          }

          const entity = await mapCpu(rawJson, socketRepository);

          await cpuRepo.upsert(entity, { conflictPaths: ['buildcoresId'] });
          processed++;

          if (processed % 10 === 0) {
            console.log(
              `  [${CATEGORY}] ${processed}/${files.length} procesados...`,
            );
          }
        } catch (err) {
          console.error(`  [error] ${file.name}: ${(err as Error).message}`);
          errors++;
        }
      }),
    );

    if (i + BATCH_SIZE < files.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY));
    }
  }

  await dataSource.destroy();

  console.log('\n══════════════════════════════════════════');
  console.log('MIGRACIÓN COMPLETADA');
  console.log(`  Categoría  : ${CATEGORY}`);
  console.log(`  Procesados : ${processed}`);
  console.log(`  Omitidos   : ${skipped}`);
  console.log(`  Errores    : ${errors}`);
  console.log('══════════════════════════════════════════');
}

runMigration().catch((err) => {
  console.error('Error en migración:', (err as Error).message);
  process.exit(1);
});
