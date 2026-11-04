import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date;

  @Column({ length: 10, nullable: true })
  gender!: string;

  @Column({ length: 255, nullable: true })
  address!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}