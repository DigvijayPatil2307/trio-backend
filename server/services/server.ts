import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

import authRoutes from "./server/routes/auth.js";
import tripRoutes from "./server/routes/trips.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
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
        console.error("MongoDB connection error with provided URI:", (error as any).message || error);
        console.log("Falling back to in-memory MongoDB...");
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Since Express 4 is used generally (and verified as 4.21.2) we use '*'
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something broke!", details: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
