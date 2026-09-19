import "./Sidebar.css";
import { useContext, useEffect, useState } from "react";
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
        setPrevChats,
        sidebarOpen,
        setSidebarOpen
    } = useContext(MyContext);

    const [menuThreadId, setMenuThreadId] = useState(null);

    const [renameModal, setRenameModal] = useState(false);
    const [renameThreadId, setRenameThreadId] = useState(null);
    const [renameTitle, setRenameTitle] = useState("");

    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteThreadId, setDeleteThreadId] = useState(null);
    const [deleteThreadTitle, setDeleteThreadTitle] = useState("");

    // Search
    const [searchQuery, setSearchQuery] = useState("");


    // =========================
    // Get All Threads
    // =========================

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


    // =========================
    // Create New Chat
    // =========================

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);

        setMenuThreadId(null);
        setSearchQuery("");
        setSidebarOpen(false);
    };


    // =========================
    // Change Thread
    // =========================

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

            setMenuThreadId(null);
            setSidebarOpen(false);

        } catch (err) {
            console.log("Failed to load chat:", err);
        }
    };


    // =========================
    // Open Delete Modal
    // =========================

    const openDeleteModal = (threadId, title) => {
        setDeleteThreadId(threadId);
        setDeleteThreadTitle(title);
        setDeleteModal(true);
        setMenuThreadId(null);
    };


    // =========================
    // Close Delete Modal
    // =========================

    const closeDeleteModal = () => {
        setDeleteModal(false);
        setDeleteThreadId(null);
        setDeleteThreadTitle("");
    };


    // =========================
    // Delete Thread
    // =========================

    const deleteThread = async () => {
        try {
            const response = await fetch(
                `http://localhost:8080/api/thread/${deleteThreadId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete thread");
            }

            setAllThreads((prev) =>
                prev.filter(
                    (thread) =>
                        thread.threadId !== deleteThreadId
                )
            );

            const deletedId = deleteThreadId;

            closeDeleteModal();

            if (deletedId === currThreadId) {
                setNewChat(true);
                setPrompt("");
                setReply(null);
                setCurrThreadId(uuidv1());
                setPrevChats([]);
            }

        } catch (err) {
            console.log("Failed to delete thread:", err);
        }
    };


    // =========================
    // Open Rename Modal
    // =========================

    const openRenameModal = (threadId, currentTitle) => {
        setRenameThreadId(threadId);
        setRenameTitle(currentTitle);
        setRenameModal(true);
        setMenuThreadId(null);
    };


    // =========================
    // Close Rename Modal
    // =========================

    const closeRenameModal = () => {
        setRenameModal(false);
        setRenameThreadId(null);
        setRenameTitle("");
    };


    // =========================
    // Rename Thread
    // =========================

    const renameThread = async () => {
        const newTitle = renameTitle.trim();

        if (!newTitle) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:8080/api/thread/${renameThreadId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: newTitle
                    })
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(
                    res.error || "Failed to rename thread"
                );
            }

            setAllThreads((prev) =>
                prev.map((thread) =>
                    thread.threadId === renameThreadId
                        ? {
                              ...thread,
                              title: newTitle
                          }
                        : thread
                )
            );

            closeRenameModal();

        } catch (err) {
            console.log("Failed to rename thread:", err);
        }
    };


    // =========================
    // Toggle Menu
    // =========================

    const toggleMenu = (e, threadId) => {
        e.stopPropagation();

        setMenuThreadId((prev) =>
            prev === threadId
                ? null
                : threadId
        );
    };


    // =========================
    // Rename Keyboard
    // =========================

    const handleRenameKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            renameThread();
        }

        if (e.key === "Escape") {
            closeRenameModal();
        }
    };


    // =========================
    // Delete Keyboard
    // =========================

    const handleDeleteKeyDown = (e) => {
        if (e.key === "Escape") {
            closeDeleteModal();
        }

        if (e.key === "Enter") {
            deleteThread();
        }
    };


    // =========================
    // Search Threads
    // =========================

    const filteredThreads = allThreads?.filter((thread) =>
        thread.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase().trim())
    );


    return (
        <>
            <section
                className={`sidebar ${
                    sidebarOpen ? "sidebarOpen" : ""
                }`}
            >

                {/* New Chat */}

                <button
                    className="newChatButton"
                    onClick={createNewChat}
                >
                    <img
                        src="/src/assets/blacklogo.png"
                        alt="SigmaGPT logo"
                        className="logo"
                    />

                    <span>
                        <i className="fa-solid fa-pen-to-square"></i>
                    </span>
                </button>


                {/* =========================
                    SEARCH
                ========================= */}

                <div className="searchBox">

                    <i className="fa-solid fa-magnifying-glass"></i>

                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) =>
                            setSearchQuery(e.target.value)
                        }
                    />

                    {searchQuery && (
                        <button
                            className="clearSearch"
                            onClick={() =>
                                setSearchQuery("")
                            }
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}

                </div>


                {/* Recent Chats */}

                <div className="historyHeader">
                    <span>Recent Chats</span>

                    {searchQuery && (
                        <span className="searchCount">
                            {filteredThreads.length}
                        </span>
                    )}
                </div>


                {/* Chat History */}

                <ul className="history">

                    {filteredThreads?.length > 0 ? (

                        filteredThreads.map((thread) => (

                            <li
                                key={thread.threadId}
                                onClick={() =>
                                    changeThread(
                                        thread.threadId
                                    )
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


                                {/* Three Dots */}

                                <button
                                    className="threadMenuButton"
                                    onClick={(e) =>
                                        toggleMenu(
                                            e,
                                            thread.threadId
                                        )
                                    }
                                >
                                    <i className="fa-solid fa-ellipsis"></i>
                                </button>


                                {/* Thread Menu */}

                                {menuThreadId ===
                                    thread.threadId && (

                                    <div
                                        className="threadMenu"
                                        onClick={(e) =>
                                            e.stopPropagation()
                                        }
                                    >

                                        <button
                                            className="threadMenuItem"
                                            onClick={() =>
                                                openRenameModal(
                                                    thread.threadId,
                                                    thread.title
                                                )
                                            }
                                        >
                                            <i className="fa-solid fa-pen"></i>

                                            <span>
                                                Rename
                                            </span>
                                        </button>


                                        <button
                                            className="threadMenuItem deleteItem"
                                            onClick={() =>
                                                openDeleteModal(
                                                    thread.threadId,
                                                    thread.title
                                                )
                                            }
                                        >
                                            <i className="fa-solid fa-trash"></i>

                                            <span>
                                                Delete
                                            </span>
                                        </button>

                                    </div>
                                )}

                            </li>
                        ))

                    ) : (

                        <div className="noSearchResults">

                            <i className="fa-solid fa-magnifying-glass"></i>

                            <p>
                                No chats found
                            </p>

                            {searchQuery && (
                                <span>
                                    No results for "{searchQuery}"
                                </span>
                            )}

                        </div>

                    )}

                </ul>


                {/* Bottom */}

                <div className="sign">
                    <p>
                        By ApnaCollege &hearts;
                    </p>
                </div>

            </section>


            {/* =========================
                RENAME MODAL
            ========================= */}

            {renameModal && (

                <div
                    className="renameModalOverlay"
                    onClick={closeRenameModal}
                >

                    <div
                        className="renameModal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="renameModalHeader">

                            <div>
                                <h2>Rename chat</h2>

                                <p>
                                    Give this conversation a new name.
                                </p>
                            </div>

                            <button
                                className="closeModalButton"
                                onClick={closeRenameModal}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>

                        </div>


                        <div className="renameInputWrapper">

                            <label>
                                Chat name
                            </label>

                            <input
                                autoFocus
                                type="text"
                                value={renameTitle}
                                maxLength={60}
                                onChange={(e) =>
                                    setRenameTitle(
                                        e.target.value
                                    )
                                }
                                onKeyDown={handleRenameKeyDown}
                                placeholder="Enter chat name"
                            />

                            <span className="characterCount">
                                {renameTitle.length}/60
                            </span>

                        </div>


                        <div className="renameModalActions">

                            <button
                                className="cancelRenameButton"
                                onClick={closeRenameModal}
                            >
                                Cancel
                            </button>

                            <button
                                className="saveRenameButton"
                                onClick={renameThread}
                                disabled={!renameTitle.trim()}
                            >
                                <i className="fa-solid fa-check"></i>
                                Rename
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =========================
                DELETE MODAL
            ========================= */}

            {deleteModal && (

                <div
                    className="deleteModalOverlay"
                    onClick={closeDeleteModal}
                    onKeyDown={handleDeleteKeyDown}
                >

                    <div
                        className="deleteModal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="deleteIconWrapper">
                            <i className="fa-solid fa-trash"></i>
                        </div>


                        <div className="deleteModalContent">

                            <h2>
                                Delete chat?
                            </h2>

                            <p>
                                This conversation will be
                                permanently deleted.
                            </p>

                            <div className="deleteChatName">
                                "{deleteThreadTitle}"
                            </div>

                        </div>


                        <div className="deleteModalActions">

                            <button
                                className="cancelDeleteButton"
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirmDeleteButton"
                                onClick={deleteThread}
                            >
                                <i className="fa-solid fa-trash"></i>
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </>
    );
}

export default Sidebar;