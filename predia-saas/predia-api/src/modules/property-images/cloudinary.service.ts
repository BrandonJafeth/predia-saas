import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  upload(buffer: Buffer, folder: string, publicId: string): Promise<UploadApiResponse> {
    this.configure();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: publicId, resource_type: 'image', overwrite: false },
        (error, result) => {
          if (error || !result) {
            reject(error instanceof Error ? error : new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  async destroy(publicId: string): Promise<void> {
    this.configure();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }

  // Config se aplica antes de cada llamada (no en el constructor) para no
  // tumbar el bootstrap del módulo si las env vars de Cloudinary aún no
  // están configuradas — el error solo aparece cuando alguien sube una imagen.
  private configure(): void {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }
}
