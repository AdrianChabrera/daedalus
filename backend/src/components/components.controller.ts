import {
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
import { parseFilters } from './utils/utils';

@Controller('components')
export class ComponentsController {
  constructor(private componentsService: ComponentsService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/count')
  getComponentsCount(): Promise<number> {
    const result = this.componentsService.findComponentsCount();
    return result;
  }

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

    const filters = parseFilters(queryParams, schema);

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
}
