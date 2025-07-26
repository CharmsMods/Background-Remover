import { PERFORMANCE_CONFIG } from '../constants.js';
import { showPerformanceWarning } from '../ui-manager.js';

export class PerformanceManager {
    constructor() {
        this.performanceCheckCount = 0;
        this.totalProcessingTime = 0;
        this.isPerformanceModeActive = false;
        this.lastWarningTime = 0;
        this.warningCooldown = 30000; // 30 seconds cooldown between warnings
    }

    /**
     * Tracks performance and shows warnings if needed
     */
    trackPerformance(processingTime, forceUpdate = false) {
        this.totalProcessingTime += processingTime;
        this.performanceCheckCount++;

        // Only check performance periodically or when forced
        if (this.performanceCheckCount >= PERFORMANCE_CONFIG.CHECK_INTERVAL || forceUpdate) {
            const averageTime = this.totalProcessingTime / this.performanceCheckCount;
            
            // Reset counters
            this.performanceCheckCount = 0;
            this.totalProcessingTime = 0;

            // Check if we need to show a warning
            const now = Date.now();
            if (averageTime > PERFORMANCE_CONFIG.SLOW_THRESHOLD_MS && 
                now - this.lastWarningTime > this.warningCooldown) {
                
                this.lastWarningTime = now;
                
                // Only show warning if not already in performance mode
                if (!this.isPerformanceModeActive) {
                    showPerformanceWarning(averageTime, () => {
                        this.enablePerformanceMode();
                    });
                }
            }
        }
    }

    /**
     * Enables performance mode
     */
    enablePerformanceMode() {
        this.isPerformanceModeActive = true;
        // Additional performance optimizations can be applied here
    }

    /**
     * Disables performance mode
     */
    disablePerformanceMode() {
        this.isPerformanceModeActive = false;
    }

    /**
     * Resets performance tracking
     */
    reset() {
        this.performanceCheckCount = 0;
        this.totalProcessingTime = 0;
        this.lastWarningTime = 0;
    }

    /**
     * Returns whether performance mode is active
     */
    isPerformanceMode() {
        return this.isPerformanceModeActive;
    }
}
