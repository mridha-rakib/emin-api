import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('Missing MONGODB_URI in environment.');
        }
        return { uri, dbName: config.get<string>('MONGODB_DB_NAME') ?? 'emin' };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
