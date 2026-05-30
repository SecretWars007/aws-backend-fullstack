"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = process.env.PORT ?? 3003;
const app = (0, app_1.createApp)();
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
//# sourceMappingURL=server.js.map