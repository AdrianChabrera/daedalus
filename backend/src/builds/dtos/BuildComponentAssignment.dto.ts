import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class BuildComponentAssignmentDto {
  @IsUUID('4')
  @IsNotEmpty()
  componentId!: string;

  @IsNumber()
  @IsNotEmpty()
  buildId!: number;

  @IsString()
  @IsNotEmpty()
  componentType!: string;
}
