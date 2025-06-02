export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('FRONTEND_URL', 'http://localhost:5173'),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
