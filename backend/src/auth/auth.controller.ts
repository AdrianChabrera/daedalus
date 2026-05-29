import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthDto } from './dtos/auth.dto';
import { UsersService } from '../users/users.service';
import { CurrentUser } from './decorators/current-user.decorator';
import * as authInterfaces from './interfaces/auth.interfaces';

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
  async getUserInfo(@CurrentUser() user: authInterfaces.SignInData) {
    const found = await this.usersService.findUserByName(user.username);
    if (!found) throw new UnauthorizedException();
    return {
      userId: found.id,
      username: found.username,
    };
  }

  @UseGuards(AuthGuard)
  @Get('me/stats')
  async getUserStats(@CurrentUser() user: authInterfaces.SignInData) {
    return this.usersService.getUserStats(user.userId);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('delete')
  async delete(@CurrentUser() loggedUser: authInterfaces.SignInData) {
    return this.usersService.delete(loggedUser.userId);
  }
}
