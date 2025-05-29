const { createClient } = require('@supabase/supabase-js');

module.exports = {
  init(config) {
    console.log('🔧 Supabase upload provider initializing...');
    console.log('Config received:', { 
      hasApiUrl: !!config.apiUrl, 
      hasApiKey: !!config.apiKey, 
      bucket: config.bucket 
    });

    const supabase = createClient(config.apiUrl, config.apiKey);

    return {
      async upload(file) {
        console.log('📤 Uploading file to Supabase:', file.name);
        
        try {
          const path = `${file.hash}${file.ext}`;
          
          const { data, error } = await supabase.storage
            .from(config.bucket)
            .upload(path, file.buffer, {
              contentType: file.mime,
              cacheControl: '3600',
              upsert: true
            });

          if (error) {
            console.error('❌ Supabase upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from(config.bucket)
            .getPublicUrl(path);

          console.log('✅ Upload successful, public URL:', publicUrl);
          
          file.url = publicUrl;
          return file;
        } catch (error) {
          console.error('💥 Upload error:', error);
          throw error;
        }
      },

      async delete(file) {
        console.log('🗑️ Deleting file from Supabase:', file.url);
        
        try {
          const path = `${file.hash}${file.ext}`;
          
          const { error } = await supabase.storage
            .from(config.bucket)
            .remove([path]);

          if (error) {
            console.error('❌ Supabase delete error:', error);
            throw new Error(`Delete failed: ${error.message}`);
          }

          console.log('✅ Delete successful');
        } catch (error) {
          console.error('💥 Delete error:', error);
          throw error;
        }
      }
    };
  }
}; 