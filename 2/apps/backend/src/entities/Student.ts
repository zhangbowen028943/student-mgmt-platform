import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ChangeHistory } from './ChangeHistory';
import { Enrollment } from './Enrollment';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  studentNumber!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  gender!: 'male' | 'female' | 'other' | null;

  @Column({ unique: true, nullable: true })
  idCard!: string | null;

  @Column({ nullable: true })
  major!: string | null;

  @Column({ nullable: true })
  grade!: string | null;

  @Column({ nullable: true })
  contactPhone!: string | null;

  @Column({ nullable: true })
  contactEmail!: string | null;

  @Column({ nullable: true })
  emergencyContact!: string | null;

  @Column({ nullable: true })
  address!: string | null;

  @OneToMany(() => ChangeHistory, ch => ch.student)
  changes!: ChangeHistory[];

  @OneToMany(() => Enrollment, e => e.student)
  enrollments!: Enrollment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

