import { BadRequestException, Injectable } from '@nestjs/common';
import { Cpu } from './entities/main-entities/cpu.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Component } from './entities/component.entity';
import { Fan } from './entities/main-entities/fan.entity';
import { Gpu } from './entities/main-entities/gpu.entity';
import { Keyboard } from './entities/main-entities/keyboard.entity';
import { Monitor } from './entities/main-entities/monitor.entity';
import { Motherboard } from './entities/main-entities/motherboard.entity';
import { Mouse } from './entities/main-entities/mouse.entity';
import { PowerSupply } from './entities/main-entities/power-supply.entity';
import { Ram } from './entities/main-entities/ram.entity';
import { Case } from './entities/main-entities/case.entity';
import { CpuCooler } from './entities/main-entities/cpu-cooler.entity';
import { StorageDrive } from './entities/main-entities/storage.entity';
import { PaginatedResult } from './interfaces/pc-components.interfaces';

@Injectable()
export class ComponentsService {
  private readonly repositories: Record<string, Repository<Component>>;

  constructor(
    @InjectRepository(Case) private readonly caseRepository: Repository<Case>,
    @InjectRepository(CpuCooler)
    private readonly cpuCoolerRepository: Repository<CpuCooler>,
    @InjectRepository(Cpu) private readonly cpuRepository: Repository<Cpu>,
    @InjectRepository(Fan) private readonly fanRepository: Repository<Fan>,
    @InjectRepository(Gpu) private readonly gpuRepository: Repository<Gpu>,
    @InjectRepository(Keyboard)
    private readonly keyboardRepository: Repository<Keyboard>,
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(Motherboard)
    private readonly motherboardRepository: Repository<Motherboard>,
    @InjectRepository(Mouse)
    private readonly mouseRepository: Repository<Mouse>,
    @InjectRepository(PowerSupply)
    private readonly powerSupplyRepository: Repository<PowerSupply>,
    @InjectRepository(Ram) private readonly ramRepository: Repository<Ram>,
    @InjectRepository(StorageDrive)
    private readonly storageRepository: Repository<StorageDrive>,
  ) {
    this.repositories = {
      case: this.caseRepository,
      'cpu-cooler': this.cpuCoolerRepository,
      cpu: this.cpuRepository,
      fan: this.fanRepository,
      gpu: this.gpuRepository,
      keyboard: this.keyboardRepository,
      monitor: this.monitorRepository,
      motherboard: this.motherboardRepository,
      mouse: this.mouseRepository,
      'power-supply': this.powerSupplyRepository,
      ram: this.ramRepository,
      storage: this.storageRepository,
    };
  }

  async findAllComponents(
    componentType: string,
    page: number = 1,
    limit: number = 16,
    filters: Record<string, any> = {},
  ): Promise<PaginatedResult<Component>> {
    const repository = this.repositories[componentType.toLowerCase()];

    if (!repository) {
      throw new BadRequestException(`Invalid component type: ${componentType}`);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await repository.findAndCount({
      where: filters,
      skip: skip,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
