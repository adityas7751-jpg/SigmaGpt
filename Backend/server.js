import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payment.js";

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use(cors());

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "SigmaGPT Backend"
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch (err) {
        console.log("Failed to connect with Db", err);
    }
};

const startServer = async () => {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`server running on ${PORT}`);
    });
};

startServer();