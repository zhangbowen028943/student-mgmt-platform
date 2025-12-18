import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Course } from './Course';

@Entity()
export class Assignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Course, { eager: true })
  course!: Course;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ nullable: true })
  fileKey!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
