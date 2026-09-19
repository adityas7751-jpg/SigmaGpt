import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";


const app = express();

const PORT = 8080;


// =====================================
// MIDDLEWARE
// =====================================

app.use(express.json());

app.use(cors());


// =====================================
// ROUTES
// =====================================

// Existing chat routes
app.use("/api", chatRoutes);

// Authentication routes
app.use("/api/auth", authRoutes);


// =====================================
// DATABASE
// =====================================

const connectDB = async () => {

    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "Connected with Database!"
        );

    } catch (err) {

        console.log(
            "Failed to connect with Db",
            err
        );

    }

};


// =====================================
// START SERVER
// =====================================

const startServer = async () => {

    await connectDB();

    app.listen(PORT, () => {

        console.log(
            `server running on ${PORT}`
        );

    });

};


startServer();