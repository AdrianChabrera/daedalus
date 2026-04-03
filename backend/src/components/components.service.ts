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
import {
  FilterOptions,
  PaginatedResult,
  ParsedFilters,
} from './interfaces/pc-components.interfaces';
import { SelectQueryBuilder } from 'typeorm/browser';
import { COMPONENT_FILTER_SCHEMAS } from './utils/filter-schemas';

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
      'storage-drive': this.storageRepository,
    };
  }

  async findAllComponents(
    componentType: string,
    page: number = 1,
    limit: number = 16,
    filters: ParsedFilters = { ranges: {}, multiStrings: {}, booleans: {} },
    order: string = 'name-ASC',
  ): Promise<PaginatedResult<Component>> {
    const repository = this.repositories[componentType.toLowerCase()];

    if (!repository) {
      throw new BadRequestException(`Invalid component type: ${componentType}`);
    }

    const skip = (page - 1) * limit;

    const [orderField, orderDir = 'ASC'] = order.split('-');
    const direction = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const cType = componentType.toLowerCase();
    const alias = cType.replace('-', '_');

    try {
      const qb: SelectQueryBuilder<Component> = repository
        .createQueryBuilder(alias)
        .skip(skip)
        .take(limit);

      if (orderField) {
        qb.orderBy(
          `CASE WHEN ${alias}.${orderField} IS NULL THEN 1 ELSE 0 END`,
          'ASC',
        ).addOrderBy(`${alias}.${orderField}`, direction);
      }

      this.applyFilters(qb, alias, cType, filters);

      const [data, total] = await qb.getManyAndCount();

      return { data, total, page, limit };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  private applyFilters(
    qb: SelectQueryBuilder<Component>,
    alias: string,
    type: string,
    filters: ParsedFilters,
  ): void {
    const schema = COMPONENT_FILTER_SCHEMAS[type];
    if (!schema) return;

    let paramIndex = 0;

    for (const [key, { min, max }] of Object.entries(filters.ranges)) {
      const def = schema[key];
      if (!def || def.type !== 'range') continue;

      const col = `${alias}.${def.field}`;

      if (min !== undefined && max !== undefined) {
        const pMin = `p${paramIndex++}`;
        const pMax = `p${paramIndex++}`;
        qb.andWhere(`${col} BETWEEN :${pMin} AND :${pMax}`, {
          [pMin]: min,
          [pMax]: max,
        });
      } else if (min !== undefined) {
        const p = `p${paramIndex++}`;
        qb.andWhere(`${col} >= :${p}`, { [p]: min });
      } else if (max !== undefined) {
        const p = `p${paramIndex++}`;
        qb.andWhere(`${col} <= :${p}`, { [p]: max });
      }
    }

    for (const [key, values] of Object.entries(filters.multiStrings)) {
      const def = schema[key];
      if (!def || def.type !== 'multi-string' || values.length === 0) continue;

      const p = `p${paramIndex++}`;
      qb.andWhere(`${alias}.${def.field} IN (:...${p})`, { [p]: values });
    }

    for (const [key, value] of Object.entries(filters.booleans)) {
      const def = schema[key];
      if (!def || def.type !== 'boolean') continue;

      const p = `p${paramIndex++}`;
      qb.andWhere(`${alias}.${def.field} = :${p}`, { [p]: value });
    }
  }

  async findAllFilterValues(
    componentType: string,
  ): Promise<Record<string, FilterOptions>> {
    const cType = componentType.toLowerCase();
    const repository = this.repositories[cType];
    if (!repository) {
      throw new BadRequestException(`Invalid component type: ${componentType}`);
    }
    const schema = COMPONENT_FILTER_SCHEMAS[cType];

    if (!schema) {
      return {};
    }

    const alias = cType.replace('-', '_');
    const result: Record<string, FilterOptions> = {};

    await Promise.all(
      Object.entries(schema).map(async ([key, def]) => {
        const col = `${alias}.${def.field}`;
        if (def.type === 'range') {
          const rawResult = await repository
            .createQueryBuilder(alias)
            .select(`MIN(${col}), 'min'`)
            .addSelect(`MAX(${col}), 'max'`)
            .getRawOne<{ min: number | null; max: number | null }>();
          const { min, max } = rawResult || { min: null, max: null };
          result[key] = { type: 'range', min, max };
        } else if (def.type === 'multi-string') {
          const values = await repository
            .createQueryBuilder(alias)
            .select(`DISTINCT ${col}`, 'value')
            .where(`${col} IS NOT NULL`)
            .orderBy(`value`, 'ASC')
            .getRawMany<{ value: string }>();
          result[key] = {
            type: 'multi-string',
            values: values.map((v) => v.value),
          };
        } else if (def.type === 'boolean') {
          result[key] = { type: 'boolean' };
        }
      }),
    );
    return result;
  }
}
