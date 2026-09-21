import "dotenv/config";

// =====================================================
// GEMINI MODELS
// =====================================================

const MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash"
];

const MAX_RETRIES_PER_MODEL = 1;

// =====================================================
// SLEEP
// =====================================================

const sleep = (ms) =>
    new Promise((resolve) =>
        setTimeout(resolve, ms)
    );

// =====================================================
// BUILD GEMINI CONTENTS
// Supports:
// - Normal text
// - PDF
// - Images
// - TXT
// - CSV
// - Other supported MIME files
// =====================================================

const buildContents = (
    messages,
    attachment = null
) => {

    const contents =
        messages
            .filter(
                (message) =>
                    message &&
                    message.content &&
                    String(
                        message.content
                    ).trim()
            )
            .map((message) => ({

                role:
                    message.role ===
                    "assistant"
                        ? "model"
                        : "user",

                parts: [
                    {
                        text:
                            String(
                                message.content
                            )
                    }
                ]

            }));

    // =================================================
    // ADD FILE TO LAST USER MESSAGE
    // =================================================

    if (
        attachment &&
        attachment.data &&
        attachment.mimeType &&
        contents.length > 0
    ) {

        const lastContent =
            contents[
                contents.length - 1
            ];

        if (
            lastContent.role ===
            "user"
        ) {

            lastContent.parts.push({

                inlineData: {

                    mimeType:
                        attachment.mimeType,

                    data:
                        attachment.data

                }

            });

        }

    }

    return contents;
};

// =====================================================
// VALIDATE ATTACHMENT
// =====================================================

const validateAttachment = (
    attachment
) => {

    if (!attachment) {
        return;
    }

    if (
        !attachment.data ||
        !attachment.mimeType
    ) {

        throw new Error(
            "Invalid attachment data."
        );
    }

    // Browser se MIME type nahi aaye
    // to PDF default kar sakte hain
    if (
        typeof attachment.mimeType !==
        "string"
    ) {

        throw new Error(
            "Invalid attachment MIME type."
        );
    }

    if (
        typeof attachment.data !==
        "string"
    ) {

        throw new Error(
            "Invalid attachment encoding."
        );
    }

    // Base64 data sanity check
    if (
        attachment.data.length === 0
    ) {

        throw new Error(
            "Attachment is empty."
        );
    }

    // Maximum inline file size:
    // approximately 30 MB base64 payload
    if (
        attachment.data.length >
        40 * 1024 * 1024
    ) {

        throw new Error(
            "Attachment is too large. Please use a file smaller than 30 MB."
        );
    }
};

// =====================================================
// GET API KEY
// =====================================================

const getApiKey = () => {

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {

        throw new Error(
            "Gemini API key is not configured."
        );
    }

    return apiKey;
};

// =====================================================
// NORMAL RESPONSE
// =====================================================

const getOpenAIAPIResponse = async (
    messages,
    attachment = null
) => {

    const apiKey =
        getApiKey();

    // =================================================
    // VALIDATE MESSAGES
    // =================================================

    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {

        throw new Error(
            "No conversation messages were provided."
        );
    }

    // =================================================
    // VALIDATE FILE
    // =================================================

    validateAttachment(
        attachment
    );

    // =================================================
    // BUILD CONTENTS
    // =================================================

    const contents =
        buildContents(
            messages,
            attachment
        );

    if (
        contents.length === 0
    ) {

        throw new Error(
            "No valid conversation content was provided."
        );
    }

    let lastError = null;

    // =================================================
    // TRY MODELS
    // =================================================

    for (
        const model of MODELS
    ) {

        for (
            let attempt = 1;
            attempt <=
            MAX_RETRIES_PER_MODEL;
            attempt++
        ) {

            try {

                console.log(
                    `Gemini request: ${model} | attempt ${attempt}`
                );

                if (attachment) {

                    console.log(
                        `Gemini attachment: ${attachment.name || "file"} | ${attachment.mimeType}`
                    );

                }

                // =====================================
                // API REQUEST
                // =====================================

                const response =
                    await fetch(

                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "x-goog-api-key":
                                    apiKey

                            },

                            body:
                                JSON.stringify({

                                    contents,

                                    generationConfig: {

                                        thinkingConfig:
                                            {
                                                thinkingLevel:
                                                    "minimal"
                                            },

                                        maxOutputTokens:
                                            500

                                    }

                                })

                        }

                    );

                // =====================================
                // RESPONSE JSON
                // =====================================

                const data =
                    await response.json();

                // =====================================
                // SUCCESS
                // =====================================

                if (
                    response.ok
                ) {

                    const text =
                        data
                            ?.candidates?.[0]
                            ?.content?.parts
                            ?.map(
                                (part) =>
                                    part?.text ||
                                    ""
                            )
                            .join("")
                            .trim();

                    if (
                        text
                    ) {

                        console.log(
                            `Gemini success: ${model}`
                        );

                        return text;
                    }

                    lastError =
                        new Error(
                            "Gemini returned an empty response."
                        );

                }

                // =====================================
                // API ERROR
                // =====================================

                else {

                    const status =
                        response.status;

                    const errorMessage =
                        data
                            ?.error
                            ?.message ||
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

                    // =================================
                    // RETRYABLE ERRORS
                    // =================================

                    const retryable =
                        [
                            429,
                            500,
                            502,
                            503,
                            504
                        ].includes(
                            status
                        );

                    if (
                        !retryable
                    ) {

                        break;
                    }

                    if (
                        attempt <
                        MAX_RETRIES_PER_MODEL
                    ) {

                        await sleep(
                            300
                        );
                    }

                }

            }

            // =========================================
            // REQUEST EXCEPTION
            // =========================================

            catch (
                error
            ) {

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

                    await sleep(
                        300
                    );
                }

            }

        }

        console.log(
            `Trying next Gemini model after ${model}...`
        );

    }

    // =================================================
    // ALL MODELS FAILED
    // =================================================

    throw (
        lastError ||
        new Error(
            "AI service is temporarily busy. Please try again."
        )
    );
};

