import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { RoleRepository } from './repositories/role.repository';
import { RoleService } from './services/role.service';
import { RoleController } from './controllers/role.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])],
  controllers: [RoleController],
  providers: [RoleRepository, RoleService],
  exports: [MongooseModule, RoleRepository, RoleService],
})
export class RolesModule {}