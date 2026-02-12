import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Student } from './Student';

@Entity()
@Unique(['student', 'featureKey'])
export class StudentCapability {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student!: Student;

  @Column()
  featureKey!: string;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
