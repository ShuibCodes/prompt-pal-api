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
  email: {
    config: {
      provider: '@strapi/provider-email-nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('EMAIL_USER'),
          pass: env('EMAIL_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('EMAIL_USER'),
        defaultReplyTo: env('EMAIL_USER'),
      },
    },
  },
}); 