// =====================================================
// STREAMING RESPONSE
// =====================================================

const streamOpenAIAPIResponse = async (
    messages,
    onChunk,
    attachment = null
) => {

    const apiKey =
        getApiKey();

    // =================================================
    // VALIDATE MESSAGES
    // =================================================

    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {

        throw new Error(
            "No conversation messages were provided."
        );
    }

    // =================================================
    // VALIDATE CALLBACK
    // =================================================

    if (
        typeof onChunk !==
        "function"
    ) {

        throw new Error(
            "Streaming callback is required."
        );
    }

    // =================================================
    // VALIDATE ATTACHMENT
    // =================================================

    validateAttachment(
        attachment
    );

    // =================================================
    // BUILD CONTENTS
    // =================================================

    const contents =
        buildContents(
            messages,
            attachment
        );

    if (
        contents.length === 0
    ) {

        throw new Error(
            "No valid conversation content was provided."
        );
    }

    let lastError = null;

    // =================================================
    // STREAM USING MODELS
    // =================================================

    for (
        const model of MODELS
    ) {

        try {

            console.log(
                `Gemini STREAM request: ${model}`
            );

            if (
                attachment
            ) {

                console.log(
                    `Gemini STREAM attachment: ${attachment.name || "file"} | ${attachment.mimeType}`
                );

            }

            // =========================================
            // STREAM REQUEST
            // =========================================

            const response =
                await fetch(

                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                apiKey,

                            "Accept":
                                "text/event-stream"

                        },

                        body:
                            JSON.stringify({

                                contents,

                                generationConfig: {

                                    thinkingConfig:
                                        {
                                            thinkingLevel:
                                                "minimal"
                                        },

                                    maxOutputTokens:
                                        500

                                }

                            })

                    }

                );

            // =========================================
            // API ERROR
            // =========================================

            if (
                !response.ok
            ) {

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

                if (
                    retryable
                ) {

                    console.log(
                        `Trying next Gemini streaming model after ${model}...`
                    );

                    continue;
                }

                throw lastError;
            }

            // =========================================
            // CHECK STREAM BODY
            // =========================================

            if (
                !response.body
            ) {

                throw new Error(
                    "Gemini streaming response has no body."
                );
            }

            console.log(
                `Gemini STREAM connected: ${model}`
            );

            // =========================================
            // CREATE STREAM READER
            // =========================================

            const reader =
                response
                    .body
                    .getReader();

            const decoder =
                new TextDecoder(
                    "utf-8"
                );

            let buffer = "";

            // =========================================
            // READ STREAM
            // =========================================

            while (
                true
            ) {

                const {
                    value,
                    done
                } =
                    await reader.read();

                if (
                    done
                ) {

                    break;
                }

                buffer +=
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );

                // =====================================
                // SSE EVENTS
                // =====================================

                const events =
                    buffer.split(
                        "\n\n"
                    );

                buffer =
                    events.pop() ||
                    "";

                // =====================================
                // PROCESS EVENTS
                // =====================================

                for (
                    const event
                    of events
                ) {

                    const lines =
                        event.split(
                            "\n"
                        );

                    for (
                        const line
                        of lines
                    ) {

                        const trimmed =
                            line.trim();

                        // Ignore empty lines
                        if (
                            !trimmed
                        ) {

                            continue;
                        }

                        // Ignore SSE comments
                        if (
                            trimmed.startsWith(
                                ":"
                            )
                        ) {

                            continue;
                        }

                        // Only process data lines
                        if (
                            !trimmed.startsWith(
                                "data:"
                            )
                        ) {

                            continue;
                        }

                        const jsonText =
                            trimmed
                                .substring(
                                    5
                                )
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
                                Array.isArray(
                                    parts
                                )
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

                        }

                        catch (
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

            // =========================================
            // FLUSH DECODER
            // =========================================

            buffer +=
                decoder.decode();

            // =========================================
            // PROCESS REMAINING BUFFER
            // =========================================

            const remaining =
                buffer.trim();

            if (
                remaining
            ) {

                const lines =
                    remaining.split(
                        "\n"
                    );

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
                            .substring(
                                5
                            )
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
                            Array.isArray(
                                parts
                            )
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

                    }

                    catch {
                        // Ignore incomplete final SSE data
                    }

                }

            }

            console.log(
                `Gemini STREAM completed: ${model}`
            );

            return;

        }

        // =========================================
        // STREAM EXCEPTION
        // =========================================

        catch (
            error
        ) {

            console.log(
                `Gemini STREAM exception for ${model}:`,
                error.message
            );

            lastError =
                error;

        }

    }

    // =================================================
    // ALL STREAMING MODELS FAILED
    // =================================================

    throw (
        lastError ||
        new Error(
            "AI streaming service is temporarily busy."
        )
    );
};

// =====================================================
// EXPORTS
// =====================================================

export {
    streamOpenAIAPIResponse
};

export default getOpenAIAPIResponse;