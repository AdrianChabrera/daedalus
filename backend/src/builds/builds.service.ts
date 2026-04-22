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
import { PcCase } from '../components/entities/main-entities/pc-case.entity';
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
import { BuildWithComponentCountDto } from './dtos/BuildWithComponentCountDto';
import { Component } from 'src/components/entities/component.entity';
import { CheckCompatibilityDto } from 'src/compatibility/dtos/CheckCompatibility.dto';
import { ComponentWithQuantityDto } from './dtos/ComponentWithQuantity.dto';
import { PaginatedResult } from 'src/components/interfaces/pc-components.interfaces';
import { SelectQueryBuilder } from 'typeorm/browser';

const SIMILARITY_THRESHOLD = 0.1;

@Injectable()
export class BuildsService {
  constructor(
    @InjectRepository(Build)
    private buildRepository: Repository<Build>,
    private readonly componentsService: ComponentsService,
    private readonly usersService: UsersService,
    @InjectRepository(BuildRam)
    private buildRamRepository: Repository<BuildRam>,
    @InjectRepository(BuildFan)
    private buildFanRepository: Repository<BuildFan>,
    @InjectRepository(BuildMonitor)
    private buildMonitorRepository: Repository<BuildMonitor>,
    @InjectRepository(BuildStorageDrive)
    private buildStorageDriveRepository: Repository<BuildStorageDrive>,
  ) {}

  private readonly componentTypeMap: Record<string, string> = {
    pcCase: 'pcCase',
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
        buildDto.pcCaseId
          ? this.componentsService.findComponentById<PcCase>(
              'pc-case',
              buildDto.pcCaseId,
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

    this.assignComponentsToBuild(
      build,
      {
        pcCase,
        cpuCooler,
        cpu,
        motherboard,
        powerSupply,
        gpu,
        keyboard,
        mouse,
        fans,
        rams,
        monitors,
        storageDrives,
      },
      {
        fanIds: buildDto.fanIds,
        ramIds: buildDto.ramIds,
        monitorIds: buildDto.monitorIds,
        storageDriveIds: buildDto.storageDriveIds,
      },
    );

    build.name = buildDto.name;
    build.description = buildDto.description;

    const user = await this.usersService.findUserById(currentUser.userId);
    build.user = user as User;

    build.published = false;

    await this.buildRepository.save(build);

    const response = new BuildResponseDto();
    response.pcCaseName = pcCase?.name ? pcCase.name : undefined;
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
      relations: [
        'cpu',
        'motherboard',
        'cpuCooler',
        'gpu',
        'pcCase',
        'powerSupply',
        'rams',
        'rams.ram',
        'storageDrives',
        'storageDrives.storageDrive',
        'fans',
        'fans.fan',
      ],
    });

