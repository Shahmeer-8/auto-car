import { Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { getFirebaseStorage } from '../core/firebase/firebase';

/** Uploads listing photos to Storage under cars/{userId}/{listingId}/ (see storage.rules).
 *  Per-image fallback: on any failure the original string (base64 data-URL) is kept,
 *  so listings still save even if Storage is not enabled on the Firebase project. */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  async uploadListingImages(userId: string, listingId: string, images: string[]): Promise<string[]> {
    const storage = getFirebaseStorage();
    return Promise.all(
      images.map(async (img, i) => {
        if (!img.startsWith('data:')) return img; // already a URL (edit mode)
        try {
          const r = ref(storage, `cars/${userId}/${listingId}/photo-${i}.jpg`);
          await uploadString(r, img, 'data_url');
          return await getDownloadURL(r);
        } catch {
          return img;
        }
      }),
    );
  }
}
