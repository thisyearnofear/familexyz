import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
    const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
        memory: {
            used:
                Math.round(
                    (process.memoryUsage().heapUsed / 1024 / 1024) * 100,
                ) / 100,
            total:
                Math.round(
                    (process.memoryUsage().heapTotal / 1024 / 1024) * 100,
                ) / 100,
            external:
                Math.round(
                    (process.memoryUsage().external / 1024 / 1024) * 100,
                ) / 100,
        },
        cpu: process.cpuUsage(),
    };

    res.status(200).json(healthData);
};

export const readinessCheck = (req?: Request, res?: Response) => {
    // Add any readiness checks here (database connectivity, etc.)
    const isReady = true; // Replace with actual readiness logic

    // If called with Express req/res, respond directly
    if (req && res) {
        if (isReady) {
            res.status(200).json({
                status: "ready",
                timestamp: new Date().toISOString(),
            });
        } else {
            res.status(503).json({
                status: "not ready",
                timestamp: new Date().toISOString(),
            });
        }
        return;
    }

    // If called without req/res, return the readiness status
    return {
        status: isReady ? "ready" : "not ready",
        timestamp: new Date().toISOString(),
    };
};
