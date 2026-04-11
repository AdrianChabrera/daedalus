import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Build } from './entities/build';
import { BuildCreationDto } from './dtos/BuildCreation.dto';
import { ComponentsService } from '../components/components.service';
import { Case } from '../components/entities/main-entities/case.entity';
import { CpuCooler } from '../components/entities/main-entities/cpu-cooler.entity';
import { Cpu } from '../components/entities/main-entities/cpu.entity';
import { Gpu } from '../components/entities/main-entities/gpu.entity';
import { Fan } from '../components/entities/main-entities/fan.entity';
import { Keyboard } from '../components/entities/main-entities/keyboard.entity';
import { Motherboard } from '../components/entities/main-entities/motherboard.entity';
import { Mouse } from '../components/entities/main-entities/mouse.entity';
import { PowerSupply } from '../components/entities/main-entities/power-supply.entity';
import { Ram } from '../components/entities/main-entities/ram.entity';
import { StorageDrive } from '../components/entities/main-entities/storage.entity';
import { Monitor } from '../components/entities/main-entities/monitor.entity';
import { BuildResponseDto } from './dtos/BuildResponse.dto';
import { SignInData } from '../auth/interfaces/auth.interfaces';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { BuildComponentAssignmentDto } from './dtos/BuildComponentAssignment.dto';
import { BuildRam } from './entities/build-rams.entity';
import { BuildStorageDrive } from './entities/build-storage-drives.entity';
import { BuildFan } from './entities/build-fans.entity';
import { BuildMonitor } from './entities/build-monitors.entity';

@Injectable()
export class BuildsService {
  constructor(
    @InjectRepository(Build)
    private buildRepository: Repository<Build>,
    private readonly componentsService: ComponentsService,
    private readonly usersService: UsersService,
  ) {}

  private readonly componentTypeMap: Record<string, string> = {
    case: 'case',
    cpuCooler: 'cpuCooler',
    cpu: 'cpu',
    fan: 'fans',
    gpu: 'gpu',
    keyboard: 'keyboard',
    monitor: 'monitors',
    motherboard: 'motherboard',
    mouse: 'mouse',
    powerSupply: 'powerSupply',
    ram: 'rams',
    storageDrive: 'storageDrives',
  };

  private readonly multiComponents = new Set([
    'fans',
    'monitors',
    'rams',
    'storageDrives',
  ]);

