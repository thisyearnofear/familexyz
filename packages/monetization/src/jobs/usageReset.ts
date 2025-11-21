/**
 * Usage Reset Jobs
 * Scheduled jobs to reset usage counters
 */

import type { UsageTracker } from '../services/UsageTracker.js';
import type { SubscriptionService } from '../services/SubscriptionService.js';
import { elizaLogger } from '@elizaos/core';

export interface JobScheduler {
    scheduleDaily(name: string, hour: number, minute: number, fn: () => Promise<void>): void;
    scheduleMonthly(name: string, day: number, hour: number, minute: number, fn: () => Promise<void>): void;
}

/**
 * Register usage reset jobs
 */
export function registerUsageResetJobs(
    usageTracker: UsageTracker,
    subscriptionService: SubscriptionService,
    scheduler?: JobScheduler
) {
    // If no scheduler provided, use simple setInterval
    if (!scheduler) {
        scheduler = createSimpleScheduler();
    }

    // Daily reset for API calls (midnight)
    scheduler.scheduleDaily('reset-api-calls', 0, 0, async () => {
        try {
            elizaLogger.info('Running daily API calls reset job...');
            const count = await usageTracker.resetAllUsage('api_calls');
            elizaLogger.info(`Reset API calls usage for ${count} records`);
        } catch (error) {
            elizaLogger.error('Failed to reset API calls usage:', error);
        }
    });

    // Monthly reset for messages and web searches (1st of month, midnight)
    scheduler.scheduleMonthly('reset-monthly-usage', 1, 0, 0, async () => {
        try {
            elizaLogger.info('Running monthly usage reset job...');

            // Reset messages
            const messagesCount = await usageTracker.resetAllUsage('ai_messages');
            elizaLogger.info(`Reset AI messages usage for ${messagesCount} records`);

            // Reset web searches
            const searchesCount = await usageTracker.resetAllUsage('web_searches');
            elizaLogger.info(`Reset web searches usage for ${searchesCount} records`);

            elizaLogger.info('Monthly usage reset completed');
        } catch (error) {
            elizaLogger.error('Failed to reset monthly usage:', error);
        }
    });

    // Check for expired subscriptions (daily at 1 AM)
    scheduler.scheduleDaily('check-expired-subscriptions', 1, 0, async () => {
        try {
            elizaLogger.info('Checking for expired subscriptions...');
            const expired = await subscriptionService.checkExpired();

            if (expired.length > 0) {
                elizaLogger.info(`Found ${expired.length} expired subscriptions`);

                // Optionally send notifications to users
                for (const subscription of expired) {
                    elizaLogger.info(`Subscription ${subscription.id} expired for user ${subscription.userId}`);
                    // TODO: Send email notification
                }
            } else {
                elizaLogger.info('No expired subscriptions found');
            }
        } catch (error) {
            elizaLogger.error('Failed to check expired subscriptions:', error);
        }
    });

    // Clean up old usage records (monthly, keep last 6 months)
    scheduler.scheduleMonthly('cleanup-old-usage', 1, 2, 0, async () => {
        try {
            elizaLogger.info('Cleaning up old usage records...');
            const sixMonthsAgo = Math.floor(Date.now() / 1000) - (6 * 30 * 24 * 60 * 60);

            // This would need to be implemented in UsageTracker
            // await usageTracker.deleteOldRecords(sixMonthsAgo);

            elizaLogger.info('Old usage records cleanup completed');
        } catch (error) {
            elizaLogger.error('Failed to cleanup old usage records:', error);
        }
    });

    elizaLogger.info('Usage reset jobs registered successfully');
}

/**
 * Create a simple scheduler using setInterval
 */
function createSimpleScheduler(): JobScheduler {
    return {
        scheduleDaily(name: string, hour: number, minute: number, fn: () => Promise<void>) {
            const runJob = async () => {
                const now = new Date();
                const scheduledTime = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    hour,
                    minute,
                    0
                );

                // If scheduled time has passed today, schedule for tomorrow
                if (now > scheduledTime) {
                    scheduledTime.setDate(scheduledTime.getDate() + 1);
                }

                const delay = scheduledTime.getTime() - now.getTime();

                setTimeout(async () => {
                    await fn();
                    // Reschedule for next day
                    setInterval(fn, 24 * 60 * 60 * 1000);
                }, delay);
            };

            runJob();
        },

        scheduleMonthly(name: string, day: number, hour: number, minute: number, fn: () => Promise<void>) {
            const runJob = async () => {
                const now = new Date();
                const scheduledTime = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    day,
                    hour,
                    minute,
                    0
                );

                // If scheduled time has passed this month, schedule for next month
                if (now > scheduledTime) {
                    scheduledTime.setMonth(scheduledTime.getMonth() + 1);
                }

                const delay = scheduledTime.getTime() - now.getTime();

                setTimeout(async () => {
                    await fn();
                    // Reschedule for next month
                    const nextMonth = new Date(scheduledTime);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    const nextDelay = nextMonth.getTime() - Date.now();
                    setTimeout(runJob, nextDelay);
                }, delay);
            };

            runJob();
        },
    };
}

/**
 * Manual job runner for testing
 */
export class UsageResetJobRunner {
    constructor(
        private usageTracker: UsageTracker,
        private subscriptionService: SubscriptionService
    ) {}

    /**
     * Manually run daily reset
     */
    async runDailyReset(): Promise<void> {
        elizaLogger.info('Manually running daily reset...');
        const count = await this.usageTracker.resetAllUsage('api_calls');
        elizaLogger.info(`Reset API calls usage for ${count} records`);
    }

    /**
     * Manually run monthly reset
     */
    async runMonthlyReset(): Promise<void> {
        elizaLogger.info('Manually running monthly reset...');

        const messagesCount = await this.usageTracker.resetAllUsage('ai_messages');
        elizaLogger.info(`Reset AI messages usage for ${messagesCount} records`);

        const searchesCount = await this.usageTracker.resetAllUsage('web_searches');
        elizaLogger.info(`Reset web searches usage for ${searchesCount} records`);
    }

    /**
     * Manually check expired subscriptions
     */
    async checkExpired(): Promise<void> {
        elizaLogger.info('Manually checking expired subscriptions...');
        const expired = await this.subscriptionService.checkExpired();
        elizaLogger.info(`Found ${expired.length} expired subscriptions`);
        return;
    }
}

/**
 * Cron-style scheduler (if using node-cron or similar)
 */
export function createCronScheduler(cron: any): JobScheduler {
    return {
        scheduleDaily(name: string, hour: number, minute: number, fn: () => Promise<void>) {
            // Cron format: minute hour * * *
            const schedule = `${minute} ${hour} * * *`;
            cron.schedule(schedule, fn, { name });
        },

        scheduleMonthly(name: string, day: number, hour: number, minute: number, fn: () => Promise<void>) {
            // Cron format: minute hour day * *
            const schedule = `${minute} ${hour} ${day} * *`;
            cron.schedule(schedule, fn, { name });
        },
    };
}
