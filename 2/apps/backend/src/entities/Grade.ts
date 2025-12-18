import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Student } from './Student';
import { Course } from './Course';

@Entity()
export class Grade {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, { eager: true })
  student!: Student;

  @ManyToOne(() => Course, { eager: true })
  course!: Course;

  @Column({ nullable: true })
  score!: number | null;

  @Column({ nullable: true })
  comment!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

