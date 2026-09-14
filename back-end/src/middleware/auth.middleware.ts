import { Injectable, NestMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private jwtSecret = process.env.JWT_SECRET ?? 'change_this_secret';

  constructor(private readonly usuariosService: UsuarioService) {}

  async use(req: any, res: any, next: () => void) {
    const auth = req.headers?.authorization;
    if (!auth) return next();
    const parts = auth.split(' ');
    if (parts.length !== 2) return next();
    const scheme = parts[0];
    const token = parts[1];
    if (!/^Bearer$/i.test(scheme)) return next();
    try {
      const decoded: any = jwt.verify(token, this.jwtSecret);
      const userId = decoded.sub as string;
      const user = await this.usuariosService.findOneById(userId);
      if (user) {
        // attach minimal user info to request
        req.user = { id: user.id, nome: user.nome, email: user.email, cargo: user.cargo };
      }
    } catch (e) {
      // invalid token - leave req.user undefined
    }
    return next();
  }
}
