import { Body, Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { CheckCompatibilityDto } from './dtos/CheckCompatibility.dto';
import { CompatibilityIssueDto } from './dtos/CompatibilityIssue.dto';
import { CompatibilityService } from './compatibility.service';

@Controller('compatibility')
export class CompatibilityController {
  constructor(private compatibilityService: CompatibilityService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/')
  async getCompatibility(
    @Body() buildDto: CheckCompatibilityDto,
  ): Promise<CompatibilityIssueDto[]> {
    return await this.compatibilityService.checkCompatibility(buildDto);
  }
}
