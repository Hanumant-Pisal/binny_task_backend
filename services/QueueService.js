const mongoose = require('mongoose');
const QueueJob = require('../models/QueueJob.models');
const Movie = require('../models/Movie.models');
const User = require('../models/User.models');

class QueueService {
    static async addJob(type, payload, priority = 0, scheduledFor = new Date()) {
        try {
            const job = new QueueJob({
                type,
                payload,
                priority,
                scheduledFor,
            });
            
            await job.save();
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Queue job added: ${job._id}, type: ${type}`);
            }
            return job;
        } catch (error) {
            console.error('Failed to add queue job:', error);
            throw error;
        }
    }

    static async getNextJobs(limit = 10) {
        try {
            const jobs = await QueueJob.find({
                status: 'pending',
                scheduledFor: { $lte: new Date() }
            })
            .sort({ priority: -1, createdAt: 1 })
            .limit(limit)
            .lean();
            
            return jobs;
        } catch (error) {
            console.error('Failed to fetch queue jobs:', error);
            throw error;
        }
    }

    static async processJob(jobId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        let job;
        try {
            job = await QueueJob.findById(jobId).session(session);
            if (!job) {
                throw new Error('Job not found');
            }

            if (job.status !== 'pending') {
                throw new Error('Job is not in pending status');
            }

            job.status = 'processing';
            await job.save({ session });

            let result;
            switch (job.type) {
                case 'movie_insert':
                    result = await this.processMovieInsert(job.payload, session);
                    break;
                case 'user_insert':
                    result = await this.processUserInsert(job.payload, session);
                    break;
                case 'movie_update':
                    result = await this.processMovieUpdate(job.payload, session);
                    break;
                case 'user_update':
                    result = await this.processUserUpdate(job.payload, session);
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }

            job.status = 'completed';
            job.processedAt = new Date();
            await job.save({ session });

            await session.commitTransaction();
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Job completed: ${jobId}`);
            }
            return result;

        } catch (error) {
            await session.abortTransaction();
            
            if (job) {
                job.attempts += 1;
                job.error = error.message;
                
                if (job.attempts >= job.maxAttempts) {
                    job.status = 'failed';
                } else {
                    job.status = 'pending';
                    job.scheduledFor = new Date(Date.now() + Math.pow(2, job.attempts) * 1000);
                }
                
                await job.save();
            }
            if (process.env.NODE_ENV !== 'production') {
                console.error(`Job failed: ${jobId}, attempt: ${job ? job.attempts : 'N/A'}, error: ${error.message}`);
            }
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async processMovieInsert(payload, session) {
        const movie = new Movie(payload);
        await movie.save({ session });
        return movie;
    }

    static async processUserInsert(payload, session) {
        const user = new User(payload);
        await user.save({ session });
        return user;
    }

    static async processMovieUpdate(payload, session) {
        const { id, ...updateData } = payload;
        const movie = await Movie.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true, session }
        );
        
        if (!movie) {
            throw new Error('Movie not found');
        }
        
        return movie;
    }

    static async processUserUpdate(payload, session) {
        const { id, ...updateData } = payload;
        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true, session }
        );
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    }

    static async getJobStats() {
        try {
            const stats = await QueueJob.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            return stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {});
        } catch (error) {
            console.error('Failed to get job stats:', error);
            throw error;
        }
    }

    static async cleanupOldJobs(daysOld = 30) {
        try {
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            const result = await QueueJob.deleteMany({
                status: 'completed',
                processedAt: { $lt: cutoffDate }
            });
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Cleaned up ${result.deletedCount} old jobs`);
            }
            return result.deletedCount;
        } catch (error) {
            console.error('Failed to cleanup old jobs:', error);
            throw error;
        }
    }
}

module.exports = QueueService;
