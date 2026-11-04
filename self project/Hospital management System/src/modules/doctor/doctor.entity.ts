
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone!: string;

  @Column({ length: 100 })
  specialization!: string;

  @Column({ type: 'int', default: 0 })
  experienceYears!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}