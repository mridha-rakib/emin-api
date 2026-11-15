import { PartialType } from '@nestjs/mapped-types';
import { CreateAutoBidDto } from './create-auto-bid.dto';

export class UpdateAutoBidDto extends PartialType(CreateAutoBidDto) {}