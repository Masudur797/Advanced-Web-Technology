import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { CreatePatientDto } from './create-patient.dto';
import { UpdatePatientDto } from './update-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto): Promise<Patient> {
    const existing = await this.patientRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Patient email already exists');
    }

    const patient = this.patientRepository.create(dto);
    return this.patientRepository.save(patient);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async update(id: number, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);

    if (dto.email && dto.email !== patient.email) {
      const existing = await this.patientRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Patient email already exists');
      }
    }

    Object.assign(patient, dto);
    return this.patientRepository.save(patient);
  }

  async remove(id: number): Promise<{ message: string }> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);

    return { message: 'Patient deleted successfully' };
  }

  async count(): Promise<number> {
    return this.patientRepository.count();
  }
}