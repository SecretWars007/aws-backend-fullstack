"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = process.env.PORT ?? 3002;
const app = (0, app_1.createApp)();
const server = app.listen(PORT, () => {
    console.log(`[Customer Service] Server listening on port ${PORT}`);
});
// Graceful shutdown for ECS Fargate zero-downtime rolling updates
process.on('SIGTERM', () => {
    console.log('[Customer Service] SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('[Customer Service] HTTP server closed.');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('[Customer Service] SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('[Customer Service] HTTP server closed.');
        process.exit(0);
    });
});
//# sourceMappingURL=server.js.map