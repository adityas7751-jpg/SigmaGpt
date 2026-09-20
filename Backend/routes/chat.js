import express from "express";
import jwt from "jsonwebtoken";

import Thread from "../models/Thread.js";
import User from "../models/User.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();

// =========================
// FREE USER DAILY AI LIMIT
// =========================

const FREE_DAILY_LIMIT = 10;

// =========================
// Temporary Usage Tracker
// =========================

const usageTracker = new Map();

// =========================
// Get User From JWT
// =========================

const getAuthenticatedUser = async (req) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return null;
        }

        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null;

        if (!token) {
            return null;
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        const user =
            await User.findById(
                decoded.userId
            );

        return user || null;

    } catch (err) {
        return null;
    }
};

// =========================
// Create Clean Chat Title
// =========================

const createChatTitle = (message) => {
    const cleanedMessage = message
        .trim()
        .replace(/\s+/g, " ");

    if (!cleanedMessage) {
        return "New Chat";
    }

    const cleanText = cleanedMessage.replace(
        /^[\s.,!?]+|[\s.,!?]+$/g,
        ""
    );

    const words = cleanText.split(" ");

    let title =
        words
            .slice(0, 7)
            .join(" ");

    if (words.length > 7) {
        title += "...";
    }

    if (title.length > 45) {
        title =
            title
                .substring(0, 45)
                .trim();

        const lastSpace =
            title.lastIndexOf(" ");

        if (lastSpace > 20) {
            title =
                title.substring(
                    0,
                    lastSpace
                );
        }

        title += "...";
    }

    title =
        title.charAt(0).toUpperCase() +
        title.slice(1);

    return title;
};

// =========================
// Test
// =========================

router.post("/test", async (req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response =
            await thread.save();

        return res.send(response);

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: "Failed to save in DB"
        });
    }
});

// =========================
// Get all threads
// =========================

router.get("/thread", async (req, res) => {
    try {
        const threads =
            await Thread.find({})
                .sort({
                    updatedAt: -1
                });

        return res.json(threads);

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: "Failed to fetch threads"
        });
    }
});

// =========================
// Get messages of a thread
// =========================

router.get(
    "/thread/:threadId",
    async (req, res) => {
        const {
            threadId
        } = req.params;

        try {
            const thread =
                await Thread.findOne({
                    threadId
                });

            if (!thread) {
                return res.status(404).json({
                    error:
                        "Thread not found"
                });
            }

            return res.json(
                thread.messages
            );

        } catch (err) {
            console.log(err);

            return res.status(500).json({
                error:
                    "Failed to fetch chat"
            });
        }
    }
);

// =========================
// Delete thread
// =========================

router.delete(
    "/thread/:threadId",
    async (req, res) => {
        const {
            threadId
        } = req.params;

        try {
            const deletedThread =
                await Thread.findOneAndDelete({
                    threadId
                });

            if (!deletedThread) {
                return res.status(404).json({
                    error:
                        "Thread not found"
                });
            }

            return res.status(200).json({
                success:
                    "Thread deleted successfully"
            });

        } catch (err) {
            console.log(err);

            return res.status(500).json({
                error:
                    "Failed to delete thread"
            });
        }
    }
);

// =========================
// Rename thread
// =========================

router.put(
    "/thread/:threadId",
    async (req, res) => {
        const {
            threadId
        } = req.params;

        const {
            title
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                error:
                    "Title is required"
            });
        }

        try {
            const thread =
                await Thread.findOne({
                    threadId
                });

            if (!thread) {
                return res.status(404).json({
                    error:
                        "Thread not found"
                });
            }

            thread.title =
                title.trim();

            thread.updatedAt =
                new Date();

            await thread.save();

            return res.status(200).json({
                success: true,
                thread
            });

        } catch (err) {
            console.log(
                "Rename thread error:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to rename thread"
            });
        }
    }
);

// =========================
// Chat
// =========================

router.post(
    "/chat",
    async (req, res) => {

        const {
            threadId,
            message
        } = req.body;

        if (
            !threadId ||
            !message ||
            !message.trim()
        ) {
            return res.status(400).json({
                error:
                    "Missing required fields"
            });
        }

        try {

            // =========================
            // Get Logged-in User
            // =========================

            const user =
                await getAuthenticatedUser(
                    req
                );

            // =========================
            // Premium / Free Check
            // =========================

            let currentUsage = 0;
            let today = null;
            let trackerKey = null;

            if (user) {

                const isPremium =
                    user.plan === "premium";

                // =========================
                // Free User Limit
                // =========================

                if (!isPremium) {

                    today =
                        new Date()
                            .toISOString()
                            .split("T")[0];

                    trackerKey =
                        `${user._id}_${today}`;

                    currentUsage =
                        usageTracker.get(
                            trackerKey
                        ) || 0;

                    // =========================
                    // LIMIT REACHED
                    // =========================

                    if (
                        currentUsage >=
                        FREE_DAILY_LIMIT
                    ) {

                        return res.status(403).json({

                            error:
                                "You have reached your daily Free plan AI limit.",

                            limitReached:
                                true,

                            plan:
                                "free",

                            dailyLimit:
                                FREE_DAILY_LIMIT,

                            used:
                                currentUsage,

                            remaining:
                                0,

                            message:
                                "Upgrade to Premium for unlimited AI usage."
                        });
                    }

                    // =========================
                    // INCREMENT USAGE
                    // =========================

                    currentUsage += 1;

                    usageTracker.set(
                        trackerKey,
                        currentUsage
                    );
                }
            }

            // =========================
            // Find Existing Thread
            // =========================

            let thread =
                await Thread.findOne({
                    threadId
                });

            // =========================
            // Create New Thread
            // =========================

            if (!thread) {

                const chatTitle =
                    createChatTitle(
                        message
                    );

                thread =
                    new Thread({

                        threadId,

                        title:
                            chatTitle,

                        messages: [
                            {
                                role:
                                    "user",

                                content:
                                    message.trim()
                            }
                        ]
                    });

            } else {

                thread.messages.push({

                    role:
                        "user",

                    content:
                        message.trim()
                });
            }

            // =========================
            // AI Response
            // =========================

            const assistantReply =
                await getOpenAIAPIResponse(
                    thread.messages
                );

            // =========================
            // Save AI Response
            // =========================

            thread.messages.push({

                role:
                    "assistant",

                content:
                    assistantReply
            });

            thread.updatedAt =
                new Date();

            await thread.save();

            // =========================
            // Usage Information
            // =========================

            const isPremium =
                user?.plan === "premium";

            const usage =
                isPremium
                    ? {
                        used: null,
                        limit: null,
                        remaining: null
                    }
                    : {
                        used: currentUsage,
                        limit:
                            FREE_DAILY_LIMIT,
                        remaining:
                            Math.max(
                                FREE_DAILY_LIMIT -
                                currentUsage,
                                0
                            )
                    };

            // =========================
            // Response
            // =========================

            return res.json({

                reply:
                    assistantReply,

                plan:
                    user
                        ? user.plan
                        : "free",

                usage
            });

        } catch (err) {

            console.log(
                "Chat error:",
                err
            );

            return res.status(500).json({

                error:
                    err.message ||
                    "Something went wrong"
            });
        }
    }
);

export default router;