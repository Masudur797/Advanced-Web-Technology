import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Appointment } from '../appointment/appointment.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => Appointment,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  @Column({ type: 'text' })
  diagnosis!: string;

  @Column({ type: 'text' })
  medicines!: string;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}