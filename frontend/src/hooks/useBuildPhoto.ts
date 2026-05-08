import { useState, useCallback } from 'react';
import { API_ROUTES } from '../config/api';
import { useAuth } from '../context/AuthContext';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UseBuildPhotoReturn {
  uploading: boolean;
  deleting: boolean;
  photoError: string | null;
  uploadPhoto: (buildId: number, file: File) => Promise<string | null>;
  deletePhoto: (buildId: number) => Promise<boolean>;
  validateFile: (file: File) => string | null;
}

export function useBuildPhoto(): UseBuildPhotoReturn {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG and WebP images are supported.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be smaller than 8 MB.';
    }
    return null;
  }, []);

  const uploadPhoto = useCallback(
    async (buildId: number, file: File): Promise<string | null> => {
      if (!user) {
        setPhotoError('You must be logged in to upload a photo.');
        return null;
      }

      const validationError = validateFile(file);
      if (validationError) {
        setPhotoError(validationError);
        return null;
      }

      setUploading(true);
      setPhotoError(null);

      try {
        const formData = new FormData();
        formData.append('photo', file);

        const res = await fetch(API_ROUTES.BUILD_PHOTO(buildId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.accessToken}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            typeof err.message === 'string' ? err.message : 'Upload failed.',
          );
        }

        const data: { photoUrl: string } = await res.json();
        return data.photoUrl;
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : 'Upload failed.');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [user, validateFile],
  );

  const deletePhoto = useCallback(
    async (buildId: number): Promise<boolean> => {
      if (!user) {
        setPhotoError('You must be logged in to remove a photo.');
        return false;
      }

      setDeleting(true);
      setPhotoError(null);

      try {
        const res = await fetch(API_ROUTES.BUILD_PHOTO(buildId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }

        return true;
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : 'Could not remove photo.');
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [user],
  );

  return { uploading, deleting, photoError, uploadPhoto, deletePhoto, validateFile };
}
