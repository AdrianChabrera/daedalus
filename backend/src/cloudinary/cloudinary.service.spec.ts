import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

const mockUploadStream = jest.fn();
const mockDestroy = jest.fn();

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: (...args: unknown[]): unknown => mockUploadStream(...args),
      destroy: (...args: unknown[]): unknown => mockDestroy(...args),
    },
  },
}));

const mockConfigService = {
  get: jest.fn((key: string) => `mock-${key}`),
};

async function buildModule(): Promise<CloudinaryService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CloudinaryService,
      { provide: ConfigService, useValue: mockConfigService },
    ],
  }).compile();

  return module.get<CloudinaryService>(CloudinaryService);
}

describe('CloudinaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage()', () => {
    it('resolves with the secure_url returned by Cloudinary', async () => {
      const fakeUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

      mockUploadStream.mockImplementation(
        (
          _opts: unknown,
          cb: (err: null, res: { secure_url: string }) => void,
        ) => {
          cb(null, { secure_url: fakeUrl });
          return { end: jest.fn() };
        },
      );

      const service = await buildModule();
      const result = await service.uploadImage(Buffer.from('fake-image-data'));

      expect(result).toBe(fakeUrl);
    });

    it('calls upload_stream with the correct folder option', async () => {
      mockUploadStream.mockImplementation(
        (
          opts: { folder: string },
          cb: (err: null, res: { secure_url: string }) => void,
        ) => {
          cb(null, { secure_url: 'https://example.com/img.jpg' });
          return { end: jest.fn() };
        },
      );

      const service = await buildModule();
      await service.uploadImage(Buffer.from('data'), 'custom/folder');

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'custom/folder' }),
        expect.any(Function),
      );
    });

    it('uses daedalus/builds as the default folder', async () => {
      mockUploadStream.mockImplementation(
        (
          opts: { folder: string },
          cb: (err: null, res: { secure_url: string }) => void,
        ) => {
          cb(null, { secure_url: 'https://example.com/img.jpg' });
          return { end: jest.fn() };
        },
      );

      const service = await buildModule();
      await service.uploadImage(Buffer.from('data'));

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'daedalus/builds' }),
        expect.any(Function),
      );
    });

    it('rejects with InternalServerErrorException when Cloudinary returns an error', async () => {
      mockUploadStream.mockImplementation(
        (
          _opts: unknown,
          cb: (err: { message: string }, res: undefined) => void,
        ) => {
          cb({ message: 'upload error' }, undefined);
          return { end: jest.fn() };
        },
      );

      const service = await buildModule();

      await expect(service.uploadImage(Buffer.from('data'))).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('rejects with InternalServerErrorException when Cloudinary returns no result', async () => {
      mockUploadStream.mockImplementation(
        (_opts: unknown, cb: (err: null, res: undefined) => void) => {
          cb(null, undefined);
          return { end: jest.fn() };
        },
      );

      const service = await buildModule();

      await expect(service.uploadImage(Buffer.from('data'))).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('pipes the file buffer into the upload stream', async () => {
      const fakeEnd = jest.fn();
      const buffer = Buffer.from('image-bytes');

      mockUploadStream.mockImplementation(
        (
          _opts: unknown,
          cb: (err: null, res: { secure_url: string }) => void,
        ) => {
          cb(null, { secure_url: 'https://example.com/img.jpg' });
          return { end: fakeEnd };
        },
      );

      const service = await buildModule();
      await service.uploadImage(buffer);

      expect(fakeEnd).toHaveBeenCalledWith(buffer);
    });
  });

  // ── deleteImage ─────────────────────────────────────────────────────────────

  describe('deleteImage()', () => {
    it('calls cloudinary.uploader.destroy with the raw public_id when given a plain id', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });

      const service = await buildModule();
      await service.deleteImage('daedalus/builds/abc123');

      expect(mockDestroy).toHaveBeenCalledWith('daedalus/builds/abc123');
    });

    it('extracts the public_id from a full Cloudinary URL and calls destroy', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });

      const service = await buildModule();
      await service.deleteImage(
        'https://res.cloudinary.com/demo/image/upload/v1234567890/daedalus/builds/abc123.jpg',
      );

      expect(mockDestroy).toHaveBeenCalledWith('daedalus/builds/abc123');
    });

    it('extracts the public_id from a URL without a version segment', async () => {
      mockDestroy.mockResolvedValue({ result: 'ok' });

      const service = await buildModule();
      await service.deleteImage(
        'https://res.cloudinary.com/demo/image/upload/daedalus/builds/xyz.png',
      );

      expect(mockDestroy).toHaveBeenCalledWith('daedalus/builds/xyz');
    });

    it('returns without calling destroy when the URL cannot be parsed', async () => {
      const service = await buildModule();
      await service.deleteImage('https://other-cdn.com/no-upload-segment');

      expect(mockDestroy).not.toHaveBeenCalled();
    });

    it('does not throw when cloudinary.uploader.destroy rejects (non-fatal)', async () => {
      mockDestroy.mockRejectedValue(new Error('cloudinary down'));

      const service = await buildModule();

      await expect(
        service.deleteImage('daedalus/builds/abc123'),
      ).resolves.toBeUndefined();
    });
  });
});
