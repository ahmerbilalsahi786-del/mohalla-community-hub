import { useState } from 'react';
import { supabase } from './supabase';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });
}

async function compressToDataUrl(file: File) {
  const dataUrl = await readAsDataUrl(file);
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return dataUrl;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function useUpload(options?: any) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const fileName = `${Math.random()}-${file.name}`;
      const { data, error } = await supabase.storage.from('uploads').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
      setIsUploading(false);
      return { objectPath: publicUrl, url: publicUrl, id: data.path };
    } catch (err) {
      console.error(err);
      try {
        const objectPath = await compressToDataUrl(file);
        setIsUploading(false);
        return { objectPath, url: objectPath, id: `${Date.now()}-${file.name}` };
      } catch (fallbackError) {
        console.error(fallbackError);
        setIsUploading(false);
        return null;
      }
    }
  };

  return { uploadFile, upload: uploadFile, isUploading, uploading: isUploading };
}
