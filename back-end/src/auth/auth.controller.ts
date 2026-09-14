import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CargoUsuario } from 'src/usuario/entities/usuario.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { nome, email, senha, cargo } = body;
    if (!nome || !email || !senha) throw new UnauthorizedException('Missing fields');
    return this.authService.register(nome, email, senha, cargo ?? CargoUsuario.USUARIO);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { email, senha } = body;
    if (!email || !senha) throw new UnauthorizedException('Missing fields');
    return this.authService.login(email, senha);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('refreshToken required');
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
