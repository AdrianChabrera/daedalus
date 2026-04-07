import { Injectable } from '@nestjs/common';
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

@Injectable()
export class BuildsService {
  constructor(
    @InjectRepository(Build)
    private buildRepository: Repository<Build>,
    private readonly componentsService: ComponentsService,
    private readonly usersService: UsersService,
  ) {}

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
      this.componentsService.findComponentsByIds<Fan>(
        'fan',
        buildDto.fanIds ?? [],
      ),
      this.componentsService.findComponentsByIds<Ram>(
        'ram',
        buildDto.ramIds ?? [],
      ),
      this.componentsService.findComponentsByIds<Monitor>(
        'monitor',
        buildDto.monitorIds ?? [],
      ),
      this.componentsService.findComponentsByIds<StorageDrive>(
        'storage-drive',
        buildDto.storageDriveIds ?? [],
      ),
    ]);

    if (pcCase) build.case = pcCase;
    if (cpuCooler) build.cpuCooler = cpuCooler;
    if (cpu) build.cpu = cpu;
    if (motherboard) build.motherboard = motherboard;
    if (powerSupply) build.powerSupply = powerSupply;
    if (gpu) build.gpu = gpu;
    if (keyboard) build.keyboard = keyboard;
    if (mouse) build.mouse = mouse;

    build.fans = fans;
    build.monitors = monitors;
    build.rams = rams;
    build.storageDrives = storageDrives;
    build.name = buildDto.name;
    build.description = buildDto.description;

    console.log(currentUser);

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
    response.fanNames = fans ? fans.map((f) => f.name ?? 'Unknown Fan') : [];
    response.ramNames = rams ? rams.map((r) => r.name ?? 'Unknown Ram') : [];
    response.monitorNames = monitors
      ? monitors.map((m) => m.name ?? 'Unknown Monitor')
      : [];
    response.storageDriveNames = storageDrives
      ? storageDrives.map((s) => s.name ?? 'Unknown Storage Drive')
      : [];
    response.name = buildDto.name;
    response.description = buildDto.description;
    response.username = currentUser.username;

    return response;
  }
}
