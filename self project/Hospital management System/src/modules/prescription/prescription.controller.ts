import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './create-prescription.dto';
import { UpdatePrescriptionDto } from './update-prescription.dto';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(
    private readonly prescriptionService: PrescriptionService,
  ) {}

  @Post()
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionService.create(dto);
  }

  @Get()
  findAll() {
    return this.prescriptionService.findAll();
  }

  @Get('count')
  count() {
    return this.prescriptionService.count();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptionService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptionService.remove(id);
  }
}