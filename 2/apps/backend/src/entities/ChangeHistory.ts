import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Student } from './Student';

@Entity()
export class ChangeHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, s => s.changes)
  student!: Student;

  @Column()
  field!: string;

  @Column({ type: 'text' })
  oldValue!: string;

  @Column({ type: 'text' })
  newValue!: string;

  @Column()
  changedBy!: string;

  @CreateDateColumn()
  changedAt!: Date;
}
