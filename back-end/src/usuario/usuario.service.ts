import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const usuario = new Usuario();
    Object.assign(usuario, createUsuarioDto);
    return this.usuarioRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

  async findOne(id: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOneBy({ email });
  }

  async findOneById(id: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOneBy({ id });
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario | null> {
    const usuario = await this.findOne(id);
    if (!usuario) {
      return null;
    }

    Object.assign(usuario, updateUsuarioDto);
    return this.usuarioRepository.save(usuario);
  }

  async remove(id: string): Promise<boolean> {
    const usuario = await this.findOne(id);
    if (!usuario) {
      return false;
    }

    await this.usuarioRepository.remove(usuario);
    return true;
  }
}
