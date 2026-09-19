import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const getOpenAIAPIResponse = async (messages) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: messages.map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            }))
        });

        return response.text;
    } catch (err) {
        console.log("Gemini API Error:", err.message);
        throw err;
    }
};

export default getOpenAIAPIResponse;