import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicalRecord } from './medical-record.entity';
import { Patient } from '../patient/patient.entity';
import { Doctor } from '../doctor/doctor.entity';

import { MedicalRecordController } from './medical-record.controller';
import { MedicalRecordService } from './medical-record.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      Patient,
      Doctor,
    ]),
  ],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService],
  exports: [MedicalRecordService],
})
export class MedicalRecordModule {}