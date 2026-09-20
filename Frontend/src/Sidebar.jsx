import "./Sidebar.css";
import { useContext, useEffect, useState } from "react";
import { API_URL } from "./config.js";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import sigmaLogo from "./assets/sigmagpt-icon.png";

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
    setSidebarOpen,
  } = useContext(MyContext);

  const [menuThreadId, setMenuThreadId] = useState(null);

  const [renameModal, setRenameModal] = useState(false);
  const [renameThreadId, setRenameThreadId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteThreadId, setDeleteThreadId] = useState(null);
  const [deleteThreadTitle, setDeleteThreadTitle] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // GET ALL THREADS
  // ==========================================

  const getAllThreads = async () => {
    try {
      const response = await fetch(`${API_URL}/api/thread`);

      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }

      const res = await response.json();

      const filteredData = res.map((thread) => ({
        threadId: thread.threadId,
        title: thread.title,
      }));

      setAllThreads(filteredData);
    } catch (err) {
      console.log("Failed to load threads:", err);
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  // ==========================================
  // CREATE NEW CHAT
  // ==========================================

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

  // ==========================================
  // CHANGE THREAD
  // ==========================================

  const changeThread = async (newThreadId) => {
    try {
      const response = await fetch(`${API_URL}/api/thread/${newThreadId}`);

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

  // ==========================================
  // OPEN DELETE MODAL
  // ==========================================

  const openDeleteModal = (threadId, title) => {
    setDeleteThreadId(threadId);

    setDeleteThreadTitle(title);

    setDeleteModal(true);

    setMenuThreadId(null);
  };

  // ==========================================
  // CLOSE DELETE MODAL
  // ==========================================

  const closeDeleteModal = () => {
    setDeleteModal(false);

    setDeleteThreadId(null);

    setDeleteThreadTitle("");
  };

  // ==========================================
  // DELETE THREAD
  // ==========================================

  const deleteThread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/thread/${deleteThreadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete thread");
      }

      setAllThreads((prev) =>
        prev.filter((thread) => thread.threadId !== deleteThreadId),
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

  // ==========================================
  // OPEN RENAME MODAL
  // ==========================================

  const openRenameModal = (threadId, currentTitle) => {
    setRenameThreadId(threadId);

    setRenameTitle(currentTitle);

    setRenameModal(true);

    setMenuThreadId(null);
  };

  // ==========================================
  // CLOSE RENAME MODAL
  // ==========================================

  const closeRenameModal = () => {
    setRenameModal(false);

    setRenameThreadId(null);

    setRenameTitle("");
  };

  // ==========================================
  // RENAME THREAD
  // ==========================================

  const renameThread = async () => {
    const newTitle = renameTitle.trim();

    if (!newTitle) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/thread/${renameThreadId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: newTitle,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.error || "Failed to rename thread");
      }

      setAllThreads((prev) =>
        prev.map((thread) =>
          thread.threadId === renameThreadId
            ? {
                ...thread,
                title: newTitle,
              }
            : thread,
        ),
      );

      closeRenameModal();
    } catch (err) {
      console.log("Failed to rename thread:", err);
    }
  };

  // ==========================================
  // TOGGLE THREAD MENU
  // ==========================================

  const toggleMenu = (e, threadId) => {
    e.stopPropagation();

    setMenuThreadId((prev) => (prev === threadId ? null : threadId));
  };

  // ==========================================
  // RENAME KEYBOARD
  // ==========================================

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      renameThread();
    }

    if (e.key === "Escape") {
      closeRenameModal();
    }
  };

  // ==========================================
  // DELETE KEYBOARD
  // ==========================================

  const handleDeleteKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDeleteModal();
    }

    if (e.key === "Enter") {
      deleteThread();
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredThreads = allThreads?.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <section className={`sidebar ${sidebarOpen ? "sidebarOpen" : ""}`}>
        {/* =================================
                    SIGMAGPT BRAND + NEW CHAT
                ================================= */}

        <button className="newChatButton" onClick={createNewChat}>
          <div className="sidebarBrand">
            <img src={sigmaLogo} alt="SigmaGPT" className="sidebarBrandLogo" />

            <span className="sidebarBrandName">SigmaGPT</span>
          </div>

          <span className="newChatIcon">
            <i className="fa-solid fa-pen-to-square"></i>
          </span>
        </button>

        {/* =================================
                    SEARCH
                ================================= */}

        <div className="searchBox">
          <i className="fa-solid fa-magnifying-glass"></i>

          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <button className="clearSearch" onClick={() => setSearchQuery("")}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* =================================
                    RECENT CHATS
                ================================= */}

        <div className="historyHeader">
          <span>Recent Chats</span>

          {searchQuery && (
            <span className="searchCount">{filteredThreads.length}</span>
          )}
        </div>

        {/* =================================
                    CHAT HISTORY
                ================================= */}

        <ul className="history">
          {filteredThreads?.length > 0 ? (
            filteredThreads.map((thread) => (
              <li
                key={thread.threadId}
                onClick={() => changeThread(thread.threadId)}
                className={
                  thread.threadId === currThreadId ? "highlighted" : ""
                }
              >
                <span className="threadTitle">{thread.title}</span>

                {/* THREE DOTS */}

                <button
                  className="threadMenuButton"
                  onClick={(e) => toggleMenu(e, thread.threadId)}
                >
                  <i className="fa-solid fa-ellipsis"></i>
                </button>

                {/* THREAD MENU */}

                {menuThreadId === thread.threadId && (
                  <div
                    className="threadMenu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* RENAME */}

                    <button
                      className="threadMenuItem"
                      onClick={() =>
                        openRenameModal(thread.threadId, thread.title)
                      }
                    >
                      <i className="fa-solid fa-pen"></i>

                      <span>Rename</span>
                    </button>

                    {/* DELETE */}

                    <button
                      className="threadMenuItem deleteItem"
                      onClick={() =>
                        openDeleteModal(thread.threadId, thread.title)
                      }
                    >
                      <i className="fa-solid fa-trash"></i>

                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </li>
            ))
          ) : (
            <div className="noSearchResults">
              <i className="fa-solid fa-magnifying-glass"></i>

              <p>No chats found</p>

              {searchQuery && <span>No results for "{searchQuery}"</span>}
            </div>
          )}
        </ul>

        {/* =================================
    SIDEBAR FOOTER
================================= */}

        <div className="sidebarFooter">
          <div className="sidebarFooterLine"></div>

          <div className="sidebarFooterText">
            <span>AI</span>
            <b>•</b>
            <span>Think</span>
            <b>•</b>
            <span>Ask</span>
            <b>•</b>
            <span>Create</span>
          </div>

          <div className="sidebarFooterSubtext">Your AI workspace</div>
        </div>
      </section>

      {/* ==========================================
                RENAME MODAL
            ========================================== */}

      {renameModal && (
        <div className="renameModalOverlay" onClick={closeRenameModal}>
          <div className="renameModal" onClick={(e) => e.stopPropagation()}>
            <div className="renameModalHeader">
              <div>
                <h2>Rename chat</h2>

                <p>Give this conversation a new name.</p>
              </div>

              <button className="closeModalButton" onClick={closeRenameModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="renameInputWrapper">
              <label>Chat name</label>

              <input
                autoFocus
                type="text"
                value={renameTitle}
                maxLength={60}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                placeholder="Enter chat name"
              />

              <span className="characterCount">
                {renameTitle.length}
                /60
              </span>
            </div>

            <div className="renameModalActions">
              <button className="cancelRenameButton" onClick={closeRenameModal}>
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

      {/* ==========================================
                DELETE MODAL
            ========================================== */}

      {deleteModal && (
        <div
          className="deleteModalOverlay"
          onClick={closeDeleteModal}
          onKeyDown={handleDeleteKeyDown}
        >
          <div className="deleteModal" onClick={(e) => e.stopPropagation()}>
            <div className="deleteIconWrapper">
              <i className="fa-solid fa-trash"></i>
            </div>

            <div className="deleteModalContent">
              <h2>Delete chat?</h2>

              <p>This conversation will be permanently deleted.</p>

              <div className="deleteChatName">"{deleteThreadTitle}"</div>
            </div>

            <div className="deleteModalActions">
              <button className="cancelDeleteButton" onClick={closeDeleteModal}>
                Cancel
              </button>

              <button className="confirmDeleteButton" onClick={deleteThread}>
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
