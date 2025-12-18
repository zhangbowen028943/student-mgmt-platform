import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Enrollment } from './Enrollment';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 0 })
  credits!: number;

  @Column({ nullable: true })
  type!: string | null;

  @Column({ nullable: true })
  teacher!: string | null;

  @Column({ nullable: true })
  timeSlot!: string | null;

  @Column({ nullable: true })
  location!: string | null;

  @Column({ default: 50 })
  capacity!: number;

  @Column({ default: 0 })
  waitlist!: number;

  @OneToMany(() => Enrollment, e => e.course)
  enrollments!: Enrollment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
