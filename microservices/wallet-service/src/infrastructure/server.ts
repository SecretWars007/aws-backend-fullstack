import { createApp } from './app';

const PORT = process.env.PORT ?? 3003;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[Wallet Service] Server listening on port ${PORT}`);
});

// Graceful shutdown for ECS Fargate zero-downtime rolling updates
process.on('SIGTERM', () => {
  console.log('[Wallet Service] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Wallet Service] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Wallet Service] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Wallet Service] HTTP server closed.');
    process.exit(0);
  });
});
