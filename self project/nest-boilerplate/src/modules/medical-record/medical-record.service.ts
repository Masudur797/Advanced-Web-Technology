import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MedicalRecord } from './medical-record.entity';
import { Patient } from '../patient/patient.entity';
import { Doctor } from '../doctor/doctor.entity';

import { CreateMedicalRecordDto } from './create-medical-record.dto';
import { UpdateMedicalRecordDto } from './update-medical-record.dto';

@Injectable()
export class MedicalRecordService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async create(dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${dto.patientId} not found`,
      );
    }

    const doctor = await this.doctorRepository.findOne({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${dto.doctorId} not found`,
      );
    }

    const record = this.medicalRecordRepository.create({
      patient,
      doctor,
      diagnosis: dto.diagnosis,
      treatment: dto.treatment ?? null,
      notes: dto.notes ?? null,
    });

    return this.medicalRecordRepository.save(record);
  }

  async findAll(): Promise<MedicalRecord[]> {
    return this.medicalRecordRepository.find({
      relations: ['patient', 'doctor'],
    });
  }

  async count(): Promise<number> {
    return this.medicalRecordRepository.count();
  }

  async findOne(id: number): Promise<MedicalRecord> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });

    if (!record) {
      throw new NotFoundException(
        `Medical record with ID ${id} not found`,
      );
    }

    return record;
  }

  async update(
    id: number,
    dto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecord> {
    const record = await this.findOne(id);

    if (dto.patientId !== undefined) {
      const patient = await this.patientRepository.findOne({
        where: { id: dto.patientId },
      });

      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${dto.patientId} not found`,
        );
      }

      record.patient = patient;
    }

    if (dto.doctorId !== undefined) {
      const doctor = await this.doctorRepository.findOne({
        where: { id: dto.doctorId },
      });

      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${dto.doctorId} not found`,
        );
      }

      record.doctor = doctor;
    }

    if (dto.diagnosis !== undefined) {
      record.diagnosis = dto.diagnosis;
    }

    if (dto.treatment !== undefined) {
      record.treatment = dto.treatment;
    }

    if (dto.notes !== undefined) {
      record.notes = dto.notes;
    }

    return this.medicalRecordRepository.save(record);
  }

  async remove(id: number): Promise<{ message: string }> {
    const record = await this.findOne(id);

    await this.medicalRecordRepository.remove(record);

    return {
      message: `Medical record with ID ${id} deleted successfully`,
    };
  }
}