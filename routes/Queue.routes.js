const express = require('express');
const router = express.Router();
const QueueService = require('../services/QueueService');
const authMiddleware = require('../middleware/Auth.middleware');

router.get('/stats', authMiddleware('admin'), async (req, res) => {
    try {
        const stats = await QueueService.getJobStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get queue stats' });
    }
});

router.post('/cleanup', authMiddleware('admin'), async (req, res) => {
    try {
        const { daysOld = 30 } = req.body;
        const deletedCount = await QueueService.cleanupOldJobs(daysOld);
        res.json({ message: `Cleaned up ${deletedCount} old jobs` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cleanup jobs' });
    }
});

module.exports = router;
