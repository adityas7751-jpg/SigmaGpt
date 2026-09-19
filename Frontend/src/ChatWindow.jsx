import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getReply = async () => {
        const trimmedPrompt = prompt.trim();

        if (!trimmedPrompt || loading) {
            return;
        }

        setLoading(true);
        setNewChat(false);

        try {
            const response = await fetch(
                "http://localhost:8080/api/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: trimmedPrompt,
                        threadId: currThreadId
                    })
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(
                    res.error || "Failed to get response"
                );
            }

            // Add user and AI messages to frontend chat
            setPrevChats((prev) => [
                ...prev,
                {
                    role: "user",
                    content: trimmedPrompt
                },
                {
                    role: "assistant",
                    content: res.reply
                }
            ]);

            setReply(res.reply);
            setPrompt("");

        } catch (err) {
            console.log("Chat error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            getReply();
        }
    };

    const handleProfileClick = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="chatWindow">

            <div className="navbar">
                <span>
                    SigmaGPT{" "}
                    <i className="fa-solid fa-chevron-down"></i>
                </span>

                <div
                    className="userIconDiv"
                    onClick={handleProfileClick}
                >
                    <span className="userIcon">
                        <i className="fa-solid fa-user"></i>
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="dropDown">

                    <div className="dropDownItem">
                        <i className="fa-solid fa-gear"></i>
                        Settings
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        Upgrade plan
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        Log out
                    </div>

                </div>
            )}

            <Chat />

            <div className="loader">
                <ScaleLoader
                    color="#ffffff"
                    loading={loading}
                    height={20}
                />
            </div>

            <div className="chatInput">

                <div className="inputBox">

                    <input
                        placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) =>
                            setPrompt(e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />

                    <div
                        id="submit"
                        onClick={getReply}
                        className={
                            loading
                                ? "disabledSubmit"
                                : ""
                        }
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>

                </div>

                <p className="info">
                    SigmaGPT can make mistakes. Check important
                    info. See Cookie Preferences.
                </p>

            </div>

        </div>
    );
}

export default ChatWindow;