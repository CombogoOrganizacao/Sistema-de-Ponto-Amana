import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CargoUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsNotEmpty()
    @IsString()
    senhaHash!: string;

    @IsOptional()
    @IsEnum(CargoUsuario)
    cargo?: CargoUsuario;
}