    if (!build) {
      throw new NotFoundException(`Build with ID: ${id} not found`);
    }
    return build;
  }

  async findAllUnpublishedBuildsFromUser(
    currentUser: SignInData,
    componentId: string,
    componentType: string,
  ): Promise<BuildWithComponentCountDto[]> {
    const relationNames = this.buildRepository.metadata.relations.map(
      (relation) => relation.propertyName,
    );
    const builds = await this.buildRepository.find({
      where: { user: { id: currentUser.userId }, published: false },
      relations: relationNames,
    });
    const buildsWithComponentsCount = builds.map((b) => {
      const dto = new BuildWithComponentCountDto();
      dto.build = b;
      dto.quantity = this.findComponentCountInBuild(
        b,
        componentId,
        componentType,
      );
      return dto;
    });
    return buildsWithComponentsCount;
  }

  async findAllBuilds(
    currentUser: SignInData | null,
    page: number = 1,
    limit: number = 16,
    order: string = 'name-ASC',
    search: string = '',
  ): Promise<PaginatedResult<Build>> {
    const validOrderFileds = ['name', 'createdAt'];
    const [orderField, orderDir = 'ASC'] = order.split('-');

    if (!validOrderFileds.includes(orderField)) {
      throw new BadRequestException(
        `${order} param is not a valid order param`,
      );
    }

    const skip = (page - 1) * limit;
    const direction = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    try {
      const qb: SelectQueryBuilder<Build> = this.buildRepository
        .createQueryBuilder('build')
        .leftJoin('build.user', 'user')
        .addSelect(['user.username'])
        .skip(skip)
        .take(limit);

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        qb.andWhere(`similarity(build.name, :search) > :threshold`, {
          search: trimmedSearch,
          threshold: SIMILARITY_THRESHOLD,
        })
          .orderBy(`similarity(build.name, :search)`, 'DESC')
          .addOrderBy(`build.name`, 'ASC');
      } else {
        if (orderField) {
          qb.orderBy(`build.${orderField}`, direction, 'NULLS LAST');
        }
      }

      if (currentUser) {
        qb.andWhere('build.userId = :userId', {
          userId: currentUser.userId,
        });
      } else {
        qb.andWhere('build.published = true');
      }

      const [data, total] = await qb.getManyAndCount();

      return { data, total, page, limit };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  findComponentCountInBuild(
    build: Build,
    componentId: string,
    componentType: string,
  ): number {
    const buildKey = this.componentTypeMap[componentType];

    if (!buildKey) {
      throw new BadRequestException(`Unknown component type: ${componentType}`);
    }

    if (this.multiComponents.has(buildKey)) {
      const nestedKeyMap: Record<
        string,
        keyof (BuildRam & BuildFan & BuildMonitor & BuildStorageDrive)
      > = {
        rams: 'ram',
        fans: 'fan',
        monitors: 'monitor',
        storageDrives: 'storageDrive',
      };

      const nestedKey = nestedKeyMap[buildKey];
      const entries = build[buildKey] as (
        | BuildRam
        | BuildFan
        | BuildMonitor
        | BuildStorageDrive
      )[];
      const match = entries?.find(
        (entry) => (entry[nestedKey] as Component).buildcoresId === componentId,
      );

      return match?.quantity ?? 0;
    }

    const single = build[buildKey] as Component | undefined;
    return single?.buildcoresId === componentId ? 1 : 0;
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
      const nestedKeyMap: Record<string, string> = {
        rams: 'ram',
        fans: 'fan',
        monitors: 'monitor',
        storageDrives: 'storageDrive',
      };

      const nestedKey = nestedKeyMap[buildKey];
      const entries = build[buildKey] as (
        | BuildRam
        | BuildFan
        | BuildMonitor
        | BuildStorageDrive
      )[];

      const existing = entries?.find(
        (entry) =>
          (entry[nestedKey] as Component).buildcoresId ===
          componentAssignment.componentId,
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        const joinEntityMap: Record<
          string,
          () => BuildRam | BuildFan | BuildMonitor | BuildStorageDrive
        > = {
          rams: () => {
            const e = new BuildRam();
            e.ram = component as Ram;
            e.quantity = 1;
            return e;
          },
          fans: () => {
            const e = new BuildFan();
            e.fan = component as Fan;
            e.quantity = 1;
            return e;
          },
          monitors: () => {
            const e = new BuildMonitor();
            e.monitor = component as Monitor;
            e.quantity = 1;
            return e;
          },
          storageDrives: () => {
            const e = new BuildStorageDrive();
            e.storageDrive = component as StorageDrive;
            e.quantity = 1;
            return e;
          },
        };

        const createJoinEntity = joinEntityMap[buildKey];
        if (!createJoinEntity)
          throw new BadRequestException(
            `Unhandled multi-component: ${buildKey}`,
          );
        entries.push(createJoinEntity());
      }
    } else {
      build[buildKey] = component;
    }

    await this.buildRepository.save(build);
  }

  async removeComponent(
    componentAssignment: BuildComponentAssignmentDto,
    currentUser: SignInData,
  ) {
    const build = await this.findBuildById(componentAssignment.buildId);

    if (build.user.id !== currentUser.userId) {
      throw new UnauthorizedException(
        "You can't modify a build that's not yours",
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
      const nestedKeyMap: Record<string, string> = {
        rams: 'ram',
        fans: 'fan',
        monitors: 'monitor',
        storageDrives: 'storageDrive',
      };

      const nestedKey = nestedKeyMap[buildKey];
      const entries = build[buildKey] as (
        | BuildRam
        | BuildFan
        | BuildMonitor
        | BuildStorageDrive
      )[];

      const existing = entries?.find(
        (entry) =>
          (entry[nestedKey] as Component).buildcoresId ===
          componentAssignment.componentId,
      );

      if (!existing) {
        throw new NotFoundException('Component not found in build');
      }

      const repositoryMap: Record<
        string,
        Repository<BuildRam | BuildFan | BuildMonitor | BuildStorageDrive>
      > = {
        rams: this.buildRamRepository,
        fans: this.buildFanRepository,
        monitors: this.buildMonitorRepository,
        storageDrives: this.buildStorageDriveRepository,
      };

      if (existing.quantity > 1) {
        existing.quantity -= 1;
        await this.buildRepository.save(build);
      } else {
        await repositoryMap[buildKey].remove(existing);
      }
    } else {
      build[buildKey] = null;
      await this.buildRepository.save(build);
    }
  }

  async assembleFromIds(dto: CheckCompatibilityDto): Promise<Build> {
    const [
      pcCase,
      cpuCooler,
      cpu,
      motherboard,
      powerSupply,
      gpu,
      keyboard,
      mouse,
    ] = await Promise.all([
      dto.pcCaseId
        ? this.componentsService.findComponentById<PcCase>(
            'pc-case',
            dto.pcCaseId,
          )
        : null,
      dto.cpuCoolerId
        ? this.componentsService.findComponentById<CpuCooler>(
            'cpu-cooler',
            dto.cpuCoolerId,
          )
        : null,
      dto.cpuId
        ? this.componentsService.findComponentById<Cpu>('cpu', dto.cpuId)
        : null,
      dto.motherboardId
        ? this.componentsService.findComponentById<Motherboard>(
            'motherboard',
            dto.motherboardId,
          )
        : null,
      dto.powerSupplyId
        ? this.componentsService.findComponentById<PowerSupply>(
            'power-supply',
            dto.powerSupplyId,
          )
        : null,
      dto.gpuId
        ? this.componentsService.findComponentById<Gpu>('gpu', dto.gpuId)
        : null,
      dto.keyboardId
        ? this.componentsService.findComponentById<Keyboard>(
            'keyboard',
            dto.keyboardId,
          )
        : null,
      dto.mouseId
        ? this.componentsService.findComponentById<Mouse>('mouse', dto.mouseId)
        : null,
    ]);

    const [fans, rams, monitors, storageDrives] = await Promise.all([
      dto.fanIds?.length
        ? this.componentsService.findComponentsByIds<Fan>(
            'fan',
            dto.fanIds.map((f) => f.componentId),
          )
        : [],
      dto.ramIds?.length
        ? this.componentsService.findComponentsByIds<Ram>(
            'ram',
            dto.ramIds.map((r) => r.componentId),
          )
        : [],
      dto.monitorIds?.length
        ? this.componentsService.findComponentsByIds<Monitor>(
            'monitor',
            dto.monitorIds.map((m) => m.componentId),
          )
        : [],
      dto.storageDriveIds?.length
        ? this.componentsService.findComponentsByIds<StorageDrive>(
            'storage-drive',
            dto.storageDriveIds.map(
              (s: ComponentWithQuantityDto) => s.componentId,
            ),
          )
        : [],
    ]);

    const build = new Build();

    this.assignComponentsToBuild(
      build,
      {
        pcCase,
        cpuCooler,
        cpu,
        motherboard,
        powerSupply,
        gpu,
        keyboard,
        mouse,
        fans,
        rams,
        monitors,
        storageDrives,
      },
      {
        fanIds: dto.fanIds,
        ramIds: dto.ramIds,
        monitorIds: dto.monitorIds,
        storageDriveIds: dto.storageDriveIds,
      },
    );

    return build;
  }

  private assignComponentsToBuild(
    build: Build,
    components: {
      pcCase: PcCase | null;
      cpuCooler: CpuCooler | null;
      cpu: Cpu | null;
      motherboard: Motherboard | null;
      powerSupply: PowerSupply | null;
      gpu: Gpu | null;
      keyboard: Keyboard | null;
      mouse: Mouse | null;
      fans: Fan[];
      rams: Ram[];
      monitors: Monitor[];
      storageDrives: StorageDrive[];
    },
    idSources: {
      fanIds?: ComponentWithQuantityDto[];
      ramIds?: ComponentWithQuantityDto[];
      monitorIds?: ComponentWithQuantityDto[];
      storageDriveIds?: ComponentWithQuantityDto[];
    },
  ): void {
    const {
      pcCase,
      cpuCooler,
      cpu,
      motherboard,
      powerSupply,
      gpu,
      keyboard,
      mouse,
      fans,
      rams,
      monitors,
      storageDrives,
    } = components;

    if (pcCase) build.pcCase = pcCase;
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
        idSources.fanIds?.find((f) => f.componentId === fan.buildcoresId)
          ?.quantity ?? 1;
      return buildFan;
    });
    build.rams = rams.map((ram: Ram) => {
      const buildRam = new BuildRam();
      buildRam.ram = ram;
      buildRam.quantity =
        idSources.ramIds?.find((r) => r.componentId === ram.buildcoresId)
          ?.quantity ?? 1;
      return buildRam;
    });
    build.monitors = monitors.map((monitor: Monitor) => {
      const buildMonitor = new BuildMonitor();
      buildMonitor.monitor = monitor;
      buildMonitor.quantity =
        idSources.monitorIds?.find(
          (m) => m.componentId === monitor.buildcoresId,
        )?.quantity ?? 1;
      return buildMonitor;
    });
    build.storageDrives = storageDrives.map((storageDrive: StorageDrive) => {
      const buildStorageDrive = new BuildStorageDrive();
      buildStorageDrive.storageDrive = storageDrive;
      buildStorageDrive.quantity =
        idSources.storageDriveIds?.find(
          (s) => s.componentId === storageDrive.buildcoresId,
        )?.quantity ?? 1;
      return buildStorageDrive;
    });
  }
}
