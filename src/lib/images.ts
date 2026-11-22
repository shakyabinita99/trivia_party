import { supabase } from './supabase';

const BUCKET = 'trivia-images';
const MAX_SIDE = 1600;

/** Downscale to MAX_SIDE and re-encode as JPEG; GIFs are kept as-is to preserve animation. */
async function compress(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((ok, fail) =>
    c.toBlob((b) => (b ? ok(b) : fail(new Error('Could not process that image.'))), 'image/jpeg', 0.82),
  );
}

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick an image file.');
  if (file.size > 25e6) throw new Error('That image is too large (max 25 MB).');
  const blob = await compress(file);
  if (blob.size > 5e6) throw new Error('That GIF is too large (max 5 MB).');

  const ext = blob.type === 'image/gif' ? 'gif' : 'jpg';
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase!.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) {
    throw new Error(
      /bucket not found/i.test(error.message)
        ? 'Picture storage is not set up yet: run supabase/trivia_images.sql in Supabase.'
        : error.message,
    );
  }
  return supabase!.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
