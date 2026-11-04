import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Prescription } from './prescription.entity';
import { Appointment } from '../appointment/appointment.entity';
import { CreatePrescriptionDto } from './create-prescription.dto';
import { UpdatePrescriptionDto } from './update-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,

    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: dto.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${dto.appointmentId} not found`,
      );
    }

    const prescription = this.prescriptionRepository.create({
      appointment,
      diagnosis: dto.diagnosis,
      medicines: dto.medicines,
      instructions: dto.instructions ?? null,
    });

    return this.prescriptionRepository.save(prescription);
  }

  async findAll(): Promise<Prescription[]> {
    return this.prescriptionRepository.find({
      relations: ['appointment'],
    });
  }

  async count(): Promise<number> {
    return this.prescriptionRepository.count();
  }

  async findOne(id: number): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['appointment'],
    });

    if (!prescription) {
      throw new NotFoundException(
        `Prescription with ID ${id} not found`,
      );
    }

    return prescription;
  }

  async update(
    id: number,
    dto: UpdatePrescriptionDto,
  ): Promise<Prescription> {
    const prescription = await this.findOne(id);

    if (dto.appointmentId !== undefined) {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: dto.appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException(
          `Appointment with ID ${dto.appointmentId} not found`,
        );
      }

      prescription.appointment = appointment;
    }

    if (dto.diagnosis !== undefined) {
      prescription.diagnosis = dto.diagnosis;
    }

    if (dto.medicines !== undefined) {
      prescription.medicines = dto.medicines;
    }

    if (dto.instructions !== undefined) {
      prescription.instructions = dto.instructions;
    }

    return this.prescriptionRepository.save(prescription);
  }

  async remove(id: number): Promise<{ message: string }> {
    const prescription = await this.findOne(id);

    await this.prescriptionRepository.remove(prescription);

    return {
      message: `Prescription with ID ${id} deleted successfully`,
    };
  }
}