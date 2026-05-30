type FlexibleLogFn = {
    (message: string, ...args: any[]): void;
    (context: Record<string, unknown>, message?: string, ...args: any[]): void;
};

const noop = () => {};

const createLogger = (level: string) => {
    const isEnabled = (target: string): boolean => {
        const levels = ["trace", "debug", "info", "log", "warn", "error", "fatal"];
        const configured = process?.env?.LOG_LEVEL || "info";
        return levels.indexOf(target) >= levels.indexOf(configured);
    };

    const logFn = (method: string): FlexibleLogFn => {
        if (!isEnabled(method)) return noop as FlexibleLogFn;
        return ((...args: any[]) => {
            const prefix = `[eliza] [${method.toUpperCase()}]`;
            if (typeof args[0] === "object" && args[0] !== null) {
                const ctx = args.shift();
                const consoleMethod = method === "log" ? console.log : (console as any)[method];
                if (typeof consoleMethod === "function") {
                    consoleMethod(prefix, ...args, ctx);
                }
            } else {
                const consoleMethod = method === "log" ? console.log : (console as any)[method];
                if (typeof consoleMethod === "function") {
                    consoleMethod(prefix, ...args);
                }
            }
        }) as FlexibleLogFn;
    };

    return {
        fatal: logFn("error"),
        error: logFn("error"),
        warn: logFn("warn"),
        info: logFn("info"),
        log: logFn("log"),
        debug: logFn("debug"),
        trace: logFn("trace"),
        progress: logFn("info"),
        success: logFn("info"),
    };
};

export const elizaLogger = createLogger("info");
export default elizaLogger;
