import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import authRoutes from "./server/routes/auth.js";
import tripRoutes from "./server/routes/trips.js";

async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Enable CORS for frontend requests
    app.use(cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173", // URL of your React Vite server
        credentials: true
    }));
    app.use(express.json());

    // Database Connection
    const connectWithFallback = async () => {
        let connected = false;
        if (process.env.MONGODB_URI) {
            try {
                console.log("Trying to connect to MONGODB_URI...");
                await mongoose.connect(process.env.MONGODB_URI);
                console.log("Connected to MongoDB via MONGODB_URI");
                connected = true;
            } catch (error) {
                console.error("MongoDB connection error:", (error as any).message || error);
            }
        }

        if (!connected) {
            try {
                console.log("Starting in-memory MongoDB...");
                const { MongoMemoryServer } = await import("mongodb-memory-server");
                const mongoServer = await MongoMemoryServer.create();
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
                console.log("Connected to in-memory MongoDB");
            } catch (error) {
                console.error("In-memory MongoDB connection error:", error);
            }
        }
    };

    await connectWithFallback();

    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/trips", tripRoutes);

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok" });
    });

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack);
        res.status(500).json({ error: "Something broke!", details: err.message });
    });

    app.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
