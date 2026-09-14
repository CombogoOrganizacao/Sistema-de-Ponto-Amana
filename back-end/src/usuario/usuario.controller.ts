import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CargoUsuario, Usuario } from './entities/usuario.entity';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  private sanitize(usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      trabalhando: usuario.trabalhando,
    };
  }

  @Post()
  create(@Req() req: any, @Body() createUsuarioDto: CreateUsuarioDto) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    if (user.cargo !== CargoUsuario.ADMIN && createUsuarioDto.cargo === CargoUsuario.ADMIN) {
      throw new ForbiddenException('Only admin can create admin users');
    }
    return this.usuarioService.create(createUsuarioDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }
    if (req.user.cargo !== CargoUsuario.ADMIN) {
      throw new ForbiddenException('Only admin can list all users');
    }

    const usuarios = await this.usuarioService.findAll();
    return usuarios.map((usuario) => this.sanitize(usuario));
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (req.user.cargo !== CargoUsuario.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }

    const usuario = await this.usuarioService.findOne(id);
    if (!usuario) {
      return null;
    }

    return this.sanitize(usuario);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (req.user.cargo !== CargoUsuario.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }

    if (req.user.cargo !== CargoUsuario.ADMIN && updateUsuarioDto.cargo && updateUsuarioDto.cargo !== req.user.cargo) {
      throw new ForbiddenException('Cannot change cargo');
    }

    const usuario = await this.usuarioService.update(id, updateUsuarioDto);
    if (!usuario) {
      return null;
    }

    return this.sanitize(usuario);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (req.user.cargo !== CargoUsuario.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Access denied');
    }

    await this.usuarioService.remove(id);
    return { success: true };
  }
}
