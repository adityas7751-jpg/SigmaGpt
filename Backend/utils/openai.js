import "dotenv/config";

const MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash"
];

const MAX_RETRIES_PER_MODEL = 1;

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const buildContents = (messages) => {

    return messages
        .filter(
            (message) =>
                message &&
                message.content &&
                String(message.content).trim()
        )
        .map((message) => ({
            role:
                message.role === "assistant"
                    ? "model"
                    : "user",

            parts: [
                {
                    text: String(message.content)
                }
            ]
        }));
};

// =====================================================
// NORMAL RESPONSE
// =====================================================

const getOpenAIAPIResponse = async (messages) => {

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Gemini API key is not configured."
        );
    }

    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {
        throw new Error(
            "No conversation messages were provided."
        );
    }

    const contents =
        buildContents(messages);

    if (contents.length === 0) {
        throw new Error(
            "No valid conversation content was provided."
        );
    }

    let lastError = null;

    for (const model of MODELS) {

        for (
            let attempt = 1;
            attempt <= MAX_RETRIES_PER_MODEL;
            attempt++
        ) {

            try {

                console.log(
                    `Gemini request: ${model} | attempt ${attempt}`
                );

                const response =
                    await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "x-goog-api-key":
                                    apiKey
                            },

                            body: JSON.stringify({

                                contents,

                                generationConfig: {

                                    thinkingConfig: {
                                        thinkingLevel:
                                            "minimal"
                                    },

                                    maxOutputTokens:
                                        500
                                }
                            })
                        }
                    );

                const data =
                    await response.json();

                if (response.ok) {

                    const text =
                        data
                            ?.candidates?.[0]
                            ?.content?.parts
                            ?.map(
                                (part) =>
                                    part.text || ""
                            )
                            .join("")
                            .trim();

                    if (text) {

                        console.log(
                            `Gemini success: ${model}`
                        );

                        return text;
                    }

                    lastError =
                        new Error(
                            "Gemini returned an empty response."
                        );

                } else {

                    const status =
                        response.status;

                    const errorMessage =
                        data?.error?.message ||
                        "Unknown Gemini API error.";

                    console.log(
                        `Gemini ${model} failed:`,
                        status,
                        errorMessage
                    );

                    lastError =
                        new Error(
                            errorMessage
                        );

                    const retryable =
                        [
                            429,
                            500,
                            502,
                            503,
                            504
                        ].includes(status);

                    if (
                        !retryable
                    ) {
                        break;
                    }

                    if (
                        attempt <
                        MAX_RETRIES_PER_MODEL
                    ) {
                        await sleep(300);
                    }
                }

            } catch (error) {

                console.log(
                    `Gemini request exception for ${model}:`,
                    error.message
                );

                lastError =
                    error;

                if (
                    attempt <
                    MAX_RETRIES_PER_MODEL
                ) {
                    await sleep(300);
                }
            }
        }

        console.log(
            `Trying next Gemini model after ${model}...`
        );
    }

    throw new Error(
        "AI service is temporarily busy. Please try again."
    );
};

// =====================================================
// STREAMING RESPONSE
// =====================================================

const streamOpenAIAPIResponse = async (
    messages,
    onChunk
) => {

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Gemini API key is not configured."
        );
    }

    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {
        throw new Error(
            "No conversation messages were provided."
        );
    }

    if (
        typeof onChunk !== "function"
    ) {
        throw new Error(
            "Streaming callback is required."
        );
    }

    const contents =
        buildContents(messages);

    if (contents.length === 0) {
        throw new Error(
            "No valid conversation content was provided."
        );
    }

    let lastError = null;

    for (const model of MODELS) {

        try {

            console.log(
                `Gemini STREAM request: ${model}`
            );

            const response =
                await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                apiKey,

                            "Accept":
                                "text/event-stream"
                        },

                        body: JSON.stringify({

                            contents,

                            generationConfig: {

                                thinkingConfig: {
                                    thinkingLevel:
                                        "minimal"
                                },

                                maxOutputTokens:
                                    500
                            }
                        })
                    }
                );

            if (!response.ok) {

                const errorText =
                    await response.text();

                console.log(
                    `Gemini STREAM ${model} failed:`,
                    response.status,
                    errorText
                );

                lastError =
                    new Error(
                        errorText ||
                        `Gemini API error ${response.status}`
                    );

                const retryable =
                    [
                        429,
                        500,
                        502,
                        503,
                        504
                    ].includes(
                        response.status
                    );

                if (retryable) {
                    console.log(
                        `Trying next Gemini streaming model after ${model}...`
                    );

                    continue;
                }

                throw lastError;
            }

            if (!response.body) {
                throw new Error(
                    "Gemini streaming response has no body."
                );
            }

            console.log(
                `Gemini STREAM connected: ${model}`
            );

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder("utf-8");

            let buffer = "";

            while (true) {

                const {
                    value,
                    done
                } =
                    await reader.read();

                if (done) {
                    break;
                }

                buffer +=
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );

                const events =
                    buffer.split("\n\n");

                buffer =
                    events.pop() || "";

                for (
                    const event
                    of events
                ) {

                    const lines =
                        event.split("\n");

                    for (
                        const line
                        of lines
                    ) {

                        const trimmed =
                            line.trim();

                        if (
                            !trimmed ||
                            trimmed.startsWith(":")
                        ) {
                            continue;
                        }

                        if (
                            !trimmed.startsWith(
                                "data:"
                            )
                        ) {
                            continue;
                        }

                        const jsonText =
                            trimmed
                                .substring(5)
                                .trim();

                        if (
                            !jsonText
                        ) {
                            continue;
                        }

                        try {

                            const data =
                                JSON.parse(
                                    jsonText
                                );

                            const parts =
                                data
                                    ?.candidates?.[0]
                                    ?.content?.parts;

                            if (
                                Array.isArray(parts)
                            ) {

                                for (
                                    const part
                                    of parts
                                ) {

                                    if (
                                        part?.text
                                    ) {

                                        onChunk(
                                            part.text
                                        );
                                    }
                                }
                            }

                        } catch (
                            parseError
                        ) {

                            console.log(
                                "Gemini stream JSON parse warning:",
                                parseError.message
                            );
                        }
                    }
                }
            }

            const remaining =
                buffer.trim();

            if (remaining) {

                const lines =
                    remaining.split("\n");

                for (
                    const line
                    of lines
                ) {

                    const trimmed =
                        line.trim();

                    if (
                        !trimmed.startsWith(
                            "data:"
                        )
                    ) {
                        continue;
                    }

                    const jsonText =
                        trimmed
                            .substring(5)
                            .trim();

                    if (
                        !jsonText
                    ) {
                        continue;
                    }

                    try {

                        const data =
                            JSON.parse(
                                jsonText
                            );

                        const parts =
                            data
                                ?.candidates?.[0]
                                ?.content?.parts;

                        if (
                            Array.isArray(parts)
                        ) {

                            for (
                                const part
                                of parts
                            ) {

                                if (
                                    part?.text
                                ) {

                                    onChunk(
                                        part.text
                                    );
                                }
                            }
                        }

                    } catch {
                        // Ignore incomplete final SSE data
                    }
                }
            }

            console.log(
                `Gemini STREAM completed: ${model}`
            );

            return;

        } catch (error) {

            console.log(
                `Gemini STREAM exception for ${model}:`,
                error.message
            );

            lastError =
                error;
        }
    }

    throw (
        lastError ||
        new Error(
            "AI streaming service is temporarily busy."
        )
    );
};

export {
    streamOpenAIAPIResponse
};

export default getOpenAIAPIResponse;