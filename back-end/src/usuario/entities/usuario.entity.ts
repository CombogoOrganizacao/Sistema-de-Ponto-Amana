import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum CargoUsuario {
    ADMIN = 'admin',
    USUARIO = 'user',
}

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: false })
    nome!: string;

    @Column({ nullable: false, unique: true })
    email!: string;

    @Column({ nullable: false })
    senhaHash!: string;

    @Column({
        type: 'enum',
        enum: CargoUsuario,
        default: CargoUsuario.USUARIO,
        nullable: false,
    })
    cargo!: CargoUsuario;

    @Column({ nullable: false, default: false })
    trabalhando!: boolean;
}
