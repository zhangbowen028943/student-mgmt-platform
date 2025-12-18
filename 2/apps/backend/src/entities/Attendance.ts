import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Student } from './Student';
import { Course } from './Course';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, { eager: true })
  student!: Student;

  @ManyToOne(() => Course, { eager: true })
  course!: Course;

  @Column({ default: 'present' })
  status!: 'present' | 'late' | 'leave_early' | 'absent';

  @Column({ nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

