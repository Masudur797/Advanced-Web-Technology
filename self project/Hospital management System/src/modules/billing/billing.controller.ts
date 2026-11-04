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

import { BillingService } from './billing.service';
import { CreateBillingDto } from './create-billing.dto';
import { UpdateBillingDto } from './update-billing.dto';

@Controller('billings')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Post()
  create(@Body() dto: CreateBillingDto) {
    return this.billingService.create(dto);
  }

  @Get()
  findAll() {
    return this.billingService.findAll();
  }

  @Get('count')
  count() {
    return this.billingService.count();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBillingDto,
  ) {
    return this.billingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.remove(id);
  }
}