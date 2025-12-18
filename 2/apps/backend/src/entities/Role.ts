import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './User';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: 'super_admin' | 'department_admin' | 'teacher' | 'student';

  @OneToMany(() => User, user => user.role)
  users!: User[];
}

