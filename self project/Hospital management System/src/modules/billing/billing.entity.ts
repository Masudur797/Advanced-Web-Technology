import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Patient } from '../patient/patient.entity';

@Entity('billings')
export class Billing {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => Patient,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    length: 20,
    default: 'Unpaid',
  })
  paymentStatus!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}