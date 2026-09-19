import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats
    } = useContext(MyContext);

    const getAllThreads = async () => {
        try {
            const response = await fetch(
                "http://localhost:8080/api/thread"
            );

            if (!response.ok) {
                throw new Error("Failed to fetch threads");
            }

            const res = await response.json();

            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title
            }));

            setAllThreads(filteredData);
        } catch (err) {
            console.log("Failed to load threads:", err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        try {
            const response = await fetch(
                `http://localhost:8080/api/thread/${newThreadId}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch thread");
            }

            const res = await response.json();

            setCurrThreadId(newThreadId);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
            setPrompt("");
        } catch (err) {
            console.log("Failed to load chat:", err);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(
                `http://localhost:8080/api/thread/${threadId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete thread");
            }

            setAllThreads((prev) =>
                prev.filter(
                    (thread) => thread.threadId !== threadId
                )
            );

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.log("Failed to delete thread:", err);
        }
    };

    return (
        <section className="sidebar">

            <button onClick={createNewChat}>
                <img
                    src="/src/assets/blacklogo.png"
                    alt="SigmaGPT logo"
                    className="logo"
                />

                <span>
                    <i className="fa-solid fa-pen-to-square"></i>
                </span>
            </button>

            <ul className="history">
                {allThreads?.map((thread) => (
                    <li
                        key={thread.threadId}
                        onClick={() =>
                            changeThread(thread.threadId)
                        }
                        className={
                            thread.threadId === currThreadId
                                ? "highlighted"
                                : ""
                        }
                    >
                        <span className="threadTitle">
                            {thread.title}
                        </span>

                        <i
                            className="fa-solid fa-trash"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                        ></i>
                    </li>
                ))}
            </ul>

            <div className="sign">
                <p>By ApnaCollege &hearts;</p>
            </div>

        </section>
    );
}

export default Sidebar;