import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Prescription } from './prescription.entity';
import { Appointment } from '../appointment/appointment.entity';

import { PrescriptionService } from './prescription.service';
import { PrescriptionController } from './prescription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prescription,
      Appointment,
    ]),
  ],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}