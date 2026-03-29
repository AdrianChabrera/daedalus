import {
  Body,
  Controller,
  Delete,
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
    return this.usersService.findUserByName(user.username);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('delete')
  async delete(@CurrentUser() loggedUser: authInterfaces.SignInData) {
    return this.usersService.delete(loggedUser.userId);
  }
}
