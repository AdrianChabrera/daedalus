import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() input: AuthDto) {
    return this.authService.authenticate(input);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() input: AuthDto) {
    return this.authService.register(input.username, input.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getUserInfo(@Request() request) {
    return this.usersService.findUserByName(request.user.username);
  }
}
