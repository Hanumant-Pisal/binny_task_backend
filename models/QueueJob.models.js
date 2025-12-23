const mongoose = require('mongoose');

const queueJobSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['movie_insert', 'user_insert', 'movie_update', 'user_update'],
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    priority: {
        type: Number,
        default: 0,
        index: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    maxAttempts: {
        type: Number,
        default: 3,
    },
    error: {
        type: String,
        default: null,
    },
    processedAt: {
        type: Date,
        default: null,
    },
    scheduledFor: {
        type: Date,
        default: Date.now,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

queueJobSchema.index({ status: 1, scheduledFor: 1, priority: -1 });
queueJobSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('QueueJob', queueJobSchema);
