import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInData } from 'src/auth/interfaces/auth.interfaces';
import { BuildsService } from 'src/builds/builds.service';
import { BuildCreationDto } from 'src/builds/dtos/BuildCreation.dto';
import { BuildResponseDto } from 'src/builds/dtos/BuildResponse.dto';
import { Build } from 'src/builds/entities/build';
import { CompatibilityService } from 'src/compatibility/compatibility.service';
import { DataSource } from 'typeorm';

@Injectable()
export class PublishService {
  constructor(
    private readonly buildsService: BuildsService,
    private readonly compatibilityService: CompatibilityService,
    private readonly dataSource: DataSource,
  ) {}

  async createAndPublishBuild(
    buildDto: BuildCreationDto,
    currentUser: SignInData,
  ): Promise<BuildResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const response = await this.buildsService.createBuild(
        buildDto,
        currentUser,
        manager,
      );
      const build = await this.buildsService.findBuildById(
        response.id,
        manager,
      );

      this.assertMandatoryComponentsInBuild(build);
      this.assertNoCompatibilityErrors(build);

      await this.buildsService.setPublished(build, true, manager);
      return { ...response, isPublished: true };
    });
  }

  async publishBuild(currentUser: SignInData, id: number): Promise<void> {
    const build = await this.buildsService.findBuildById(id);

    if (build.user.id !== currentUser.userId) {
      throw new UnauthorizedException(
        "You can't publish a build that is not yours.",
      );
    }

    if (build.published) {
      throw new ConflictException('This build is already published');
    }

    this.assertNoCompatibilityErrors(build);
    this.assertMandatoryComponentsInBuild(build);

    await this.buildsService.setPublished(build, true);
  }

  private assertNoCompatibilityErrors(build: Build): void {
    const issues = this.compatibilityService.checkCompatibilityFromBuild(build);
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      throw new ConflictException(
        "You can't publish a build with compatibility errors.",
      );
    }
  }

  private assertMandatoryComponentsInBuild(build: Build): void {
    const missingComponents: string[] = [];

    const hasCpu = !!build.cpu;
    const hasCooler =
      !!build.cpuCooler || (hasCpu && build.cpu?.includesCooler);
    const hasGpu = !!build.gpu || (hasCpu && build.cpu?.integratedGraphics);
    const hasMotherboard = !!build.motherboard;
    const hasPcCase = !!build.pcCase;
    const hasPowerSupply =
      !!build.powerSupply ||
      (hasPcCase && build.pcCase?.powerSupply !== 'None');
    const hasRam = build.rams && build.rams.length > 0;
    const hasStorageDrive =
      build.storageDrives && build.storageDrives.length > 0;

    if (!hasCpu) missingComponents.push('cpu');
    if (!hasCooler) missingComponents.push('cpu cooler');
    if (!hasGpu) missingComponents.push('gpu');
    if (!hasMotherboard) missingComponents.push('motherboard');
    if (!hasPcCase) missingComponents.push('case');
    if (!hasPowerSupply) missingComponents.push('power supply');
    if (!hasRam) missingComponents.push('rams (at least 1)');
    if (!hasStorageDrive) missingComponents.push('storage drives (at least 1)');

    if (missingComponents.length > 0) {
      throw new ConflictException(
        'Some mandatory components are missing. The following components must be included in order to publish the build: ' +
          missingComponents.join(', ') +
          '.',
      );
    }
  }
}
