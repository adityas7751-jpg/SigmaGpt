import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();


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

    // Remove unnecessary punctuation from beginning/end
    const cleanText = cleanedMessage.replace(
        /^[\s.,!?]+|[\s.,!?]+$/g,
        ""
    );

    // Take first 7 words
    const words = cleanText.split(" ");
    let title = words.slice(0, 7).join(" ");

    // Add ... if message is longer
    if (words.length > 7) {
        title += "...";
    }

    // Maximum 45 characters
    if (title.length > 45) {
        title = title.substring(0, 45).trim();

        const lastSpace = title.lastIndexOf(" ");

        if (lastSpace > 20) {
            title = title.substring(0, lastSpace);
        }

        title += "...";
    }

    // Capitalize first letter
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

        const response = await thread.save();

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
        const threads = await Thread.find({})
            .sort({ updatedAt: -1 });

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


// =========================
// Delete thread
// =========================

router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const deletedThread =
            await Thread.findOneAndDelete({ threadId });

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


// =========================
// Rename thread
// =========================

router.put("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Title is required"
        });
    }

    try {
        const thread = await Thread.findOne({ threadId });

        if (!thread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        thread.title = title.trim();
        thread.updatedAt = new Date();

        await thread.save();

        return res.status(200).json({
            success: true,
            thread
        });

    } catch (err) {
        console.log("Rename thread error:", err);

        return res.status(500).json({
            error: "Failed to rename thread"
        });
    }
});


// =========================
// Chat
// =========================

router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if (!threadId || !message || !message.trim()) {
        return res.status(400).json({
            error: "Missing required fields"
        });
    }

    try {
        let thread = await Thread.findOne({ threadId });


        // =========================
        // Create New Thread
        // =========================

        if (!thread) {

            const chatTitle = createChatTitle(message);

            thread = new Thread({
                threadId,

                title: chatTitle,

                messages: [
                    {
                        role: "user",
                        content: message.trim()
                    }
                ]
            });

        } else {

            // Existing thread
            thread.messages.push({
                role: "user",
                content: message.trim()
            });
        }


        // =========================
        // Gemini Response
        // =========================

        const assistantReply =
            await getOpenAIAPIResponse(
                thread.messages
            );


        // =========================
        // Save AI Response
        // =========================

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

        console.log("Chat error:", err);

        return res.status(500).json({
            error:
                err.message ||
                "Something went wrong"
        });
    }
});


export default router;