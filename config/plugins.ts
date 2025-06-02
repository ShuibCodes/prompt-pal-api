export default ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-supabase',
      providerOptions: {
        apiUrl: env('SUPABASE_URL'),
        apiKey: env('SUPABASE_KEY'),
        bucket: env('SUPABASE_BUCKET', 'strapi-uploads'),
      },
    },
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
}); 