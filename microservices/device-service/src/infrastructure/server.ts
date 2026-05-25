// ─── Server Entry Point ───────────────────────────────────────────────────────
// Starts the HTTP server. In production (ECS Fargate), AWS handles process
// management so we don't need PM2 — just a clean process.

import { createApp } from './app';

const PORT = Number(process.env.PORT ?? 3001);

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[Device Service] ✅ Running on port ${PORT}`);
  console.log(`[Device Service] MOCK_MODE=${process.env.MOCK_MODE ?? 'false'}`);
  console.log(`[Device Service] NODE_ENV=${process.env.NODE_ENV ?? 'development'}`);
});

// ── Graceful shutdown (important for ECS zero-downtime deploys) ───────────────
process.on('SIGTERM', () => {
  console.log('[Device Service] SIGTERM received — shutting down gracefully');
  server.close(() => {
    console.log('[Device Service] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

export default server;
