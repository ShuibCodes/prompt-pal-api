export default ({ env }) => ({
  cors: {
    enabled: true,
    origin: ['https://prompt-pal-front-end.vercel.app'],
    headers: ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    keepHeaderOnError: true,
  },
  csrf: {
    enabled: false, // Disable CSRF for API-only usage
  },
}); 