import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();

// Test
router.post("/test", async (req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        return res.send(response);

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Failed to save in DB"
        });
    }
});

// Get all threads
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({}).sort({
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

// Get messages of a thread
router.get("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({ threadId });

        if (!thread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        return res.json(thread.messages);

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Failed to fetch chat"
        });
    }
});

// Delete thread
router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({
            threadId
        });

        if (!deletedThread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        return res.status(200).json({
            success: "Thread deleted successfully"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Failed to delete thread"
        });
    }
});

// Chat
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if (!threadId || !message) {
        return res.status(400).json({
            error: "missing required fields"
        });
    }

    try {
        let thread = await Thread.findOne({ threadId });

        if (!thread) {
            thread = new Thread({
                threadId,
                title: message,
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]
            });
        } else {
            thread.messages.push({
                role: "user",
                content: message
            });
        }

        // Send complete conversation to Gemini
        const assistantReply = await getOpenAIAPIResponse(
            thread.messages
        );

        // Save AI response
        thread.messages.push({
            role: "assistant",
            content: assistantReply
        });

        thread.updatedAt = new Date();

        await thread.save();

        return res.json({
            reply: assistantReply
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: "something went wrong"
        });
    }
});

export default router;