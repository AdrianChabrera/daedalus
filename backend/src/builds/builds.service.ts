import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
    manager?: EntityManager,
  ): Promise<BuildResponseDto> {
    const build = new Build();

    const repo = manager?.getRepository(Build) ?? this.buildRepository;

    const components = await this.resolveComponents(buildDto);

    this.assignComponentsToBuild(build, components, buildDto);

    build.name = buildDto.name;
    build.description = buildDto.description;

    const user = await this.usersService.findUserById(currentUser.userId);
    build.user = user as User;

    build.published = false;

    const savedBuild = await repo.save(build);

    const response = new BuildResponseDto(savedBuild, currentUser.username);

    return response;
  }

  async updateBuild(
    buildDto: BuildCreationDto,
    currentUser: SignInData,
    id: number,
    manager?: EntityManager,
  ): Promise<BuildResponseDto> {
    const repo = manager?.getRepository(Build) ?? this.buildRepository;

    const build = await this.findBuildById(id, manager);

    if (build.user.id !== currentUser.userId) {
      throw new ForbiddenException(
        "You can't update a build that is not yours",
      );
    }

    if (build.published) {
      throw new ConflictException(
        "You can't update an already published build",
      );
    }

    const components = await this.resolveComponents(buildDto);

    this.assignComponentsToBuild(build, components, buildDto);

    build.name = buildDto.name;
    build.description = buildDto.description;

    const updatedBuild = await repo.save(build);

    const response = new BuildResponseDto(updatedBuild, currentUser.username);

    return response;
  }

  async getBuildDetailsById(
    id: number,
    currentUser: SignInData,
  ): Promise<BuildResponseDto> {
    const build = await this.findBuildById(id);
    if (build.user.id !== currentUser.userId && build.published) {
      throw new ForbiddenException(
        "You don't have access to this build details",
      );
    }
    const response = new BuildResponseDto(build, build.user.username);
    return response;
  }

  async findBuildById(id: number, manager?: EntityManager): Promise<Build> {
    const repo = manager?.getRepository(Build) ?? this.buildRepository;

    const build = await repo.findOne({
      where: { id: id },
      relations: [
        'user',
        'cpu',
        'motherboard',
        'motherboard.m2Slots',
        'motherboard.pcieSlots',
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
          .addSelect(`similarity(build.name, :search)`, 'search_similarity')
          .orderBy('search_similarity', 'DESC')
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
      throw new ForbiddenException(
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
      throw new ForbiddenException("You can't modify a build that's not yours");
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
    const build = new Build();
    const components = await this.resolveComponents(dto);
    this.assignComponentsToBuild(build, components, dto);

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

    build.rams = rams.map((ram: Ram) => {
      const fromDto = idSources.ramIds?.find(
        (r) => r.componentId === ram.buildcoresId,
      );
      const existing = (build.rams ?? []).find(
        (br) => br.ram.buildcoresId === ram.buildcoresId,
      );

      const buildRam = existing ?? new BuildRam();
      buildRam.build = build;
      buildRam.ram = ram;
      buildRam.quantity = fromDto?.quantity ?? 1;
      return buildRam;
    });

    build.fans = fans.map((fan: Fan) => {
      const fromDto = idSources.fanIds?.find(
        (f) => f.componentId === fan.buildcoresId,
      );
      const existing = (build.fans ?? []).find(
        (bf) => bf.fan.buildcoresId === fan.buildcoresId,
      );

      const buildFan = existing ?? new BuildFan();
      buildFan.build = build;
      buildFan.fan = fan;
      buildFan.quantity = fromDto?.quantity ?? 1;
      return buildFan;
    });

    build.monitors = monitors.map((monitor: Monitor) => {
      const fromDto = idSources.monitorIds?.find(
        (m) => m.componentId === monitor.buildcoresId,
      );
      const existing = (build.monitors ?? []).find(
        (bm) => bm.monitor.buildcoresId === monitor.buildcoresId,
      );

      const buildMonitor = existing ?? new BuildMonitor();
      buildMonitor.build = build;
      buildMonitor.monitor = monitor;
      buildMonitor.quantity = fromDto?.quantity ?? 1;
      return buildMonitor;
    });

    build.storageDrives = storageDrives.map((storageDrive: StorageDrive) => {
      const fromDto = idSources.storageDriveIds?.find(
        (s) => s.componentId === storageDrive.buildcoresId,
      );
      const existing = (build.storageDrives ?? []).find(
        (bs) => bs.storageDrive.buildcoresId === storageDrive.buildcoresId,
      );

      const buildStorageDrive = existing ?? new BuildStorageDrive();
      buildStorageDrive.build = build;
      buildStorageDrive.storageDrive = storageDrive;
      buildStorageDrive.quantity = fromDto?.quantity ?? 1;
      return buildStorageDrive;
    });
  }

  async deleteBuild(currentUser: SignInData, id: number): Promise<void> {
    const build = await this.findBuildById(id);
    if (!currentUser || currentUser.userId !== build.user.id) {
      throw new ForbiddenException(
        "You can't delete a build that is not yours",
      );
    }

    const result = await this.buildRepository.delete(build.id);

    if (result.affected === 0) {
      throw new NotFoundException(`Build with ID ${id} not found`);
    }
  }

  async setPublished(
    build: Build,
    published: boolean,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager?.getRepository(Build) ?? this.buildRepository;
    build.published = published;
    await repo.save(build);
  }

  private async resolveComponents(
    input: BuildCreationDto | CheckCompatibilityDto,
  ) {
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
      input.pcCaseId
        ? this.componentsService.findComponentById<PcCase>(
            'pc-case',
            input.pcCaseId,
          )
        : null,
      input.cpuCoolerId
        ? this.componentsService.findComponentById<CpuCooler>(
            'cpu-cooler',
            input.cpuCoolerId,
          )
        : null,
      input.cpuId
        ? this.componentsService.findComponentById<Cpu>('cpu', input.cpuId)
        : null,
      input.motherboardId
        ? this.componentsService.findComponentById<Motherboard>(
            'motherboard',
            input.motherboardId,
          )
        : null,
      input.powerSupplyId
        ? this.componentsService.findComponentById<PowerSupply>(
            'power-supply',
            input.powerSupplyId,
          )
        : null,
      input.gpuId
        ? this.componentsService.findComponentById<Gpu>('gpu', input.gpuId)
        : null,
      input.keyboardId
        ? this.componentsService.findComponentById<Keyboard>(
            'keyboard',
            input.keyboardId,
          )
        : null,
      input.mouseId
        ? this.componentsService.findComponentById<Mouse>(
            'mouse',
            input.mouseId,
          )
        : null,
    ]);

    const [fans, rams, monitors, storageDrives] = await Promise.all([
      input.fanIds?.length
        ? this.componentsService.findComponentsByIds<Fan>(
            'fan',
            input.fanIds.map((f) => f.componentId),
          )
        : [],
      input.ramIds?.length
        ? this.componentsService.findComponentsByIds<Ram>(
            'ram',
            input.ramIds.map((r) => r.componentId),
          )
        : [],
      input.monitorIds?.length
        ? this.componentsService.findComponentsByIds<Monitor>(
            'monitor',
            input.monitorIds.map((m) => m.componentId),
          )
        : [],
      input.storageDriveIds?.length
        ? this.componentsService.findComponentsByIds<StorageDrive>(
            'storage-drive',
            input.storageDriveIds.map((s) => s.componentId),
          )
        : [],
    ]);

    return {
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
    };
  }
}
