import { Inject, Injectable } from '@nestjs/common';
import {
  COMPATIBILITY_RULES,
  CompatibilityRule,
} from './interfaces/compatibility-rule.interface';
import { ComponentsService } from 'src/components/components.service';
import { BuildsService } from 'src/builds/builds.service';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';

@Injectable()
export class CompatibilityService {
  constructor(
    @Inject(COMPATIBILITY_RULES)
    private readonly rules: CompatibilityRule[],
    private readonly componentsService: ComponentsService,
    private readonly buildsService: BuildsService,
  ) {}

  async checkCompatibility(
    buildDto: CheckCompatibilityDto,
  ): Promise<CompatibilityIssueDto[]> {
    const build = await this.buildsService.assembleFromIds(buildDto);

    return this.rules
      .map((rule) => rule.check(build))
      .filter((issue): issue is CompatibilityIssueDto => issue !== null);
  }
}
