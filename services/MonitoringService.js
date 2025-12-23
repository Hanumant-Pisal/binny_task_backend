const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
    metric: String,
    value: Number,
    timestamp: { type: Date, default: Date.now },
    tags: mongoose.Schema.Types.Mixed
});

const PerformanceMetric = mongoose.model('PerformanceMetric', performanceSchema);

class MonitoringService {
    static async recordMetric(metric, value, tags = {}) {
        try {
            const record = new PerformanceMetric({
                metric,
                value,
                tags
            });
            
            await record.save();
        } catch (error) {
            console.error('Failed to record metric:', error);
        }
    }

    static async getMetrics(metric, timeRange = '1h') {
        try {
            const timeRanges = {
                '1h': new Date(Date.now() - 60 * 60 * 1000),
                '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
                '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            };

            const startTime = timeRanges[timeRange] || timeRanges['1h'];

            const metrics = await PerformanceMetric.find({
                metric,
                timestamp: { $gte: startTime }
            }).sort({ timestamp: 1 });

            return metrics;
        } catch (error) {
            console.error('Failed to get metrics:', error);
            return [];
        }
    }

    static async getDatabaseStats() {
        try {
            const db = mongoose.connection.db;
            const stats = await db.stats();
            
            return {
                collections: stats.collections,
                dataSize: stats.dataSize,
                storageSize: stats.storageSize,
                indexes: stats.indexes,
                indexSize: stats.indexSize
            };
        } catch (error) {
            console.error('Failed to get database stats:', error);
            return {};
        }
    }

    static async getCollectionStats(collectionName) {
        try {
            const db = mongoose.connection.db;
            const stats = await db.collection(collectionName).stats();
            
            return {
                count: stats.count,
                size: stats.size,
                avgObjSize: stats.avgObjSize,
                indexes: stats.nindexes,
                indexSize: stats.totalIndexSize
            };
        } catch (error) {
            console.error(`Failed to get ${collectionName} stats:`, error);
            return {};
        }
    }

    static async cleanupOldMetrics(daysOld = 7) {
        try {
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
            const result = await PerformanceMetric.deleteMany({
                timestamp: { $lt: cutoffDate }
            });
            
            console.log(`Cleaned up ${result.deletedCount} old metrics`);
            return result.deletedCount;
        } catch (error) {
            console.error('Failed to cleanup old metrics:', error);
            throw error;
        }
    }
}

module.exports = MonitoringService;
