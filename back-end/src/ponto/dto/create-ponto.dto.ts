import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { TipoRegistro } from '../entities/ponto.entity';
export class CreatePontoDto {
    @IsUUID()
    @IsNotEmpty()
    usuarioId!: string;

    @IsEnum(TipoRegistro)
    @IsNotEmpty()
    tipo!: TipoRegistro;
}
