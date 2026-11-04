import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './create-appointment.dto';
import { UpdateAppointmentDto } from './update-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      appointmentDate: new Date(
        createAppointmentDto.appointmentDate,
      ),
    });

    return this.appointmentRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find();
  }

  async count(): Promise<number> {
    return this.appointmentRepository.count();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${id} not found`,
      );
    }

    return appointment;
  }

  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    Object.assign(appointment, updateAppointmentDto);

    if (updateAppointmentDto.appointmentDate) {
      appointment.appointmentDate = new Date(
        updateAppointmentDto.appointmentDate,
      );
    }

    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<{ message: string }> {
    const appointment = await this.findOne(id);

    await this.appointmentRepository.remove(appointment);

    return {
      message: `Appointment with ID ${id} deleted successfully`,
    };
  }
}