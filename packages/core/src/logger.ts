import pino, { type LogFn, type Logger } from "pino";
import pretty from "pino-pretty";

const customLevels: Record<string, number> = {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    log: 29,
    progress: 28,
    success: 27,
    debug: 20,
    trace: 10,
};

const raw = process?.env?.LOG_JSON_FORMAT || false;

const createStream = () => {
    if (raw) {
        return undefined;
    }
    return pretty({
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
    });
};

const defaultLevel = process?.env?.DEFAULT_LOG_LEVEL || "info";

const options = {
    level: defaultLevel,
    customLevels,
    hooks: {
        logMethod(
            inputArgs: [string | Record<string, unknown>, ...unknown[]],
            method: LogFn
        ): void {
            const [arg1, ...rest] = inputArgs;

            if (typeof arg1 === "object") {
                const messageParts = rest.map((arg) =>
                    typeof arg === "string" ? arg : JSON.stringify(arg)
                );
                const message = messageParts.join(" ");
                return method.apply(this, [arg1, message]);
            } else {
                const context = {};
                const messageParts = [arg1, ...rest].map((arg) =>
                    typeof arg === "string" ? arg : arg
                );
                const message = messageParts
                    .filter((part) => typeof part === "string")
                    .join(" ");
                const jsonParts = messageParts.filter(
                    (part) => typeof part === "object"
                );

                Object.assign(context, ...jsonParts);

                return method.apply(this, [context, message]);
            }
        },
    },
};

// Create the base logger
const baseLogger = pino(options, createStream());

// Define flexible log method signature
type FlexibleLogFn = {
    (message: string, ...args: any[]): void;
    (context: Record<string, unknown>, message?: string, ...args: any[]): void;
    (obj: unknown, msg?: string, ...args: any[]): void;
};

// Define a flexible logger interface that accepts various argument patterns
type FlexibleLogger = {
    fatal: FlexibleLogFn;
    error: FlexibleLogFn;
    warn: FlexibleLogFn;
    info: FlexibleLogFn;
    log: FlexibleLogFn;
    progress: FlexibleLogFn;
    success: FlexibleLogFn;
    debug: FlexibleLogFn;
    trace: FlexibleLogFn;
} & Omit<Logger, 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'>;

// Export the logger with flexible typing
export const elizaLogger = baseLogger as unknown as FlexibleLogger;

export default elizaLogger;
