import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class ComponentWithQuantityDto {
  @IsUUID('4')
  @IsNotEmpty()
  componentId!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;
}
