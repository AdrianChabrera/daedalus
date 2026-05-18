import { IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'Username must be at most 255 characters long.' })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255, { message: 'Password must be at most 255 characters long.' })
  password!: string;
}
