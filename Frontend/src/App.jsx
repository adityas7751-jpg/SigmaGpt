import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useEffect, useState } from "react";
import { v1 as uuidv1 } from "uuid";

function App() {

    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);

    const [currThreadId, setCurrThreadId] = useState(uuidv1());

    const [prevChats, setPrevChats] = useState([]);

    const [newChat, setNewChat] = useState(true);

    const [allThreads, setAllThreads] = useState([]);

    // Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Theme
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("sigmagpt-theme") || "dark";
    });

    const [systemTheme, setSystemTheme] = useState(() => {
        if (window.matchMedia) {
            return window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches ? "dark" : "light";
        }

        return "dark";
    });

    // =====================================
    // CHAT PREFERENCES
    // =====================================

    const [enterToSend, setEnterToSend] = useState(() => {
        const saved = localStorage.getItem("sigmagpt-enter-to-send");

        return saved === null
            ? true
            : saved === "true";
    });

    const [markdownEnabled, setMarkdownEnabled] = useState(() => {
        const saved = localStorage.getItem("sigmagpt-markdown");

        return saved === null
            ? true
            : saved === "true";
    });

    const [codeHighlightEnabled, setCodeHighlightEnabled] = useState(() => {
        const saved = localStorage.getItem(
            "sigmagpt-code-highlight"
        );

        return saved === null
            ? true
            : saved === "true";
    });

    // =====================================
    // SAVE THEME
    // =====================================

    useEffect(() => {
        localStorage.setItem(
            "sigmagpt-theme",
            theme
        );
    }, [theme]);

    // =====================================
    // SYSTEM THEME
    // =====================================

    useEffect(() => {

        const mediaQuery = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

        const handleSystemThemeChange = (event) => {
            setSystemTheme(
                event.matches
                    ? "dark"
                    : "light"
            );
        };

        setSystemTheme(
            mediaQuery.matches
                ? "dark"
                : "light"
        );

        mediaQuery.addEventListener(
            "change",
            handleSystemThemeChange
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handleSystemThemeChange
            );
        };

    }, []);

    // =====================================
    // SAVE CHAT PREFERENCES
    // =====================================

    useEffect(() => {
        localStorage.setItem(
            "sigmagpt-enter-to-send",
            enterToSend
        );
    }, [enterToSend]);

    useEffect(() => {
        localStorage.setItem(
            "sigmagpt-markdown",
            markdownEnabled
        );
    }, [markdownEnabled]);

    useEffect(() => {
        localStorage.setItem(
            "sigmagpt-code-highlight",
            codeHighlightEnabled
        );
    }, [codeHighlightEnabled]);

    // =====================================
    // ACTIVE THEME
    // =====================================

    const activeTheme =
        theme === "system"
            ? systemTheme
            : theme;

    // =====================================
    // APPLY THEME
    // =====================================

    useEffect(() => {

        document.body.classList.remove(
            "darkTheme",
            "lightTheme"
        );

        document.body.classList.add(
            `${activeTheme}Theme`
        );

    }, [activeTheme]);

    // =====================================
    // CONTEXT
    // =====================================

    const providerValues = {

        prompt,
        setPrompt,

        reply,
        setReply,

        currThreadId,
        setCurrThreadId,

        newChat,
        setNewChat,

        prevChats,
        setPrevChats,

        allThreads,
        setAllThreads,

        sidebarOpen,
        setSidebarOpen,

        theme,
        setTheme,

        activeTheme,

        // Chat Preferences
        enterToSend,
        setEnterToSend,

        markdownEnabled,
        setMarkdownEnabled,

        codeHighlightEnabled,
        setCodeHighlightEnabled
    };

    return (
        <div className={`app ${activeTheme}Theme`}>

            <MyContext.Provider value={providerValues}>

                <Sidebar />

                <ChatWindow />

            </MyContext.Provider>

        </div>
    );
}

export default App;