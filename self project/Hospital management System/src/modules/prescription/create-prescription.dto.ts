import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePrescriptionDto {
  @IsInt()
  @Min(1)
  appointmentId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  diagnosis!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  medicines!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}