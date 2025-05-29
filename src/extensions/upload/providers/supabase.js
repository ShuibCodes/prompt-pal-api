const { createClient } = require('@supabase/supabase-js');

module.exports = {
  init(providerOptions) {

    
    const supabaseUrl = providerOptions.supabaseUrl;
    const supabaseKey = providerOptions.supabaseKey;
    const bucket = providerOptions.bucket || 'strapi-uploads';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    return {
      upload(file) {
        return new Promise(async (resolve, reject) => {
          try {
            const path = `${file.hash}${file.ext}`;
            
            const { data, error } = await supabase.storage
              .from(bucket)
              .upload(path, file.buffer, {
                contentType: file.mime,
                upsert: true,
              });

            if (error) {
              throw error;
            }


            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(path);

            file.url = publicUrl;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      },
      delete(file) {
        return new Promise(async (resolve, reject) => {
          try {
            const path = `${file.hash}${file.ext}`;
            const { error } = await supabase.storage
              .from(bucket)
              .remove([path]);

            if (error) throw error;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      },
    };
  },
}; 