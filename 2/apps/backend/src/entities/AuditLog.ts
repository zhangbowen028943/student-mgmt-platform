import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  actor!: string;

  @Column()
  action!: string;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
