export default ({ env }) => ({
  cors: {
    enabled: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://prompt-analyzer-client.vercel.app',
      'https://prompt-pal-front-end.vercel.app',
      'https://edu-sync-5s2x-git-feat-prompt-pal-i-1098a1-shuaybcodes-projects.vercel.app',
      'https://edu-sync-5s2x-o0oi0mnj8-shuaybcodes-projects.vercel.app',
      'https://edu-sync-5s2x-git-testing-shuaybcodes-projects.vercel.app',
      'https://edu-sync-5s2x.vercel.app',
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