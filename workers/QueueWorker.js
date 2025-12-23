const QueueService = require('../services/QueueService');
const mongoose = require('mongoose');

class QueueWorker {
    constructor(workerId, pollInterval = 5000) {
        this.workerId = workerId;
        this.pollInterval = pollInterval;
        this.isRunning = false;
        this.processedCount = 0;
        this.errorCount = 0;
    }

    async start() {
        if (this.isRunning) {
            console.log(`Worker ${this.workerId} is already running`);
            return;
        }

        this.isRunning = true;
        console.log(`Queue worker ${this.workerId} started`);
        
        this.poll();
    }

    async stop() {
        this.isRunning = false;
        console.log(`Queue worker ${this.workerId} stopped`);
    }

    async poll() {
        if (!this.isRunning) return;

        try {
            const jobs = await QueueService.getNextJobs(5);
            
            if (jobs.length > 0) {
                console.log(`Worker ${this.workerId} processing ${jobs.length} jobs`);
                
                const promises = jobs.map(job => this.processJobWithTimeout(job));
                await Promise.allSettled(promises);
            }
        } catch (error) {
            console.error(`Worker ${this.workerId} poll error:`, error);
            this.errorCount++;
        }

        setTimeout(() => this.poll(), this.pollInterval);
    }

    async processJobWithTimeout(job) {
        const timeout = 30000;
        
        try {
            await Promise.race([
                QueueService.processJob(job._id),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Job timeout')), timeout)
                )
            ]);
            
            this.processedCount++;
        } catch (error) {
            console.error(`Worker ${this.workerId} job ${job._id} failed:`, error.message);
            this.errorCount++;
        }
    }

    getStats() {
        return {
            workerId: this.workerId,
            isRunning: this.isRunning,
            processedCount: this.processedCount,
            errorCount: this.errorCount,
            successRate: this.processedCount > 0 
                ? ((this.processedCount - this.errorCount) / this.processedCount * 100).toFixed(2)
                : 0
        };
    }
}

module.exports = QueueWorker;
