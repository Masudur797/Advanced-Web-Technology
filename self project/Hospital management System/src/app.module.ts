
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresDatabaseProviderModule } from '@/providers/database/postgres/provider.module';
import { AppController } from '@/src/app.controller';
import { AppService } from '@/src/app.service';
import global_config from '@/config/global_config';
import { BullModule } from '@nestjs/bull';




import { DoctorModule } from './modules/doctor/doctor.module';
import { PatientModule } from './modules/patient/patient.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { BillingModule } from './modules/billing/billing.module';
import { MedicalRecordModule } from './modules/medical-record/medical-record.module';







@Module({
  imports: [
    PostgresDatabaseProviderModule,







    DoctorModule,
    PatientModule,
    AppointmentModule,
    PrescriptionModule,
    BillingModule,
    MedicalRecordModule,




    
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
    }),

    BullModule.forRoot({
      url: process.env.REDIS_URL,
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [global_config],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
