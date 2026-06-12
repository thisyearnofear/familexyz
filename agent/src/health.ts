import { ServiceRegistry } from "./server/service-registry.js";

export const healthCheck = (req: any, res: any) => {
    const status = ServiceRegistry.getStatus();
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        memory: {
            used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        },
        services: status,
    });
};

export const readinessCheck = (req?: any, res?: any) => {
    const status = ServiceRegistry.getStatus();
    const isReady = status.hasDb && status.hasRuntime;

    const result = {
        status: isReady ? "ready" : "not ready",
        timestamp: new Date().toISOString(),
        checks: {
            database: status.hasDb ? "ok" : "missing",
            runtime: status.hasRuntime ? "ok" : "missing",
            payoutService: status.hasPayoutHandler ? "ok" : "not initialized",
            telegram: status.hasTelegram ? "ok" : "not configured",
        },
    };

    if (req && res) {
        res.status(isReady ? 200 : 503).json(result);
        return;
    }

    return result;
};
