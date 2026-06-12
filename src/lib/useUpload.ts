import { useState } from 'react';
import { supabase } from './supabase';

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
      setIsUploading(false);
      return null;
    }
  };

  return { uploadFile, upload: uploadFile, isUploading, uploading: isUploading };
}
