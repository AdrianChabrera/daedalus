import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
import type { Writable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const cloudApiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const cloudApiSecret = this.configService.get<string>(
      'CLOUDINARY_API_SECRET',
    );

    if (!cloudName || !cloudApiKey || !cloudApiSecret) {
      throw new Error('Cloudinary credentials not found');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: cloudApiKey,
      api_secret: cloudApiSecret,
    });
  }

  uploadImage(fileBuffer: Buffer, folder = 'daedalus/builds'): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const cb = (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined,
      ): void => {
        if (error ?? !result) {
          reject(
            new InternalServerErrorException(
              'Failed to upload image to Cloudinary',
            ),
          );
          return;
        }
        resolve(result.secure_url);
      };

      const stream: Writable = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [
            { width: 1200, height: 900, crop: 'limit', quality: 'auto' },
          ],
        },
        cb,
      );

      stream.end(fileBuffer);
    });
  }

  async deleteImage(publicIdOrUrl: string): Promise<void> {
    let publicId = publicIdOrUrl;

    if (publicIdOrUrl.startsWith('http')) {
      const match = publicIdOrUrl.match(
        /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/,
      );
      if (!match?.[1]) return;
      publicId = match[1];
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(
        `Failed to delete image "${publicId}" from cloudinary:`,
        err,
      );
    }
  }
}
