export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('BACKEND_URL', 'https://prompt-pal-api.onrender.com'),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
