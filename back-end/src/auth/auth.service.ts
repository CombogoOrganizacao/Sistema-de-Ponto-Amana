import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { UsuarioService } from '../usuario/usuario.service';
import { CargoUsuario } from '../usuario/entities/usuario.entity';

@Injectable()
export class AuthService {
  private refreshTokens = new Map<string, string[]>(); // userId -> refresh tokens
  private jwtSecret = process.env.JWT_SECRET ?? 'change_this_secret';
  private accessTokenTtl = '15m';
  private refreshTokenTtl = '7d';

  constructor(private usuarioService: UsuarioService) {}

  async register(nome: string, email: string, senha: string, cargo: CargoUsuario ) {
    const existing = await this.usuarioService.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email already registered');
    const senhaHash = await argon2.hash(senha);
    const user = await this.usuarioService.create({ nome, email, senhaHash, cargo });
    return { id: user.id, nome: user.nome, email: user.email, cargo: user.cargo };
  }

  async validateUser(email: string, senha: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (!user) return null;
    const ok = await argon2.verify(user.senhaHash, senha).catch(() => false);
    if (!ok) return null;
    return user;
  }

  signAccessToken(user: any) {
    const payload = { sub: user.id, nome: user.nome, cargo: user.cargo };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.accessTokenTtl });
  }

  signRefreshToken(user: any) {
    const payload = { sub: user.id };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.refreshTokenTtl });
    const arr = this.refreshTokens.get(user.id) ?? [];
    arr.push(token);
    this.refreshTokens.set(user.id, arr);
    return token;
  }

  async login(email: string, senha: string) {
    const user = await this.validateUser(email, senha);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    return { accessToken, refreshToken, user: { id: user.id, nome: user.nome, email: user.email, cargo: user.cargo } };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, this.jwtSecret);
      const userId = decoded.sub as string;
      const tokens = this.refreshTokens.get(userId) ?? [];
      if (!tokens.includes(refreshToken)) throw new UnauthorizedException('Invalid refresh token');
      const user = await this.usuarioService.findOneById(userId);
      if (!user) throw new UnauthorizedException('User not found');
      const accessToken = this.signAccessToken(user);
      // optionally rotate refresh token: issue new one and replace
      const newRefresh = this.signRefreshToken(user);
      // remove old refresh token
      this.refreshTokens.set(userId, (this.refreshTokens.get(userId) ?? []).filter(t => t !== refreshToken));
      return { accessToken, refreshToken: newRefresh };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, this.jwtSecret);
      const userId = decoded.sub as string;
      this.refreshTokens.set(userId, (this.refreshTokens.get(userId) ?? []).filter(t => t !== refreshToken));
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
}
