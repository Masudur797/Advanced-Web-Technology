import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import { CreateDoctorDto } from './create-doctor.dto';
import { UpdateDoctorDto } from './update-doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const existing = await this.doctorRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Doctor email already exists');
    }

    const doctor = this.doctorRepository.create(dto);
    return this.doctorRepository.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async update(id: number, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);

    if (dto.email && dto.email !== doctor.email) {
      const existing = await this.doctorRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Doctor email already exists');
      }
    }

    Object.assign(doctor, dto);
    return this.doctorRepository.save(doctor);
  }

  async remove(id: number): Promise<{ message: string }> {
    const doctor = await this.findOne(id);
    await this.doctorRepository.remove(doctor);

    return { message: 'Doctor deleted successfully' };
  }

  async count(): Promise<number> {
    return this.doctorRepository.count();
  }
}