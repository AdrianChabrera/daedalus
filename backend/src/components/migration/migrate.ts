import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Cpu } from '../entities/main-entities/cpu.entity';
import { Ram } from '../entities/main-entities/ram.entity';
import { StorageDrive } from '../entities/main-entities/storage.entity';
import { Octokit } from '@octokit/rest';
import { Gpu } from '../entities/main-entities/gpu.entity';
import { CpuCooler } from '../entities/main-entities/cpu-cooler.entity';
import { PowerSupply } from '../entities/main-entities/power-supply.entity';
import { PcCase } from '../entities/main-entities/pc-case.entity';
import {
  mapCase,
  mapCpu,
  mapCpuCooler,
  mapFan,
  mapGpu,
  mapKeyboard,
  mapMonitor,
  mapMotherboard,
  mapMouse,
  mapPowerSupply,
  mapRam,
  mapStorage,
} from './mappers';
import { Fan } from '../entities/main-entities/fan.entity';
import { Motherboard } from '../entities/main-entities/motherboard.entity';
import { Monitor } from '../entities/main-entities/monitor.entity';
import { Mouse } from '../entities/main-entities/mouse.entity';
import { Keyboard } from '../entities/main-entities/keyboard.entity';
import { M2Slot } from '../entities/secondary-entities/m2-slot.entity';
import { PcieSlot } from '../entities/secondary-entities/pcie-slot.entity';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

type Mapper<T extends ObjectLiteral> = (
  raw: Record<string, unknown>,
  dataSource: DataSource,
) => T | Promise<T>;

interface CategoryConfig<T extends ObjectLiteral> {
  repoFolder: string;
  entity: EntityTarget<T>;
  mapper: Mapper<T>;
  conflictPath: keyof T & string;
}

const CATEGORIES: CategoryConfig<ObjectLiteral>[] = [
  {
    repoFolder: 'CPU',
    entity: Cpu,
    mapper: mapCpu,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'RAM',
    entity: Ram,
    mapper: mapRam,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'Storage',
    entity: StorageDrive,
    mapper: mapStorage,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'GPU',
    entity: Gpu,
    mapper: mapGpu,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'CPUCooler',
    entity: CpuCooler,
    mapper: mapCpuCooler,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'PSU',
    entity: PowerSupply,
    mapper: mapPowerSupply,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'PCCase',
    entity: PcCase,
    mapper: mapCase,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'CaseFan',
    entity: Fan,
    mapper: mapFan,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'Motherboard',
    entity: Motherboard,
    mapper: mapMotherboard,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'Monitor',
    entity: Monitor,
    mapper: mapMonitor,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'Mouse',
    entity: Mouse,
    mapper: mapMouse,
    conflictPath: 'buildcoresId',
  },
  {
    repoFolder: 'Keyboard',
    entity: Keyboard,
    mapper: mapKeyboard,
    conflictPath: 'buildcoresId',
  },
];

const REPO_OWNER = 'buildcores';
const REPO_NAME = 'buildcores-open-db';
const OPEN_DB_PATH = 'open-db';
const BATCH_SIZE = 10;
const BATCH_DELAY = 0;

function createDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5433', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [
      Cpu,
      Ram,
      StorageDrive,
      Gpu,
      CpuCooler,
      PowerSupply,
      PcCase,
      Fan,
      Motherboard,
      Monitor,
      Mouse,
      Keyboard,
      PcieSlot,
      M2Slot,
    ],
    synchronize: true,
    logging: false,
  });
}

function createOctokit(): Octokit {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'buildcores-migration/3.0',
  });
}

async function getRepoTree(
  octokit: Octokit,
): Promise<Array<{ name: string; path: string; folder: string }>> {
  const { data: refData } = await octokit.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: 'heads/main',
  });

  const { data: treeData } = await octokit.git.getTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tree_sha: refData.object.sha,
    recursive: '1',
  });

  if (treeData.truncated) {
    console.warn(
      'Repository tree truncated by the API, some files may be missing.',
    );
  }

  return (treeData.tree ?? [])
    .filter(
      (item) =>
        item.type === 'blob' &&
        item.path?.startsWith(`${OPEN_DB_PATH}/`) &&
        item.path.endsWith('.json'),
    )
    .map((item) => ({
      name: item.path.split('/').pop()!,
      path: item.path,
      folder: item.path.split('/')[1],
    }));
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${url}`,
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} para ${url}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

async function migrateCategory(
  octokit: Octokit,
  dataSource: DataSource,
  config: CategoryConfig<ObjectLiteral>,
  files: Array<{ name: string; path: string }>,
): Promise<{ processed: number; skipped: number; errors: number }> {
  console.log(`\n[${config.repoFolder}] ${files.length} files found.`);

  if (files.length === 0) {
    console.error(`[${config.repoFolder}] No files found.`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const repo: Repository<ObjectLiteral> = dataSource.getRepository(
    config.entity,
  );
  let processed = 0,
    skipped = 0,
    errors = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        try {
          const rawJson = await fetchJson(file.path);

          if (!rawJson.opendb_id || typeof rawJson.opendb_id !== 'string') {
            console.warn(`  [skip] ${file.name}: without opendb_id`);
            skipped++;
            return;
          }

          const entity = await config.mapper(rawJson, dataSource);

          await repo.upsert(entity, { conflictPaths: [config.conflictPath] });
          processed++;

          if (processed % 10 === 0) {
            console.log(
              `  [${config.repoFolder}] ${processed}/${files.length} processed...`,
            );
          }
        } catch (err) {
          console.error(`[error] ${file.name}: ${(err as Error).message}`);
          errors++;
        }
      }),
    );

    if (i + BATCH_SIZE < files.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY));
    }
  }

  console.log(
    `[${config.repoFolder}] ${processed} processed, ${skipped} skipped, ${errors} errors.`,
  );
  return { processed, skipped, errors };
}

async function runMigration(): Promise<void> {
  const dataSource = createDataSource();
  await dataSource.initialize();
  console.log('Conection to database established.\n');

  const octokit = createOctokit();

  console.log('Obtaining repository tree...');
  const allFiles = await getRepoTree(octokit);
  console.log(`${allFiles.length} JSON files found in total.\n`);

  let totalProcessed = 0,
    totalSkipped = 0,
    totalErrors = 0;

  for (const config of CATEGORIES) {
    const files = allFiles.filter((f) => f.folder === config.repoFolder);

    const { processed, skipped, errors } = await migrateCategory(
      octokit,
      dataSource,
      config,
      files,
    );
    totalProcessed += processed;
    totalSkipped += skipped;
    totalErrors += errors;
  }

  const sql = fs.readFileSync(
    path.join(__dirname, 'trgm_migration.sql'),
    'utf-8',
  );
  await dataSource.query(sql);
  console.log('TRGM migration applied.');

  await dataSource.destroy();

  console.log('\n══════════════════════════════════════════');
  console.log('MIGRATION COMPLETED');
  console.log(`  Processed  : ${totalProcessed}`);
  console.log(`  Skipped    : ${totalSkipped}`);
  console.log(`  Errors     : ${totalErrors}`);
  console.log('══════════════════════════════════════════');
}

runMigration().catch((err) => {
  console.error('Error at migration:', (err as Error).message);
  process.exit(1);
});
