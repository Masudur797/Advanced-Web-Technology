import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  doctorId!: number;

  @Column({ type: 'int' })
  patientId!: number;

  @Column({ type: 'timestamp' })
  appointmentDate!: Date;

  @Column({ length: 500, nullable: true })
  reason!: string;

  @Column({
    length: 20,
    default: 'Scheduled',
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}