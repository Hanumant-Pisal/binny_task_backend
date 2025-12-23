const express = require("express");
const cors = require("cors");
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const AuthRoutes = require("./routes/Auth.routes");
const userRoutes = require("./routes/User.routes");
const movireRoutes = require("./routes/movie.routes");
const adminRoutes = require("./routes/Admin.routes");
const queueRoutes = require("./routes/Queue.routes");
const errorMiddleware = require("./middleware/Error.middleware");
const QueueWorker = require("./workers/QueueWorker");
require("dotenv").config();
require("./config/database");

const app = express();

const port = process.env.PORT || 8000;
const WORKER_COUNT = process.env.WORKER_COUNT ? parseInt(process.env.WORKER_COUNT) : 1;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use("/api/auth", AuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movireRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queue', queueRoutes);

app.get("/test", (req, resp) => {
  resp.send("Api is working...");
});

app.use(errorMiddleware);

const workers = [];

const startWorkers = () => {
    for (let i = 1; i <= WORKER_COUNT; i++) {
        const worker = new QueueWorker(`worker-${i}`, 5000);
        workers.push(worker);
        worker.start();
    }
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Started ${WORKER_COUNT} queue workers`);
    }
};

const gracefulShutdown = () => {
    console.log('Shutting down workers...');
    Promise.all(workers.map(worker => worker.stop()))
        .then(() => {
            console.log('All workers stopped');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error stopping workers:', error);
            process.exit(1);
        });
};

app.listen(port, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Server started at port ${port}`);
    }
    startWorkers();
});

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
