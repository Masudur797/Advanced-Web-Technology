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
import { Doctor } from '../doctor/doctor.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => Patient,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @ManyToOne(
    () => Doctor,
    { nullable: false, onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor;

  @Column({ type: 'text' })
  diagnosis!: string;

  @Column({ type: 'text', nullable: true })
  treatment!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}