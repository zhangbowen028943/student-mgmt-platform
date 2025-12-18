import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Student } from './Student';
import { Course } from './Course';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, s => s.enrollments, { eager: true })
  student!: Student;

  @ManyToOne(() => Course, c => c.enrollments, { eager: true })
  course!: Course;

  @Column({ default: 'enrolled' })
  status!: 'enrolled' | 'waitlisted' | 'dropped';

  @CreateDateColumn()
  createdAt!: Date;
}

