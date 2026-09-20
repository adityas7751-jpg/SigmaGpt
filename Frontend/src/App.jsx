import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Auth from "./Auth.jsx";
import { API_URL } from "./config.js";

import { MyContext } from "./MyContext.jsx";
import { useEffect, useState } from "react";
import { v1 as uuidv1 } from "uuid";

function App() {

    // =========================
    // AUTH
    // =========================

    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {

        const token = localStorage.getItem("sigmagpt-token");

        if (!token) {
            setAuthLoading(false);
            return;
        }

        const checkUser = async () => {

            try {

                const response = await fetch(
                    `${API_URL}/api/auth/me`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error("Invalid session");
                }

                setUser(data.user);

                localStorage.setItem(
                    "sigmagpt-user",
                    JSON.stringify(data.user)
                );

            } catch (error) {

                console.log("Session expired.");

                localStorage.removeItem("sigmagpt-token");
                localStorage.removeItem("sigmagpt-user");

                setUser(null);

            } finally {

                setAuthLoading(false);

            }
        };

        checkUser();

    }, []);


    // =========================
    // CHAT STATES
    // =========================

    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);

    const [currThreadId, setCurrThreadId] = useState(uuidv1());

    const [prevChats, setPrevChats] = useState([]);

    const [newChat, setNewChat] = useState(true);

    const [allThreads, setAllThreads] = useState([]);


    // =========================
    // SIDEBAR
    // =========================

    const [sidebarOpen, setSidebarOpen] = useState(false);


    // =========================
    // THEME
    // =========================

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("sigmagpt-theme") || "dark";
    });

    const [systemTheme, setSystemTheme] = useState(() => {

        if (window.matchMedia) {

            return window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";

        }

        return "dark";

    });


    // =========================
    // CHAT PREFERENCES
    // =========================

    const [enterToSend, setEnterToSend] = useState(() => {

        const saved =
            localStorage.getItem("sigmagpt-enter-to-send");

        return saved === null
            ? true
            : saved === "true";

    });


    const [markdownEnabled, setMarkdownEnabled] = useState(() => {

        const saved =
            localStorage.getItem("sigmagpt-markdown");

        return saved === null
            ? true
            : saved === "true";

    });


    const [codeHighlightEnabled, setCodeHighlightEnabled] = useState(() => {

        const saved =
            localStorage.getItem("sigmagpt-code-highlight");

        return saved === null
            ? true
            : saved === "true";

    });


    // =========================
    // THEME STORAGE
    // =========================

    useEffect(() => {

        localStorage.setItem(
            "sigmagpt-theme",
            theme
        );

    }, [theme]);


    // =========================
    // SYSTEM THEME
    // =========================

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


    // =========================
    // ENTER TO SEND
    // =========================

    useEffect(() => {

        localStorage.setItem(
            "sigmagpt-enter-to-send",
            enterToSend
        );

    }, [enterToSend]);


    // =========================
    // MARKDOWN
    // =========================

    useEffect(() => {

        localStorage.setItem(
            "sigmagpt-markdown",
            markdownEnabled
        );

    }, [markdownEnabled]);


    // =========================
    // CODE HIGHLIGHT
    // =========================

    useEffect(() => {

        localStorage.setItem(
            "sigmagpt-code-highlight",
            codeHighlightEnabled
        );

    }, [codeHighlightEnabled]);


    // =========================
    // ACTIVE THEME
    // =========================

    const activeTheme =
        theme === "system"
            ? systemTheme
            : theme;


    useEffect(() => {

        document.body.classList.remove(
            "darkTheme",
            "lightTheme"
        );

        document.body.classList.add(
            `${activeTheme}Theme`
        );

    }, [activeTheme]);


    // =========================
    // AUTH LOADING SCREEN
    // =========================

    if (authLoading) {

        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#171717",
                    color: "#aaa",
                    fontFamily: "Arial, sans-serif"
                }}
            >
                Checking session...
            </div>
        );

    }


    // =========================
    // NOT LOGGED IN
    // =========================

    if (!user) {

        return (
            <Auth
                onLogin={(loggedInUser) => {
                    setUser(loggedInUser);
                }}
            />
        );

    }


    // =========================
    // CONTEXT
    // =========================

    const providerValues = {

        // Auth
        user,
        setUser,

        // Chat
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

        // Sidebar
        sidebarOpen,
        setSidebarOpen,

        // Theme
        theme,
        setTheme,

        activeTheme,

        // Preferences
        enterToSend,
        setEnterToSend,

        markdownEnabled,
        setMarkdownEnabled,

        codeHighlightEnabled,
        setCodeHighlightEnabled

    };


    // =========================
    // MAIN DASHBOARD
    // =========================

    return (

        <div
            className={`app ${activeTheme}Theme`}
        >

            <MyContext.Provider
                value={providerValues}
            >

                <Sidebar />

                <ChatWindow />

            </MyContext.Provider>

        </div>

    );

}

export default App;