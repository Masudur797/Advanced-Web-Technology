import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Billing } from './billing.entity';
import { Patient } from '../patient/patient.entity';
import { CreateBillingDto } from './create-billing.dto';
import { UpdateBillingDto } from './update-billing.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepository: Repository<Billing>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(dto: CreateBillingDto): Promise<Billing> {
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${dto.patientId} not found`,
      );
    }

    const billing = this.billingRepository.create({
      patient,
      amount: dto.amount,
      paymentStatus: dto.paymentStatus ?? 'Unpaid',
      description: dto.description ?? null,
    });

    return this.billingRepository.save(billing);
  }

  async findAll(): Promise<Billing[]> {
    return this.billingRepository.find({
      relations: ['patient'],
    });
  }

  async count(): Promise<number> {
    return this.billingRepository.count();
  }

  async findOne(id: number): Promise<Billing> {
    const billing = await this.billingRepository.findOne({
      where: { id },
      relations: ['patient'],
    });

    if (!billing) {
      throw new NotFoundException(
        `Billing record with ID ${id} not found`,
      );
    }

    return billing;
  }

  async update(
    id: number,
    dto: UpdateBillingDto,
  ): Promise<Billing> {
    const billing = await this.findOne(id);

    if (dto.patientId !== undefined) {
      const patient = await this.patientRepository.findOne({
        where: { id: dto.patientId },
      });

      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${dto.patientId} not found`,
        );
      }

      billing.patient = patient;
    }

    if (dto.amount !== undefined) {
      billing.amount = dto.amount;
    }

    if (dto.paymentStatus !== undefined) {
      billing.paymentStatus = dto.paymentStatus;
    }

    if (dto.description !== undefined) {
      billing.description = dto.description;
    }

    return this.billingRepository.save(billing);
  }

  async remove(id: number): Promise<{ message: string }> {
    const billing = await this.findOne(id);

    await this.billingRepository.remove(billing);

    return {
      message: `Billing record with ID ${id} deleted successfully`,
    };
  }
}