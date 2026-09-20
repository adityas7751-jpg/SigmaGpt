import { createContext } from "react";

export const MyContext = createContext({
    // =========================
    // AUTH
    // =========================

    user: null,
    setUser: () => {},

    // =========================
    // CHAT
    // =========================

    prompt: "",
    setPrompt: () => {},

    reply: null,
    setReply: () => {},

    currThreadId: "",
    setCurrThreadId: () => {},

    newChat: true,
    setNewChat: () => {},

    prevChats: [],
    setPrevChats: () => {},

    allThreads: [],
    setAllThreads: () => {},

    // =========================
    // SIDEBAR
    // =========================

    sidebarOpen: false,
    setSidebarOpen: () => {},

    // =========================
    // THEME
    // =========================

    theme: "dark",
    setTheme: () => {},

    activeTheme: "dark",

    // =========================
    // CHAT PREFERENCES
    // =========================

    enterToSend: true,
    setEnterToSend: () => {},

    markdownEnabled: true,
    setMarkdownEnabled: () => {},

    codeHighlightEnabled: true,
    setCodeHighlightEnabled: () => {}
});