export default ({ env }) => ({
  cors: {
    enabled: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://prompt-analyzer-client.vercel.app',
      'https://prompt-pal-front-end.vercel.app',
      env('FRONTEND_URL', 'http://localhost:5173')
    ],
    headers: ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    keepHeaderOnError: true,
    credentials: true,
  },
  csrf: {
    enabled: false, // Disable CSRF for API-only usage
  },
}); 