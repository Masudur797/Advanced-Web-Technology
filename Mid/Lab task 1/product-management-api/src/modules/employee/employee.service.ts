
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
  ): Promise<Omit<Employee, 'password'>> {
    const employee = this.employeeRepository.create(
      createEmployeeDto,
    );

    const savedEmployee =
      await this.employeeRepository.save(employee);

    const { password, ...result } = savedEmployee;
    return result;
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  async findOne(id: number): Promise<Employee> {
    const employee =
      await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${id} not found`,
      );
    }

    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Omit<Employee, 'password'>> {
    const employee = await this.findOne(id);

    Object.assign(employee, updateEmployeeDto);

    const updatedEmployee =
      await this.employeeRepository.save(employee);

    const { password, ...result } = updatedEmployee;
    return result;
  }

  async remove(id: number): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }
}
