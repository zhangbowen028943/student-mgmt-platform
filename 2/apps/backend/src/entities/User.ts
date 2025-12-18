import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './Role';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column({ unique: true, nullable: true })
  email!: string | null;

  @Column({ nullable: true })
  phone!: string | null;

  @Column({ nullable: true })
  address!: string | null;

  @ManyToOne(() => Role, role => role.users, { eager: true })
  role!: Role;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

