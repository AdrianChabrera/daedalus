import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ComponentsService } from './components.service';
import { COMPONENT_FILTER_SCHEMAS } from './utils/filter-schemas';
import { ParsedFilters } from './interfaces/pc-components.interfaces';

@Controller('components')
export class ComponentsController {
  constructor(private componentsService: ComponentsService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/:componentType/filters')
  getAllComponentsFilterValues(@Param('componentType') componentType: string) {
    return this.componentsService.findAllFilterValues(componentType);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:componentType')
  getAllComponents(
    @Param('componentType') componentType: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query('order') order: string = 'name-ASC',
    @Query('search') search: string = '',
    @Query() queryParams: Record<string, string>,
  ) {
    const type = componentType.toLowerCase();
    const schema = COMPONENT_FILTER_SCHEMAS[type] ?? {};

    const filters = this.parseFilters(queryParams, schema);

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return this.componentsService.findAllComponents(
      componentType,
      pageNumber,
      limitNumber,
      filters,
      order,
      search,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:componentType/:id')
  getComponentById(
    @Param('componentType') componentType: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.componentsService.findComponentById(componentType, id);
  }

  private parseFilters(
    queryParams: Record<string, string>,
    schema: (typeof COMPONENT_FILTER_SCHEMAS)[string],
  ): ParsedFilters {
    const parsed: ParsedFilters = {
      ranges: {},
      multiStrings: {},
      booleans: {},
    };

    for (const [param, rawValue] of Object.entries(queryParams)) {
      const reserverdParams = new Set(['page', 'limit', 'order', 'search']);
      if (reserverdParams.has(param)) continue;

      const rangeMatch = param.match(/^(min|max)(.+)$/);
      if (rangeMatch) {
        const direction = rangeMatch[1] as 'min' | 'max';
        const key =
          rangeMatch[2].charAt(0).toLowerCase() + rangeMatch[2].slice(1);
        const def = schema[key];

        if (!def || def.type !== 'range') {
          throw new BadRequestException(
            `Unknown or non-range filter: "${param}"`,
          );
        }

        const value = parseFloat(rawValue);
        if (isNaN(value)) {
          throw new BadRequestException(
            `Filter "${param}" must be a number, got "${rawValue}"`,
          );
        }

        parsed.ranges[key] = { ...parsed.ranges[key], [direction]: value };
        continue;
      }

      const def = schema[param];
      if (!def) {
        throw new BadRequestException(`Unknown filter: "${param}"`);
      }

      if (def.type === 'multi-string') {
        parsed.multiStrings[param] = rawValue
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
        continue;
      }

      if (def.type === 'boolean') {
        if (rawValue !== 'true' && rawValue !== 'false') {
          throw new BadRequestException(
            `Filter "${param}" must be "true" or "false"`,
          );
        }
        parsed.booleans[param] = rawValue === 'true';
        continue;
      }
    }

    return parsed;
  }
}
