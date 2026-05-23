import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { runMigration } from './migrate';

import { Cpu } from '../components/entities/main-entities/cpu.entity';
import { Ram } from '../components/entities/main-entities/ram.entity';
import { StorageDrive } from '../components/entities/main-entities/storage-drive.entity';
import { Gpu } from '../components/entities/main-entities/gpu.entity';
import { CpuCooler } from '../components/entities/main-entities/cpu-cooler.entity';
import { PowerSupply } from '../components/entities/main-entities/power-supply.entity';
import { PcCase } from '../components/entities/main-entities/pc-case.entity';
import { Fan } from '../components/entities/main-entities/fan.entity';
import { Motherboard } from '../components/entities/main-entities/motherboard.entity';
import { Monitor } from '../components/entities/main-entities/monitor.entity';
import { Mouse } from '../components/entities/main-entities/mouse.entity';
import { Keyboard } from '../components/entities/main-entities/keyboard.entity';
import { User } from '../users/user.entity';
import { Build } from '../builds/entities/build.entity';
import { BuildRam } from '../builds/entities/build-rams.entity';
import { BuildStorageDrive } from '../builds/entities/build-storage-drives.entity';
import { BuildFan } from '../builds/entities/build-fans.entity';
import { BuildMonitor } from '../builds/entities/build-monitors.entity';
import { Review } from '../reviews/entities/review.entity';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

interface BuildComponents {
  cpuId?: string;
  gpuId?: string;
  motherboardId?: string;
  powerSupplyId?: string;
  pcCaseId?: string;
  cpuCoolerId?: string;
  mouseId?: string;
  keyboardId?: string;
  rams?: { id: string; quantity: number }[];
  storage_drives?: { id: string; quantity: number }[];
  fans?: { id: string; quantity: number }[];
  monitors?: { id: string; quantity: number }[];
  photoUrl?: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5433', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [path.resolve(__dirname, '../**/*.entity.{ts,js}')],
    synchronize: true,
    logging: false,
  });
}

const TEST_USERS = [
  { username: 'Kainé', password: process.env.SEEDER_USER_PASSWORD! },
  { username: 'Emil', password: process.env.SEEDER_USER_PASSWORD! },
  { username: 'Weiss', password: process.env.SEEDER_USER_PASSWORD! },
];

async function seedUsers(dataSource: DataSource): Promise<User[]> {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 2 — Test users');
  console.log('══════════════════════════════════════════');

  const userRepo = dataSource.getRepository(User);
  const users: User[] = [];

  for (const { username, password } of TEST_USERS) {
    let user = await userRepo.findOne({ where: { username } });
    if (!user) {
      user = userRepo.create({
        username,
        password: await bcrypt.hash(password, 10),
      });
      await userRepo.save(user);
      console.log(`  Created user: ${username}`);
    } else {
      console.log(`  User already exists, reusing: ${username}`);
    }
    users.push(user);
  }

  return users;
}

const BUILDS_PER_USER = [3, 3, 4];

const BUILD_NAMES: string[][] = [
  ['The Jade Behemoth', 'Silent Night Rig', 'Budget Brawler'],
  ['Neon Genesis Airflow', 'Monochrome Workstation', 'RGB Overload'],
  [
    'Deep Space Renderer',
    'Esports Challenger',
    'Compact Console Killer',
    'The Daily Driver',
  ],
];

const BUILD_DESCRIPTIONS = [
  'A powerhouse focused on pure performance. Great for 1440p gaming and running heavy workloads without breaking a sweat. Cable management was a breeze in this case.',
  'Built with acoustics in mind. Features a dual storage setup for massive game libraries, paired with excellent thermal management so it stays quiet under load.',
  'An entry-level rig that punches above its weight class. Perfect for 1080p esports titles, light streaming, and everyday productivity.',
  'A flashy, high-airflow build featuring a triple-fan setup. Looks just as good as it performs in modern AAA games. The temps never go above 70°C.',
  'Sleek, stealthy, and professional. Minimal RGB, just a clean blackout aesthetic designed for coding, productivity, and casual weekend gaming.',
  'Balanced mid-tier build. Solid cooling, enough RAM for heavy multitasking, and the perfect foundation for a multi-monitor battle station.',
  'A high-end workstation built for rendering and video editing. Massive airflow with three fans and dual storage drives to keep the OS and project files separated.',
  'Reliable and blazing fast. Put together specifically to maximize framerates in competitive shooters with zero input lag. Clean and simple.',
  'Compact but fierce. Fits perfectly on a small desk while still delivering excellent performance. Managing the cables was tough, but totally worth it.',
  'The ultimate all-rounder. Unbeatable airflow configuration, ample storage for media and games, and ready for absolutely anything you throw at it.',
];

