import express from "express";
import jwt from "jsonwebtoken";

import Thread from "../models/Thread.js";
import User from "../models/User.js";

import getOpenAIAPIResponse, {
    streamOpenAIAPIResponse
} from "../utils/openai.js";

const router = express.Router();

// =====================================================
// FREE USER DAILY AI LIMIT
// =====================================================

const FREE_DAILY_LIMIT = 10;

// =====================================================
// TEMPORARY USAGE TRACKER
// =====================================================

const usageTracker = new Map();

// =====================================================
// GET USER FROM JWT
// =====================================================

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

// =====================================================
// CREATE CLEAN CHAT TITLE
// =====================================================

const createChatTitle = (message) => {

    const cleanedMessage =
        String(message || "")
            .trim()
            .replace(/\s+/g, " ");

    if (!cleanedMessage) {
        return "New Chat";
    }

    const cleanText =
        cleanedMessage.replace(
            /^[\s.,!?]+|[\s.,!?]+$/g,
            ""
        );

    const words =
        cleanText.split(" ");

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

// =====================================================
// VALIDATE ATTACHMENT
// =====================================================

const validateAttachment = (
    attachment
) => {

    if (!attachment) {
        return null;
    }

    if (
        typeof attachment !== "object"
    ) {

        throw new Error(
            "Invalid attachment."
        );

    }

    if (
        !attachment.data ||
        !attachment.mimeType
    ) {

        throw new Error(
            "Attachment data is missing."
        );

    }

    if (
        typeof attachment.data !==
        "string"
    ) {

        throw new Error(
            "Invalid attachment data."
        );

    }

    if (
        typeof attachment.mimeType !==
        "string"
    ) {

        throw new Error(
            "Invalid attachment MIME type."
        );

    }

    if (
        attachment.data.length === 0
    ) {

        throw new Error(
            "Attachment is empty."
        );

    }

    // Approximately 30 MB raw-file limit
    // after base64 conversion.
    if (
        attachment.data.length >
        40 * 1024 * 1024
    ) {

        throw new Error(
            "Attachment is too large. Please select a file smaller than 30 MB."
        );

    }

    return attachment;
};

// =====================================================
// GET USAGE
// =====================================================

const getUsage = (
    user,
    currentUsage
) => {

    const isPremium =
        user?.plan === "premium";

    if (isPremium) {

        return {
            used: null,
            limit: null,
            remaining: null
        };

    }

    return {

        used:
            currentUsage,

        limit:
            FREE_DAILY_LIMIT,

        remaining:
            Math.max(
                FREE_DAILY_LIMIT -
                currentUsage,
                0
            )

    };
};

// =====================================================
// TEST ROUTE
// =====================================================

router.post(
    "/test",
    async (req, res) => {

        try {

            const thread =
                new Thread({

                    threadId:
                        "abc",

                    title:
                        "Testing New Thread2"

                });

            const response =
                await thread.save();

            return res.send(
                response
            );

        } catch (err) {

            console.log(err);

            return res.status(500).json({

                error:
                    "Failed to save in DB"

            });

        }

    }
);

// =====================================================
// GET ALL THREADS
// =====================================================

router.get(
    "/thread",
    async (req, res) => {

        try {

            const threads =
                await Thread
                    .find({})
                    .sort({
                        updatedAt: -1
                    });

            return res.json(
                threads
            );

        } catch (err) {

            console.log(err);

            return res.status(500).json({

                error:
                    "Failed to fetch threads"

            });

        }

    }
);

// =====================================================
// GET MESSAGES OF THREAD
// =====================================================

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

// =====================================================
// DELETE THREAD
// =====================================================

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

// =====================================================
// RENAME THREAD
// =====================================================

router.put(
    "/thread/:threadId",
    async (req, res) => {

        const {
            threadId
        } = req.params;

        const {
            title
        } = req.body;

        if (
            !title ||
            !title.trim()
        ) {

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

                success:
                    true,

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

// =====================================================
// NORMAL CHAT
// =====================================================

router.post(
    "/chat",
    async (req, res) => {

        const {
            threadId,
            message,
            attachment
        } = req.body;

        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (!threadId) {

            return res.status(400).json({

                error:
                    "Thread ID is required"

            });

        }

        if (
            (!message ||
                !message.trim()) &&
            !attachment
        ) {

            return res.status(400).json({

                error:
                    "Message or attachment is required"

            });

        }

        try {

            // =============================================
            // VALIDATE ATTACHMENT
            // =============================================

            const validAttachment =
                validateAttachment(
                    attachment
                );

            // =============================================
            // AUTHENTICATED USER
            // =============================================

            const user =
                await getAuthenticatedUser(
                    req
                );

            // =============================================
            // FREE / PREMIUM
            // =============================================

            let currentUsage = 0;

            let trackerKey = null;

            if (user) {

                const isPremium =
                    user.plan ===
                    "premium";

                if (!isPremium) {

                    const today =
                        new Date()
                            .toISOString()
                            .split("T")[0];

                    trackerKey =
                        `${user._id}_${today}`;

                    currentUsage =
                        usageTracker.get(
                            trackerKey
                        ) || 0;

                    // =================================
                    // LIMIT REACHED
                    // =================================

                    if (
                        currentUsage >=
                        FREE_DAILY_LIMIT
                    ) {

                        return res
                            .status(403)
                            .json({

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

                    // =================================
                    // INCREMENT
                    // =================================

                    currentUsage += 1;

                    usageTracker.set(
                        trackerKey,
                        currentUsage
                    );

                }

            }

            // =============================================
            // MESSAGE FOR THREAD
            // =============================================

            const userMessage =
                message &&
                message.trim()
                    ? message.trim()
                    : `Analyze the attached file: ${
                        validAttachment?.name ||
                        "document"
                    }`;

            // =============================================
            // FIND THREAD
            // =============================================

            let thread =
                await Thread.findOne({
                    threadId
                });

            // =============================================
            // CREATE THREAD
            // =============================================

            if (!thread) {

                const chatTitle =
                    createChatTitle(
                        userMessage
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
                                    userMessage

                            }

                        ]

                    });

            }

            // =============================================
            // EXISTING THREAD
            // =============================================

            else {

                thread.messages.push({

                    role:
                        "user",

                    content:
                        userMessage

                });

            }

            // =============================================
            // AI RESPONSE
            // =============================================

            const assistantReply =
                await getOpenAIAPIResponse(
                    thread.messages,
                    validAttachment
                );

            // =============================================
            // SAVE AI RESPONSE
            // =============================================

            thread.messages.push({

                role:
                    "assistant",

                content:
                    assistantReply

            });

            thread.updatedAt =
                new Date();

            await thread.save();

            // =============================================
            // USAGE
            // =============================================

            const usage =
                getUsage(
                    user,
                    currentUsage
                );

            // =============================================
            // RESPONSE
            // =============================================

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

// =====================================================
// STREAMING CHAT
// =====================================================

router.post(
    "/chat/stream",
    async (req, res) => {

        const {
            threadId,
            message,
            attachment
        } = req.body;

        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (!threadId) {

            return res.status(400).json({

                error:
                    "Thread ID is required"

            });

        }

        if (
            (!message ||
                !message.trim()) &&
            !attachment
        ) {

            return res.status(400).json({

                error:
                    "Message or attachment is required"

            });

        }

        try {

            // =============================================
            // VALIDATE ATTACHMENT
            // =============================================

            const validAttachment =
                validateAttachment(
                    attachment
                );

            // =============================================
            // GET USER
            // =============================================

            const user =
                await getAuthenticatedUser(
                    req
                );

            // =============================================
            // USAGE
            // =============================================

            let currentUsage = 0;

            let trackerKey = null;

            if (user) {

                const isPremium =
                    user.plan ===
                    "premium";

                if (!isPremium) {

                    const today =
                        new Date()
                            .toISOString()
                            .split("T")[0];

                    trackerKey =
                        `${user._id}_${today}`;

                    currentUsage =
                        usageTracker.get(
                            trackerKey
                        ) || 0;

                    // =================================
                    // LIMIT REACHED
                    // =================================

                    if (
                        currentUsage >=
                        FREE_DAILY_LIMIT
                    ) {

                        return res
                            .status(403)
                            .json({

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

                    // =================================
                    // INCREMENT USAGE
                    // =================================

                    currentUsage += 1;

                    usageTracker.set(
                        trackerKey,
                        currentUsage
                    );

                }

            }

            // =============================================
            // USER MESSAGE
            // =============================================

            const userMessage =
                message &&
                message.trim()
                    ? message.trim()
                    : `Analyze the attached file: ${
                        validAttachment?.name ||
                        "document"
                    }`;

            // =============================================
            // FIND THREAD
            // =============================================

            let thread =
                await Thread.findOne({
                    threadId
                });

            // =============================================
            // CREATE THREAD
            // =============================================

            if (!thread) {

                const chatTitle =
                    createChatTitle(
                        userMessage
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
                                    userMessage

                            }

                        ]

                    });

            }

            // =============================================
            // EXISTING THREAD
            // =============================================

            else {

                thread.messages.push({

                    role:
                        "user",

                    content:
                        userMessage

                });

            }

            // =============================================
            // SSE HEADERS
            // =============================================

            res.status(200);

            res.setHeader(
                "Content-Type",
                "text/event-stream"
            );

            res.setHeader(
                "Cache-Control",
                "no-cache, no-transform"
            );

            res.setHeader(
                "Connection",
                "keep-alive"
            );

            res.setHeader(
                "X-Accel-Buffering",
                "no"
            );

            if (
                typeof res.flushHeaders ===
                "function"
            ) {

                res.flushHeaders();

            }

            // =============================================
            // KEEP ALIVE
            // =============================================

            const keepAlive =
                setInterval(
                    () => {

                        if (
                            !res.writableEnded
                        ) {

                            res.write(
                                ": ping\n\n"
                            );

                        }

                    },
                    15000
                );

            // =============================================
            // SSE HELPER
            // =============================================

            const sendEvent = (
                event,
                data
            ) => {

                if (
                    res.writableEnded
                ) {

                    return;
                }

                res.write(
                    `event: ${event}\n`
                );

                res.write(
                    `data: ${JSON.stringify(data)}\n\n`
                );

            };

            // =============================================
            // START EVENT
            // =============================================

            sendEvent(
                "start",
                {

                    plan:
                        user
                            ? user.plan
                            : "free",

                    attachment:
                        validAttachment
                            ? {
                                name:
                                    validAttachment.name ||
                                    "file",

                                mimeType:
                                    validAttachment.mimeType
                            }
                            : null

                }
            );

            // =============================================
            // AI STREAM
            // =============================================

            let assistantReply = "";

            try {

                await streamOpenAIAPIResponse(

                    thread.messages,

                    (chunk) => {

                        assistantReply +=
                            chunk;

                        sendEvent(
                            "chunk",
                            {
                                text:
                                    chunk
                            }
                        );

                    },

                    validAttachment

                );

            } catch (
                streamError
            ) {

                console.log(
                    "Gemini streaming error:",
                    streamError
                );

                throw streamError;

            }

            // =============================================
            // EMPTY RESPONSE
            // =============================================

            if (
                !assistantReply.trim()
            ) {

                throw new Error(
                    "AI returned an empty response."
                );

            }

            // =============================================
            // SAVE ASSISTANT MESSAGE
            // =============================================

            thread.messages.push({

                role:
                    "assistant",

                content:
                    assistantReply

            });

            thread.updatedAt =
                new Date();

            await thread.save();

            // =============================================
            // USAGE
            // =============================================

            const usage =
                getUsage(
                    user,
                    currentUsage
                );

            // =============================================
            // DONE EVENT
            // =============================================

            sendEvent(
                "done",
                {

                    plan:
                        user
                            ? user.plan
                            : "free",

                    usage,

                    reply:
                        assistantReply

                }
            );

            // =============================================
            // CLEANUP
            // =============================================

            clearInterval(
                keepAlive
            );

            if (
                !res.writableEnded
            ) {

                res.end();

            }

        } catch (err) {

            console.log(
                "Streaming chat error:",
                err
            );

            // ===========================================
            // ERROR EVENT
            // ===========================================

            if (
                res.headersSent
            ) {

                res.write(
                    `event: error\n`
                );

                res.write(
                    `data: ${JSON.stringify({
                        error:
                            err.message ||
                            "Something went wrong"
                    })}\n\n`
                );

                res.end();

            } else {

                return res
                    .status(500)
                    .json({

                        error:
                            err.message ||
                            "Something went wrong"

                    });

            }

        }

    }
);

export default router;