import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { PropertyImagesController } from './property-images.controller';
import { PropertyImagesService } from './property-images.service';

@Module({
  controllers: [PropertyImagesController],
  providers: [PropertyImagesService, CloudinaryService],
})
export class PropertyImagesModule {}
