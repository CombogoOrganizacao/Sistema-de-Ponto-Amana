import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PontoService } from './ponto.service';
import { CreatePontoDto } from './dto/create-ponto.dto';
import { UpdatePontoDto } from './dto/update-ponto.dto';
import { CargoUsuario } from '../usuario/entities/usuario.entity';

@Controller('ponto')
export class PontoController {
  constructor(private readonly pontoService: PontoService) {}

  @Post()
  create(@Req() req: any, @Body() createPontoDto: CreatePontoDto) {
    if (!req.user) {
       throw new UnauthorizedException('Authentication required');
    }
    return this.pontoService.create(createPontoDto);
  }

  @Get()
  findAll(@Req() req: any) {
    if (!req.user) {
       throw new UnauthorizedException('Authentication required');
    }
    if (req.user.cargo !== CargoUsuario.ADMIN) {
       throw new ForbiddenException('Only admin can view all point records');
    }
    return this.pontoService.findAll();
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    if (!req.user) {
       throw new UnauthorizedException('Authentication required');
    }
    if (req.user.cargo !== CargoUsuario.ADMIN) {
       throw new ForbiddenException('Only admin can view point records');
    }
    return this.pontoService.findOne(+id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updatePontoDto: UpdatePontoDto) {
    if (!req.user) {
       throw new UnauthorizedException('Authentication required');
    }
    if (req.user.cargo !== CargoUsuario.ADMIN) {
       throw new ForbiddenException('Only admin can edit point records');
    }
    return this.pontoService.update(+id, updatePontoDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (!req.user) {
       throw new UnauthorizedException('Authentication required');
    }
    if (req.user.cargo !== CargoUsuario.ADMIN) {
       throw new ForbiddenException('Only admin can delete point records');
    }
    return this.pontoService.remove(+id);
  }
}
