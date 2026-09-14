import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CargoUsuario } from "src/usuario/entities/usuario.entity";

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  senha!: string;

  @IsOptional()
  @IsEnum(CargoUsuario)
  cargo?: CargoUsuario;
}
