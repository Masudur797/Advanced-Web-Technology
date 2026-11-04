import {
  IsInt,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBillingDto {
  @IsInt()
  @Min(1)
  patientId!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @IsIn(['Unpaid', 'Paid'])
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}