interface BuildComponents {
  cpuId?: string;
  gpuId?: string;
  motherboardId?: string;
  powerSupplyId?: string;
  pcCaseId?: string;
  cpuCoolerId?: string;
  mouseId?: string;
  keyboardId?: string;
  rams?: { id: string; quantity: number }[];
  storage_drives?: { id: string; quantity: number }[];
  fans?: { id: string; quantity: number }[];
  monitors?: { id: string; quantity: number }[];
}

export const BUILD_COMPONENTS: BuildComponents[][] = [
  [
    {
      cpuId: '3796bb7f-b124-4628-9592-cb2b3bf47e08',
      gpuId: '01778b89-e9ae-4099-aceb-8ee168a52fce',
      motherboardId: '01c7e802-799d-4ed2-87b4-08b8e572fe52',
      powerSupplyId: '0060a485-c883-4d82-b909-932ca919e345',
      pcCaseId: '0000caee-142c-48f6-99be-9c6f4dd18845',
      cpuCoolerId: '010abcce-a3d8-488c-a89d-9713092820c1',
      mouseId: '0003299a-f31d-4bd2-9198-bd8a052247df',
      keyboardId: '0026ff70-04f8-476b-bd67-a6c8575e15fa',
      rams: [{ id: '01d28304-01a0-4d29-85c4-f9f5f8daed14', quantity: 2 }],
      storage_drives: [{ id: '000e2e21-7ddc-48cd-9a02-7d8b3947263f', quantity: 1 }],
      fans: [{ id: '008d554c-6382-4394-92b0-97bc068625fa', quantity: 1 }],
      monitors: [{ id: '00077353-e930-4159-82b3-ee19e30b9a25', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360439/Build_6_lvkxan.jpg',
    },
    {
      cpuId: '2c0ed4a5-939f-4902-bfeb-cb16c0890ef2',
      gpuId: '019e2da1-636f-428f-9c08-9727d43c3ac2',
      motherboardId: '01c7e802-799d-4ed2-87b4-08b8e572fe52',
      powerSupplyId: '004b108b-3385-4f23-ad33-b29dfe26d0e4',
      pcCaseId: '000a0d8c-7590-4fd6-a724-41c36a3a4a9f',
      cpuCoolerId: '008e314e-6766-477a-bfa0-9f4d90f5461c',
      mouseId: '00306c7b-d24a-4cc0-beae-e0320bf8a0af',
      keyboardId: '00935e59-e148-4afe-91df-bf4ff735ea19',
      rams: [{ id: '02af6bd9-efaa-465d-98a9-7808ba97992a', quantity: 2 }],
      storage_drives: [
        { id: '000e2e21-7ddc-48cd-9a02-7d8b3947263f', quantity: 1 },
        { id: '00ada96b-bca9-401d-8594-3f259b20deeb', quantity: 1 },
      ],
      fans: [{ id: '008d554c-6382-4394-92b0-97bc068625fa', quantity: 1 }],
      monitors: [{ id: '12151f2b-f17c-4828-9ea0-8a3233908860', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360439/Build_7_q6skio.jpg',
    },
    {
      cpuId: '04984638-674b-4384-8866-a7b20d55f8b4',
      gpuId: '01110bc3-78da-4304-8bb6-ec8f0e56fb0e',
      motherboardId: '04184871-5e90-4548-86b3-8cdfbe1b9e0c',
      powerSupplyId: '0060a485-c883-4d82-b909-932ca919e345',
      pcCaseId: '0000caee-142c-48f6-99be-9c6f4dd18845',
      cpuCoolerId: '010abcce-a3d8-488c-a89d-9713092820c1',
      mouseId: '0003299a-f31d-4bd2-9198-bd8a052247df',
      keyboardId: '0026ff70-04f8-476b-bd67-a6c8575e15fa',
      rams: [{ id: '03278174-479d-45ee-a6c2-61b6dd9bb6db', quantity: 2 }],
      storage_drives: [{ id: '00b812fe-7098-4716-8ce9-855ea3674b76', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360439/Build_4_ouejzu.jpg',
    },
  ],

  [
    {
      cpuId: '2c0ed4a5-939f-4902-bfeb-cb16c0890ef2',
      gpuId: '001f4618-d3f8-44d7-8c6f-697bfbdc1858',
      motherboardId: '01c7e802-799d-4ed2-87b4-08b8e572fe52',
      powerSupplyId: '004b108b-3385-4f23-ad33-b29dfe26d0e4',
      pcCaseId: '00827b00-c9c3-421a-8730-78e3cea68fe7',
      cpuCoolerId: '008e314e-6766-477a-bfa0-9f4d90f5461c',
      mouseId: '00306c7b-d24a-4cc0-beae-e0320bf8a0af',
      keyboardId: '00935e59-e148-4afe-91df-bf4ff735ea19',
      rams: [{ id: '02af6bd9-efaa-465d-98a9-7808ba97992a', quantity: 2 }],
      storage_drives: [{ id: '00ada96b-bca9-401d-8594-3f259b20deeb', quantity: 1 }],
      fans: [{ id: '0062e156-8eb9-442f-8875-b95a8a06c0be', quantity: 3 }],
      monitors: [{ id: '0098be6b-ff22-4d6a-a66a-4f602f500559', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360440/Build_3_oxmf0p.png',
    },
    {
      cpuId: '3af33662-8d17-4e72-bdd9-200604b9db7b',
      gpuId: '01110bc3-78da-4304-8bb6-ec8f0e56fb0e',
      motherboardId: '034a0f7a-a5a5-4ea6-8f2a-cb49cce48c98',
      powerSupplyId: '00952dd1-42e0-4f3c-a0ef-c5e70a12c0b6',
      pcCaseId: '000a0d8c-7590-4fd6-a724-41c36a3a4a9f',
      cpuCoolerId: '010abcce-a3d8-488c-a89d-9713092820c1',
      mouseId: '0003299a-f31d-4bd2-9198-bd8a052247df',
      keyboardId: '0026ff70-04f8-476b-bd67-a6c8575e15fa',
      rams: [{ id: '01392bfb-931b-4145-9826-77540d9f7cea', quantity: 2 }],
      storage_drives: [{ id: '000e2e21-7ddc-48cd-9a02-7d8b3947263f', quantity: 1 }],
      monitors: [{ id: '00077353-e930-4159-82b3-ee19e30b9a25', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360440/Build_1_i7fup3.jpg',
    },
    {
      cpuId: '09086e21-4979-41ba-a451-3f8bb1c9cc55',
      gpuId: '001f4618-d3f8-44d7-8c6f-697bfbdc1858',
      motherboardId: '02426428-a50d-4d40-8de2-1805414b11e3',
      powerSupplyId: '004b108b-3385-4f23-ad33-b29dfe26d0e4',
      pcCaseId: '00827b00-c9c3-421a-8730-78e3cea68fe7',
      cpuCoolerId: '0009985c-4992-46ca-92ff-7f4d5a8f96f9',
      mouseId: '00306c7b-d24a-4cc0-beae-e0320bf8a0af',
      keyboardId: '00935e59-e148-4afe-91df-bf4ff735ea19',
      rams: [{ id: '01392bfb-931b-4145-9826-77540d9f7cea', quantity: 2 }],
      storage_drives: [{ id: '000e2e21-7ddc-48cd-9a02-7d8b3947263f', quantity: 1 }],
      fans: [{ id: '008d554c-6382-4394-92b0-97bc068625fa', quantity: 1 }],
      monitors: [{ id: '0098be6b-ff22-4d6a-a66a-4f602f500559', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360439/Build_5_tpxy4v.jpg',
    },
  ],

  [
    {
      cpuId: '09086e21-4979-41ba-a451-3f8bb1c9cc55',
      gpuId: '01aa7b75-afbe-4cea-966b-73ff88e8d189',
      motherboardId: '034a0f7a-a5a5-4ea6-8f2a-cb49cce48c98',
      powerSupplyId: '004a6e95-434c-4d19-aea4-9af4d726c217',
      pcCaseId: '00827b00-c9c3-421a-8730-78e3cea68fe7',
      cpuCoolerId: '008e314e-6766-477a-bfa0-9f4d90f5461c',
      mouseId: '00306c7b-d24a-4cc0-beae-e0320bf8a0af',
      keyboardId: '00935e59-e148-4afe-91df-bf4ff735ea19',
      rams: [{ id: '000c0c27-8b0a-4760-92ec-89ef39e630d8', quantity: 2 }],
      storage_drives: [
        { id: '000e2e21-7ddc-48cd-9a02-7d8b3947263f', quantity: 1 },
        { id: '00ada96b-bca9-401d-8594-3f259b20deeb', quantity: 1 },
      ],
      fans: [{ id: '0062e156-8eb9-442f-8875-b95a8a06c0be', quantity: 3 }],
      monitors: [{ id: '12151f2b-f17c-4828-9ea0-8a3233908860', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360441/Build_9_z14zjq.jpg',
    },
    {
      cpuId: '0240f7db-68e5-4aac-9438-41d2f12ec15a',
      gpuId: '01778b89-e9ae-4099-aceb-8ee168a52fce',
      motherboardId: '0833d6bd-e7be-45bc-bcb6-79240c67b0d3',
      powerSupplyId: '0060a485-c883-4d82-b909-932ca919e345',
      pcCaseId: '0000caee-142c-48f6-99be-9c6f4dd18845',
      cpuCoolerId: '010abcce-a3d8-488c-a89d-9713092820c1',
      mouseId: '0003299a-f31d-4bd2-9198-bd8a052247df',
      keyboardId: '0026ff70-04f8-476b-bd67-a6c8575e15fa',
      rams: [{ id: '032573d7-b548-47e4-bcbc-2ebcf4131f21', quantity: 2 }],
      storage_drives: [{ id: '00b812fe-7098-4716-8ce9-855ea3674b76', quantity: 1 }],
      monitors: [{ id: '00077353-e930-4159-82b3-ee19e30b9a25', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360441/Build_8_jml1c1.jpg',
    },
    {
      cpuId: '28155df9-8c91-4150-8786-96b8c54c309c',
      gpuId: '001f4618-d3f8-44d7-8c6f-697bfbdc1858',
      motherboardId: '0833d6bd-e7be-45bc-bcb6-79240c67b0d3',
      powerSupplyId: '004b108b-3385-4f23-ad33-b29dfe26d0e4',
      pcCaseId: '000a0d8c-7590-4fd6-a724-41c36a3a4a9f',
      cpuCoolerId: '008e314e-6766-477a-bfa0-9f4d90f5461c',
      mouseId: '00306c7b-d24a-4cc0-beae-e0320bf8a0af',
      keyboardId: '00935e59-e148-4afe-91df-bf4ff735ea19',
      rams: [{ id: '032573d7-b548-47e4-bcbc-2ebcf4131f21', quantity: 2 }],
      storage_drives: [{ id: '00ada96b-bca9-401d-8594-3f259b20deeb', quantity: 1 }],
      fans: [{ id: '008d554c-6382-4394-92b0-97bc068625fa', quantity: 1 }],
      monitors: [{ id: '0098be6b-ff22-4d6a-a66a-4f602f500559', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360443/Build_2_seiijk.jpg',
    },
    {
      cpuId: '045802be-240a-4bce-9e67-2722f885e671',
      gpuId: '01aa7b75-afbe-4cea-966b-73ff88e8d189',
      motherboardId: '03090354-e1c4-4671-be8d-2a2e5384e308',
      powerSupplyId: '004a6e95-434c-4d19-aea4-9af4d726c217',
      pcCaseId: '00827b00-c9c3-421a-8730-78e3cea68fe7',
      cpuCoolerId: '008e314e-6766-477a-bfa0-9f4d90f5461c',
      mouseId: '00306c7b-d24a-4cc0-beae-e0320bf8a0af',
      keyboardId: '00935e59-e148-4afe-91df-bf4ff735ea19',
      rams: [{ id: '00a55598-4e9c-4255-bcda-1e97600884d6', quantity: 2 }],
      storage_drives: [
        { id: '000e2e21-7ddc-48cd-9a02-7d8b3947263f', quantity: 1 },
        { id: '00ada96b-bca9-401d-8594-3f259b20deeb', quantity: 1 },
      ],
      fans: [{ id: '0062e156-8eb9-442f-8875-b95a8a06c0be', quantity: 3 }],
      monitors: [{ id: '12151f2b-f17c-4828-9ea0-8a3233908860', quantity: 1 }],
      photoUrl:
        'https://res.cloudinary.com/dycqjfp3q/image/upload/v1779360441/Build_10_bm4cij.jpg',
    },
  ],
];

async function seedBuilds(
  dataSource: DataSource,
  users: User[],
): Promise<Build[]> {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 2 — Test builds');
  console.log('══════════════════════════════════════════');
  const repo = {
    build: dataSource.getRepository(Build),
    ram: dataSource.getRepository(BuildRam),
    storage: dataSource.getRepository(BuildStorageDrive),
    fan: dataSource.getRepository(BuildFan),
    monitor: dataSource.getRepository(BuildMonitor),
    cpu: dataSource.getRepository(Cpu),
    gpu: dataSource.getRepository(Gpu),
    mb: dataSource.getRepository(Motherboard),
    psu: dataSource.getRepository(PowerSupply),
    case: dataSource.getRepository(PcCase),
    cooler: dataSource.getRepository(CpuCooler),
    mouse: dataSource.getRepository(Mouse),
    keyboard: dataSource.getRepository(Keyboard),
    ramComp: dataSource.getRepository(Ram),
    storage2: dataSource.getRepository(StorageDrive),
    fanComp: dataSource.getRepository(Fan),
    monComp: dataSource.getRepository(Monitor),
  };

  const allBuilds: Build[] = [];

  for (let u = 0; u < users.length; u++) {
    const user = users[u];

    for (let b = 0; b < BUILDS_PER_USER[u]; b++) {
      const buildName = BUILD_NAMES[u][b];
      const components = BUILD_COMPONENTS[u][b];

      const existing = await repo.build.findOne({
        where: { name: buildName, user: { id: user.id } },
        relations: ['user'],
      });
      if (existing) {
        console.log(`  Build already exists, reusing: "${buildName}"`);
        allBuilds.push(existing);
        continue;
      }

      const [
        cpu,
        gpu,
        motherboard,
        powerSupply,
        pcCase,
        cpuCooler,
        mouse,
        keyboard,
      ] = await Promise.all([
        components.cpuId
          ? repo.cpu.findOneByOrFail({ buildcoresId: components.cpuId })
          : Promise.resolve(undefined),
        components.gpuId
          ? repo.gpu.findOneByOrFail({ buildcoresId: components.gpuId })
          : Promise.resolve(undefined),
        components.motherboardId
          ? repo.mb.findOneByOrFail({ buildcoresId: components.motherboardId })
          : Promise.resolve(undefined),
        components.powerSupplyId
          ? repo.psu.findOneByOrFail({ buildcoresId: components.powerSupplyId })
          : Promise.resolve(undefined),
        components.pcCaseId
          ? repo.case.findOneByOrFail({ buildcoresId: components.pcCaseId })
          : Promise.resolve(undefined),
        components.cpuCoolerId
          ? repo.cooler.findOneByOrFail({
              buildcoresId: components.cpuCoolerId,
            })
          : Promise.resolve(undefined),
        components.mouseId
          ? repo.mouse.findOneByOrFail({ buildcoresId: components.mouseId })
          : Promise.resolve(undefined),
        components.keyboardId
          ? repo.keyboard.findOneByOrFail({
              buildcoresId: components.keyboardId,
            })
          : Promise.resolve(undefined),
      ]);

      const build = await repo.build.save(
        repo.build.create({
          name: buildName,
          description: pick(BUILD_DESCRIPTIONS),
          published: true,
          photoUrl: components.photoUrl,
          user,
          cpu,
          gpu,
          motherboard,
          powerSupply,
          pcCase,
          cpuCooler,
          mouse,
          keyboard,
        }),
      );

      for (const { id, quantity } of components.rams ?? []) {
        const ram = await repo.ramComp.findOneByOrFail({ buildcoresId: id });
        await repo.ram.save(repo.ram.create({ build, ram, quantity }));
      }
      for (const { id, quantity } of components.storage_drives ?? []) {
        const storageDrive = await repo.storage2.findOneByOrFail({
          buildcoresId: id,
        });
        await repo.storage.save(
          repo.storage.create({ build, storageDrive, quantity }),
        );
      }
      for (const { id, quantity } of components.fans ?? []) {
        const fan = await repo.fanComp.findOneByOrFail({ buildcoresId: id });
        await repo.fan.save(repo.fan.create({ build, fan, quantity }));
      }
      for (const { id, quantity } of components.monitors ?? []) {
        const monitor = await repo.monComp.findOneByOrFail({
          buildcoresId: id,
        });
        await repo.monitor.save(
          repo.monitor.create({ build, monitor, quantity }),
        );
      }

      console.log(`  Created build: "${buildName}" (user: ${user.username})`);
      allBuilds.push(build);
    }
  }

  return allBuilds;
}

const REVIEW_TEXTS = [
  'Excellent build.',
  'Really well thought out component selection. Would replicate it.',
  'Good selection of components. The PSU choice is smart.',
  'Solid build but I would have gone with more RAM.',
  'Love the aesthetic. The case choice is on point.',
  'Thermals are impressive given how small the case is.',
  'A bit overkill I think.',
  'Great starter build recommendation. Easy to follow too.',
  'Nice build.',
  'Would switch the storage for a larger NVMe, but otherwise spot-on.',
];

async function seedReviews(
  dataSource: DataSource,
  users: User[],
  builds: Build[],
): Promise<void> {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 4 — Reviews');
  console.log('══════════════════════════════════════════');

  const reviewRepo = dataSource.getRepository(Review);
  const buildRepo = dataSource.getRepository(Build);

  for (const build of builds) {
    const fullBuild = await buildRepo.findOne({
      where: { id: build.id },
      relations: ['user'],
    });
    if (!fullBuild) continue;

    const otherUsers = users.filter((u) => u.id !== fullBuild.user.id);
    const reviewers = [...otherUsers]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(1, otherUsers.length));

    for (const reviewer of reviewers) {
      const exists = await reviewRepo.findOne({
        where: { user: { id: reviewer.id }, build: { id: build.id } },
        relations: ['user', 'build'],
      });
      if (exists) continue;

      const review = await reviewRepo.save(
        reviewRepo.create({
          text: Math.random() > 0.2 ? pick(REVIEW_TEXTS) : undefined,
          stars: randomInt(3, 5),
          user: reviewer,
          build: fullBuild,
        }),
      );

      console.log(
        `  Review: "${fullBuild.name}" ← ${reviewer.username} (${review.stars}★)`,
      );
    }
  }
}

async function main(): Promise<void> {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 1 — Component migration');
  console.log('══════════════════════════════════════════');
  await runMigration();

  const dataSource = createDataSource();
  await dataSource.initialize();
  console.log('\nDatabase connection established.');

  try {
    const users = await seedUsers(dataSource);
    const builds = await seedBuilds(dataSource, users);
    await seedReviews(dataSource, users, builds);

    console.log('\n══════════════════════════════════════════');
    console.log('SEED COMPLETED ✓');
    console.log(`  Users  : ${users.length}`);
    console.log(`  Builds : ${builds.length}`);
    console.log('══════════════════════════════════════════\n');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Seed failed:', (err as Error).message);
  process.exit(1);
});