  async createBuild(
    buildDto: BuildCreationDto,
    currentUser: SignInData,
  ): Promise<BuildResponseDto> {
    const build = new Build();

    const [pcCase, cpuCooler, cpu, motherboard, powerSupply] =
      await Promise.all([
        buildDto.caseId
          ? this.componentsService.findComponentById<Case>(
              'case',
              buildDto.caseId,
            )
          : null,
        buildDto.cpuCoolerId
          ? this.componentsService.findComponentById<CpuCooler>(
              'cpu-cooler',
              buildDto.cpuCoolerId,
            )
          : null,
        buildDto.cpuId
          ? this.componentsService.findComponentById<Cpu>('cpu', buildDto.cpuId)
          : null,
        buildDto.motherboardId
          ? this.componentsService.findComponentById<Motherboard>(
              'motherboard',
              buildDto.motherboardId,
            )
          : null,
        buildDto.powerSupplyId
          ? this.componentsService.findComponentById<PowerSupply>(
              'power-supply',
              buildDto.powerSupplyId,
            )
          : null,
      ]);

    const [gpu, keyboard, mouse] = await Promise.all([
      buildDto.gpuId
        ? this.componentsService.findComponentById<Gpu>('gpu', buildDto.gpuId)
        : null,
      buildDto.keyboardId
        ? this.componentsService.findComponentById<Keyboard>(
            'keyboard',
            buildDto.keyboardId,
          )
        : null,
      buildDto.mouseId
        ? this.componentsService.findComponentById<Mouse>(
            'mouse',
            buildDto.mouseId,
          )
        : null,
    ]);

    const [fans, rams, monitors, storageDrives] = await Promise.all([
      buildDto.fanIds
        ? this.componentsService.findComponentsByIds<Fan>(
            'fan',
            buildDto.fanIds?.map((f) => f.componentId) ?? [],
          )
        : [],
      buildDto.ramIds
        ? this.componentsService.findComponentsByIds<Ram>(
            'ram',
            buildDto.ramIds?.map((r) => r.componentId) ?? [],
          )
        : [],
      buildDto.monitorIds
        ? this.componentsService.findComponentsByIds<Monitor>(
            'monitor',
            buildDto.monitorIds?.map((m) => m.componentId) ?? [],
          )
        : [],
      buildDto.storageDriveIds
        ? this.componentsService.findComponentsByIds<StorageDrive>(
            'storage-drive',
            buildDto.storageDriveIds?.map((s) => s.componentId) ?? [],
          )
        : [],
    ]);

    if (pcCase) build.case = pcCase;
    if (cpuCooler) build.cpuCooler = cpuCooler;
    if (cpu) build.cpu = cpu;
    if (motherboard) build.motherboard = motherboard;
    if (powerSupply) build.powerSupply = powerSupply;
    if (gpu) build.gpu = gpu;
    if (keyboard) build.keyboard = keyboard;
    if (mouse) build.mouse = mouse;

    build.fans = fans.map((fan: Fan) => {
      const buildFan = new BuildFan();
      buildFan.fan = fan;
      buildFan.quantity =
        buildDto.fanIds?.find((f) => f.componentId === fan.buildcoresId)
          ?.quantity ?? 1;
      return buildFan;
    });
    build.monitors = monitors.map((monitor: Monitor) => {
      const buildMonitor = new BuildMonitor();
      buildMonitor.monitor = monitor;
      buildMonitor.quantity =
        buildDto.monitorIds?.find((m) => m.componentId === monitor.buildcoresId)
          ?.quantity ?? 1;
      return buildMonitor;
    });
    build.rams = rams.map((ram: Ram) => {
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity =
        buildDto.ramIds?.find((r) => r.componentId === ram.buildcoresId)
          ?.quantity ?? 1;
      return buildRam;
    });
    build.storageDrives = storageDrives.map((storageDrive: StorageDrive) => {
      const buildStorageDrive = new BuildStorageDrive();
      buildStorageDrive.storageDrive = storageDrive;
      buildStorageDrive.quantity =
        buildDto.storageDriveIds?.find(
          (s) => s.componentId === storageDrive.buildcoresId,
        )?.quantity ?? 1;
      return buildStorageDrive;
    });
    build.name = buildDto.name;
    build.description = buildDto.description;

    const user = await this.usersService.findUserById(currentUser.userId);
    build.user = user as User;

    build.published = false;

    await this.buildRepository.save(build);

    const response = new BuildResponseDto();
    response.caseName = pcCase?.name ? pcCase.name : undefined;
    response.cpuCoolerName = cpuCooler?.name ? cpuCooler.name : undefined;
    response.cpuName = cpu?.name ? cpu.name : undefined;
    response.motherboardName = motherboard?.name ? motherboard.name : undefined;
    response.powerSupplyName = powerSupply?.name ? powerSupply.name : undefined;
    response.gpuName = gpu?.name ? gpu.name : undefined;
    response.keyboardName = keyboard?.name ? keyboard.name : undefined;
    response.mouseName = mouse?.name ? mouse.name : undefined;
    response.fanNames = fans
      ? fans.map((f: Fan) => f.name ?? 'Unknown Fan')
      : [];
    response.ramNames = rams
      ? rams.map((r: Ram) => r.name ?? 'Unknown Ram')
      : [];
    response.monitorNames = monitors
      ? monitors.map((m: Monitor) => m.name ?? 'Unknown Monitor')
      : [];
    response.storageDriveNames = storageDrives
      ? storageDrives.map(
          (s: StorageDrive) => s.name ?? 'Unknown Storage Drive',
        )
      : [];
    response.name = buildDto.name;
    response.description = buildDto.description;
    response.username = currentUser.username;

    return response;
  }

  async findBuildById(id: number): Promise<Build> {
    const build = await this.buildRepository.findOne({
      where: { id: id },
      relations: ['user'],
    });

    if (!build) {
      throw new NotFoundException(`Build with ID: ${id} not found`);
    }
    return build;
  }

  async findAllUnpublishedBuildsFromUser(
    currentUser: SignInData,
  ): Promise<Build[]> {
    const builds = await this.buildRepository.find({
      where: { user: { id: currentUser.userId }, published: false },
    });
    return builds;
  }

  async assignComponent(
    componentAssignment: BuildComponentAssignmentDto,
    currentUser: SignInData,
  ) {
    const component = await this.componentsService.findComponentById(
      componentAssignment.componentType,
      componentAssignment.componentId,
    );

    const build = await this.findBuildById(componentAssignment.buildId);

    if (build.user.id !== currentUser.userId) {
      throw new UnauthorizedException(
        "You can't add a component to a build that's not yours",
      );
    }

    if (build.published) {
      throw new ConflictException("A published build can't be modified");
    }

    const buildKey = this.componentTypeMap[componentAssignment.componentType];

    if (!buildKey) {
      throw new BadRequestException(
        `Unknown component type: ${componentAssignment.componentType}`,
      );
    }

    if (this.multiComponents.has(buildKey)) {
      const quantity = componentAssignment.quantity ?? 1;
      const joinEntityMap: Record<string, () => object> = {
        rams: () => {
          const e = new BuildRam();
          e.ram = component as Ram;
          e.quantity = quantity;
          return e;
        },
        fans: () => {
          const e = new BuildFan();
          e.fan = component as Fan;
          e.quantity = quantity;
          return e;
        },
        monitors: () => {
          const e = new BuildMonitor();
          e.monitor = component as Monitor;
          e.quantity = quantity;
          return e;
        },
        storageDrives: () => {
          const e = new BuildStorageDrive();
          e.storageDrive = component as StorageDrive;
          e.quantity = quantity;
          return e;
        },
      };
      const createJoinEntity = joinEntityMap[buildKey];
      if (!createJoinEntity)
        throw new BadRequestException(`Unhandled multi-component: ${buildKey}`);
      (build[buildKey] as object[]).push(createJoinEntity());
    } else {
      build[buildKey] = component;
    }

    await this.buildRepository.save(build);
  }
}
