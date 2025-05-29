export default ({ env }) => ({
  upload: {
    config: {
      provider: './providers/strapi-provider-upload-supabase',
      providerOptions: {
        apiUrl: env('SUPABASE_URL'),
        apiKey: env('SUPABASE_KEY'),
        bucket: env('SUPABASE_BUCKET', 'strapi-uploads'),
      },
    },
  },
}); 