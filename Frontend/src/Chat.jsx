import "./Chat.css";
import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const {
        newChat,
        prevChats,
        reply
    } = useContext(MyContext);

    const [latestReply, setLatestReply] = useState(null);

    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }

        if (!reply) {
            return;
        }

        const content = reply.split(" ");

        let idx = 0;

        setLatestReply("");

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
        }, 30);

        return () => clearInterval(interval);

    }, [reply]);

    if (newChat) {
        return (
            <div className="emptyChat">
                <h1>Start a New Chat!</h1>
            </div>
        );
    }

    return (
        <div className="chats">

            {prevChats?.map((chat, idx) => {

                const isLatestAssistant =
                    chat.role === "assistant" &&
                    idx === prevChats.length - 1 &&
                    reply !== null;

                const content =
                    isLatestAssistant && latestReply !== null
                        ? latestReply
                        : chat.content;

                return (
                    <div
                        className={
                            chat.role === "user"
                                ? "userDiv"
                                : "gptDiv"
                        }
                        key={`${idx}-${chat.role}`}
                    >

                        {chat.role === "user" ? (
                            <p className="userMessage">
                                {chat.content}
                            </p>
                        ) : (
                            <ReactMarkdown
                                rehypePlugins={[
                                    rehypeHighlight
                                ]}
                            >
                                {content}
                            </ReactMarkdown>
                        )}

                    </div>
                );
            })}

        </div>
    );
}

export default Chat;