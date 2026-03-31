import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ComponentsService } from './components.service';

@Controller('components')
export class ComponentsController {
  constructor(private componentsService: ComponentsService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/:componentType')
  getAllComponents(
    @Param('componentType') componentType: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '16',
    @Query() queryParams: Record<string, any>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: _p, limit: _l, ...filters } = queryParams;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return this.componentsService.findAllComponents(
      componentType,
      pageNumber,
      limitNumber,
      filters,
    );
  }
}
