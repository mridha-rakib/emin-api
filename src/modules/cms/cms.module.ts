import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { BannerRepository } from './repositories/banner.repository';
import { BannerService } from './services/banner.service';
import { BannerController } from './controllers/banner.controller';
import { Page, PageSchema } from './schemas/page.schema';
import { PageRepository } from './repositories/page.repository';
import { PageService } from './services/page.service';
import { PageController } from './controllers/page.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }, { name: Page.name, schema: PageSchema }])],
  controllers: [BannerController, PageController],
  providers: [BannerRepository, BannerService, PageRepository, PageService],
  exports: [MongooseModule, BannerRepository, BannerService, PageRepository, PageService],
})
export class CmsModule {}