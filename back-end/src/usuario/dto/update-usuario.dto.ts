import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CargoUsuario } from '../entities/usuario.entity';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
    @IsOptional()
    trabalhando?: boolean

    @IsOptional()
    @IsEnum(CargoUsuario)
    cargo?: CargoUsuario
}
