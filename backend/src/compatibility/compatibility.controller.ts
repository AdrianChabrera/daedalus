import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { CompatibilityService } from './compatibility.service';
import { COMPONENT_FILTER_SCHEMAS } from '../components/utils/filter-schemas';
import { parseFilters } from '../components/utils/utils';

@Controller('compatibility')
export class CompatibilityController {
  constructor(private compatibilityService: CompatibilityService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/')
  async getCompatibility(
    @Body() buildDto: CheckCompatibilityDto,
  ): Promise<CompatibilityIssueDto[]> {
    return await this.compatibilityService.checkCompatibility(buildDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/compatibles/:cType')
  getCompatibleComponentsWithBuild(
    @Param('cType') componentType: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query('order') order: string = 'name-ASC',
    @Query('search') search: string = '',
    @Query() queryParams: Record<string, string>,
    @Body() buildDto: CheckCompatibilityDto,
  ) {
    const type = componentType.toLowerCase();
    const schema = COMPONENT_FILTER_SCHEMAS[type] ?? {};

    const filters = parseFilters(queryParams, schema);

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return this.compatibilityService.findBuildCompatibleComponents(
      buildDto,
      componentType,
      pageNumber,
      limitNumber,
      filters,
      order,
      search,
    );
  }
}
