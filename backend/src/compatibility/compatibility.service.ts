import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  COMPATIBILITY_RULES,
  CompatibilityRule,
} from './interfaces/compatibility-rule.interface';
import { BuildsService } from 'src/builds/builds.service';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { Build } from 'src/builds/entities/build';
import { ComponentsService } from 'src/components/components.service';
import {
  PaginatedResult,
  ParsedFilters,
} from 'src/components/interfaces/pc-components.interfaces';
import { Component } from 'src/components/entities/component.entity';
import { Ram } from 'src/components/entities/main-entities/ram.entity';
import { BuildRam } from 'src/builds/entities/build-rams.entity';
import { BuildFan } from 'src/builds/entities/build-fans.entity';
import { Fan } from 'src/components/entities/main-entities/fan.entity';
import { BuildMonitor } from 'src/builds/entities/build-monitors.entity';
import { Monitor } from 'src/components/entities/main-entities/monitor.entity';
import { BuildStorageDrive } from 'src/builds/entities/build-storage-drives.entity';
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';

@Injectable()
export class CompatibilityService {
  constructor(
    @Inject(COMPATIBILITY_RULES)
    private readonly rules: CompatibilityRule[],
    private readonly buildsService: BuildsService,
    private readonly componentsService: ComponentsService,
  ) {}

  async checkCompatibility(
    buildDto: CheckCompatibilityDto,
  ): Promise<CompatibilityIssueDto[]> {
    const build = await this.buildsService.assembleFromIds(buildDto);

    const results = this.rules
      .map((rule) => rule.check(build))
      .filter((issue): issue is CompatibilityIssueDto => issue !== null);

    return results;
  }

  checkCompatibilityFromBuild(build: Build): CompatibilityIssueDto[] {
    const results = this.rules
      .map((rule) => rule.check(build))
      .filter((issue): issue is CompatibilityIssueDto => issue !== null);

    return results;
  }

  async findBuildCompatibleComponents(
    buildDto: CheckCompatibilityDto,
    componentType: string,
    page: number = 1,
    limit: number = 16,
    filters: ParsedFilters = { ranges: {}, multiStrings: {}, booleans: {} },
    order: string = 'name-ASC',
    search: string = '',
  ): Promise<PaginatedResult<Component>> {
    const build = await this.buildsService.assembleFromIds(buildDto);

    const hasAnyError = this.checkCompatibilityFromBuild(build).some(
      (r) => r.severity === 'error',
    );

    if (hasAnyError) {
      throw new BadRequestException(
        'The provided build has compatibility errors. Please fix them before looking for compatible components.',
      );
    }

    const buildKeyMap: Record<string, string> = {
      'pc-case': 'pcCase',
      'cpu-cooler': 'cpuCooler',
      cpu: 'cpu',
      fan: 'fans',
      gpu: 'gpu',
      keyboard: 'keyboard',
      monitor: 'monitors',
      motherboard: 'motherboard',
      mouse: 'mouse',
      'power-supply': 'powerSupply',
      ram: 'rams',
      'storage-drive': 'storageDrives',
    };

    const buildKey = buildKeyMap[componentType];
    if (!buildKey)
      throw new BadRequestException(`Invalid component type: ${componentType}`);

    const allComponents =
      await this.componentsService.findAllComponentsRaw(componentType);

    const results = allComponents.map((component) => {
      const tempBuild = this.injectComponent(build, component, buildKey);
      const issues = this.checkCompatibilityFromBuild(tempBuild);

      const hasNewErrors = issues.some((issue) => issue.severity === 'error');

      return hasNewErrors ? null : component.buildcoresId;
    });

    const compatibleIds = results.filter((id): id is string => id !== null);

    return this.componentsService.findAllComponents(
      componentType,
      page,
      limit,
      filters,
      order,
      search,
      compatibleIds,
    );
  }

  private injectComponent(
    build: Build,
    component: Component,
    buildKey: string,
  ): Build {
    const multiWrappers: Record<string, (c: Component) => unknown> = {
      rams: (c) => {
        const e = new BuildRam();
        e.ram = c as Ram;
        e.quantity = 1;
        return [...(build.rams ?? []), e];
      },
      fans: (c) => {
        const e = new BuildFan();
        e.fan = c as Fan;
        e.quantity = 1;
        return [...(build.fans ?? []), e];
      },
      monitors: (c) => {
        const e = new BuildMonitor();
        e.monitor = c as Monitor;
        e.quantity = 1;
        return [...(build.monitors ?? []), e];
      },
      storageDrives: (c) => {
        const e = new BuildStorageDrive();
        e.storageDrive = c as StorageDrive;
        e.quantity = 1;
        return [...(build.storageDrives ?? []), e];
      },
    };

    const wrapper = multiWrappers[buildKey];
    return { ...build, [buildKey]: wrapper ? wrapper(component) : component };
  }
}
