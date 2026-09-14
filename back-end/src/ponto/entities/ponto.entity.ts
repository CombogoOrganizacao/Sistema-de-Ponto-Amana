import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Usuario } from '../../usuario/entities/usuario.entity';

export enum TipoRegistro {
    ENTRADA = 'entrada',
    SAIDA = 'saida',
}

@Entity('ponto')
export class Ponto {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: false })
    localizacao!: string;

    @Column({ type: 'timestamptz', nullable: false })
    registro!: Date;

    @Column({ type: 'enum', enum: TipoRegistro, default: TipoRegistro.ENTRADA, nullable: false })
    tipo!: TipoRegistro;

    @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_id' })
    usuario!: Usuario;
}
