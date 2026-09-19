import "./Chat.css";
import React, {
    useContext,
    useState,
    useEffect
} from "react";

import { MyContext } from "./MyContext";

import ReactMarkdown from "react-markdown";

import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

function Chat() {

    const {
        newChat,
        prevChats,
        reply,
        markdownEnabled,
        codeHighlightEnabled
    } = useContext(MyContext);

    const [latestReply, setLatestReply] = useState(null);

    // =====================================
    // TYPING EFFECT
    // =====================================

    useEffect(() => {

        if (reply === null) {

            setLatestReply(null);

            return;
        }

        if (!prevChats?.length) {
            return;
        }

        const content = reply.split(" ");

        let idx = 0;

        const interval = setInterval(() => {

            setLatestReply(
                content
                    .slice(0, idx + 1)
                    .join(" ")
            );

            idx++;

            if (idx >= content.length) {
                clearInterval(interval);
            }

        }, 40);

        return () => {
            clearInterval(interval);
        };

    }, [prevChats, reply]);

    // =====================================
    // RENDER MESSAGE
    // =====================================

    const renderMessage = (content) => {

        // Markdown OFF
        if (!markdownEnabled) {

            return (
                <p className="plainMessage">
                    {content}
                </p>
            );
        }

        // Markdown + Code Highlighting
        if (codeHighlightEnabled) {

            return (
                <ReactMarkdown
                    rehypePlugins={[
                        rehypeHighlight
                    ]}
                >
                    {content}
                </ReactMarkdown>
            );
        }

        // Markdown WITHOUT code highlighting
        return (
            <ReactMarkdown>
                {content}
            </ReactMarkdown>
        );
    };

    return (
        <>

            {newChat && (
                <h1>
                    Start a New Chat!
                </h1>
            )}

            <div className="chats">

                {/* OLD MESSAGES */}

                {prevChats
                    ?.slice(0, -1)
                    .map((chat, idx) => (

                        <div
                            className={
                                chat.role === "user"
                                    ? "userDiv"
                                    : "gptDiv"
                            }
                            key={idx}
                        >

                            {chat.role === "user"
                                ? (
                                    <p className="userMessage">
                                        {chat.content}
                                    </p>
                                )
                                : (
                                    renderMessage(
                                        chat.content
                                    )
                                )
                            }

                        </div>

                    ))}

                {/* LATEST MESSAGE */}

                {prevChats.length > 0 && (

                    <>
                        {latestReply === null ? (

                            <div
                                className="gptDiv"
                                key="non-typing"
                            >

                                {renderMessage(
                                    prevChats[
                                        prevChats.length - 1
                                    ].content
                                )}

                            </div>

                        ) : (

                            <div
                                className="gptDiv"
                                key="typing"
                            >

                                {renderMessage(
                                    latestReply
                                )}

                            </div>

                        )}
                    </>

                )}

            </div>

        </>
    );
}

export default Chat;