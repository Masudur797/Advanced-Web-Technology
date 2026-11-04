import {
  IsInt,
  IsDateString,
  IsString,
  IsOptional,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  doctorId!: number;

  @IsInt()
  @Min(1)
  patientId!: number;

  @IsDateString()
  appointmentDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Scheduled', 'Completed', 'Cancelled'])
  status?: string;
}