const mongoose = require('mongoose');

const connection = async () => {
    try {
        const options = {
            maxPoolSize: 20,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
        };

        await mongoose.connect(process.env.MONGODB_URL, options);
        console.log("Database connected successfully");

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

connection();