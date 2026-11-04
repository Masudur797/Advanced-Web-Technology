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

import { MedicalRecordService } from './medical-record.service';
import { CreateMedicalRecordDto } from './create-medical-record.dto';
import { UpdateMedicalRecordDto } from './update-medical-record.dto';

@Controller('medical-records')
export class MedicalRecordController {
  constructor(
    private readonly medicalRecordService: MedicalRecordService,
  ) {}

  @Post()
  create(@Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordService.create(dto);
  }

  @Get()
  findAll() {
    return this.medicalRecordService.findAll();
  }

  @Get('count')
  count() {
    return this.medicalRecordService.count();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicalRecordService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicalRecordService.remove(id);
  }
}