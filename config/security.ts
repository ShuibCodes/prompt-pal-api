export default ({ env }) => ({
  cors: {
    enabled: true,
    origin: ['https://prompt-pal-front-end.vercel.app', 'http://localhost:1337'],
    headers: ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    keepHeaderOnError: true,
  },
  csrf: {
    enabled: false, // Disable CSRF for API-only usage
  },
}); 