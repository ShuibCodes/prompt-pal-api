export default ({ env }) => ({
  cors: {
    enabled: true,
    origin: [
      'https://prompt-pal-front-end.vercel.app',
      'http://localhost:5173',
      env('FRONTEND_URL', 'http://localhost:5173')
    ],
    headers: ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    keepHeaderOnError: true,
  },
  csrf: {
    enabled: false, // Disable CSRF for API-only usage
  },
}); 