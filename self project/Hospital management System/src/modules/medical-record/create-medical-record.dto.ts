import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateMedicalRecordDto {
  @IsInt()
  @Min(1)
  patientId!: number;

  @IsInt()
  @Min(1)
  doctorId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  diagnosis!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  treatment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}