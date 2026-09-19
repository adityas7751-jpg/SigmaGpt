import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {

    const {
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadId,
        setNewChat,
        sidebarOpen,
        setSidebarOpen,
        theme,
        setTheme,
        activeTheme,

        enterToSend,
        setEnterToSend,

        markdownEnabled,
        setMarkdownEnabled,

        codeHighlightEnabled,
        setCodeHighlightEnabled
    } = useContext(MyContext);


    const [loading, setLoading] = useState(false);

    const [profileOpen, setProfileOpen] = useState(false);

    const [appearanceOpen, setAppearanceOpen] = useState(false);

    const [settingsOpen, setSettingsOpen] = useState(false);

    const [chatPreferencesOpen, setChatPreferencesOpen] =
        useState(false);

    const [aboutOpen, setAboutOpen] = useState(false);

    const [premiumOpen, setPremiumOpen] = useState(false);

    // Premium plan selection
    const [selectedPlan, setSelectedPlan] = useState("free");


    // =====================================
    // GET AI REPLY
    // =====================================

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

            setReply(res.reply);

        } catch (err) {

            console.log("Chat error:", err);

        } finally {

            setLoading(false);

        }
    };


    // =====================================
    // CLEAR INPUT
    // =====================================

    useEffect(() => {

        if (reply) {
            setPrompt("");
        }

    }, [reply, setPrompt]);


    // =====================================
    // PROFILE
    // =====================================

    const handleProfileClick = () => {

        setProfileOpen((prev) => !prev);

        setAppearanceOpen(false);

    };


    const closeProfile = () => {

        setProfileOpen(false);
        setAppearanceOpen(false);

    };


    // =====================================
    // SETTINGS
    // =====================================

    const openSettings = () => {

        setSettingsOpen(true);

        setProfileOpen(false);

        setAppearanceOpen(false);

    };


    const closeSettings = () => {

        setSettingsOpen(false);

        setChatPreferencesOpen(false);

        setAboutOpen(false);

    };


    // =====================================
    // CHAT PREFERENCES
    // =====================================

    const openChatPreferences = () => {

        setSettingsOpen(false);

        setChatPreferencesOpen(true);

    };


    const closeChatPreferences = () => {

        setChatPreferencesOpen(false);

    };


    // =====================================
    // ABOUT
    // =====================================

    const openAbout = () => {

        setSettingsOpen(false);

        setAboutOpen(true);

    };


    const closeAbout = () => {

        setAboutOpen(false);

    };


    // =====================================
    // PREMIUM
    // =====================================

    const openPremium = () => {

        setPremiumOpen(true);

        setProfileOpen(false);

        setAppearanceOpen(false);

    };


    const closePremium = () => {

        setPremiumOpen(false);

    };


    // =====================================
    // APPEARANCE
    // =====================================

    const handleAppearance = () => {

        setAppearanceOpen((prev) => !prev);

    };


    const changeTheme = (selectedTheme) => {

        setTheme(selectedTheme);

        setAppearanceOpen(false);

    };


    // =====================================
    // APPEARANCE FROM SETTINGS
    // =====================================

    const openAppearanceFromSettings = () => {

        setSettingsOpen(false);

        setProfileOpen(true);

        setAppearanceOpen(true);

    };


    // =====================================
    // MOBILE SIDEBAR
    // =====================================

    const openSidebar = () => {

        setSidebarOpen(true);

        setProfileOpen(false);

    };


    return (

        <div className="chatWindow">


            {/* =====================================
                MOBILE OVERLAY
            ===================================== */}

            {sidebarOpen && (

                <div
                    className="sidebarOverlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>

            )}


            {/* =====================================
                NAVBAR
            ===================================== */}

            <div className="navbar">

                <div className="navbarLeft">

                    <button
                        className="mobileMenuButton"
                        onClick={openSidebar}
                    >

                        <i className="fa-solid fa-bars"></i>

                    </button>


                    <span className="brandName">

                        SigmaGPT

                        <i className="fa-solid fa-chevron-down"></i>

                    </span>

                </div>


                <div
                    className="userIconDiv"
                    onClick={handleProfileClick}
                >

                    <span className="userIcon">

                        <i className="fa-solid fa-user"></i>

                    </span>

                </div>

            </div>


            {/* =====================================
                PROFILE PANEL
            ===================================== */}

            {profileOpen && (

                <>

                    <div
                        className="profileOutside"
                        onClick={closeProfile}
                    ></div>


                    <div className="profilePanel">


                        {/* ACCOUNT */}

                        <div className="profileHeader">

                            <div className="profileAvatar">

                                <i className="fa-solid fa-user"></i>

                            </div>


                            <div className="profileInfo">

                                <h3>
                                    Aditya Sharma
                                </h3>

                                <span>
                                    Free Plan
                                </span>

                            </div>

                        </div>


                        <div className="profileDivider"></div>


                        {/* SETTINGS */}

                        <button
                            className="profileItem"
                            onClick={openSettings}
                        >

                            <div className="profileItemIcon">

                                <i className="fa-solid fa-gear"></i>

                            </div>


                            <div className="profileItemText">

                                <strong>
                                    Settings
                                </strong>

                                <span>
                                    Manage your preferences
                                </span>

                            </div>


                            <i className="fa-solid fa-chevron-right profileArrow"></i>

                        </button>


                        {/* PREMIUM */}

                        <button
                            className="profileItem premiumItem"
                            onClick={openPremium}
                        >

                            <div className="profileItemIcon premiumIcon">

                                <i className="fa-solid fa-sparkles"></i>

                            </div>


                            <div className="profileItemText">

                                <strong>
                                    Upgrade to Premium
                                </strong>

                                <span>
                                    Unlock more AI features
                                </span>

                            </div>


                            <i className="fa-solid fa-chevron-right profileArrow"></i>

                        </button>


                        {/* APPEARANCE */}

                        <button
                            className="profileItem"
                            onClick={handleAppearance}
                        >

                            <div className="profileItemIcon">

                                <i className="fa-solid fa-moon"></i>

                            </div>


                            <div className="profileItemText">

                                <strong>
                                    Appearance
                                </strong>

                                <span>

                                    {theme === "dark"
                                        ? "Dark mode"
                                        : theme === "light"
                                            ? "Light mode"
                                            : "System mode"}

                                </span>

                            </div>


                            <i
                                className={`fa-solid ${
                                    appearanceOpen
                                        ? "fa-chevron-down"
                                        : "fa-chevron-right"
                                } profileArrow`}
                            ></i>

                        </button>


                        {/* THEME OPTIONS */}

                        {appearanceOpen && (

                            <div className="appearanceOptions">


                                {/* DARK */}

                                <button
                                    className={`themeOption ${
                                        theme === "dark"
                                            ? "activeTheme"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        changeTheme("dark")
                                    }
                                >

                                    <div className="themeIcon">

                                        <i className="fa-solid fa-moon"></i>

                                    </div>

                                    <span>
                                        Dark
                                    </span>

                                    {theme === "dark" && (

                                        <i className="fa-solid fa-check"></i>

                                    )}

                                </button>


                                {/* LIGHT */}

                                <button
                                    className={`themeOption ${
                                        theme === "light"
                                            ? "activeTheme"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        changeTheme("light")
                                    }
                                >

                                    <div className="themeIcon">

                                        <i className="fa-solid fa-sun"></i>

                                    </div>

                                    <span>
                                        Light
                                    </span>

                                    {theme === "light" && (

                                        <i className="fa-solid fa-check"></i>

                                    )}

                                </button>


                                {/* SYSTEM */}

                                <button
                                    className={`themeOption ${
                                        theme === "system"
                                            ? "activeTheme"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        changeTheme("system")
                                    }
                                >

                                    <div className="themeIcon">

                                        <i className="fa-solid fa-desktop"></i>

                                    </div>

                                    <span>
                                        System
                                    </span>

                                    {theme === "system" && (

                                        <i className="fa-solid fa-check"></i>

                                    )}

                                </button>

                            </div>

                        )}


                        <div className="profileDivider"></div>


                        {/* LOGOUT */}

                        <button className="profileItem logoutItem">

                            <div className="profileItemIcon">

                                <i className="fa-solid fa-arrow-right-from-bracket"></i>

                            </div>


                            <div className="profileItemText">

                                <strong>
                                    Log out
                                </strong>

                                <span>
                                    Sign out of SigmaGPT
                                </span>

                            </div>

                        </button>

                    </div>

                </>

            )}


            {/* =====================================
                SETTINGS MODAL
            ===================================== */}

            {settingsOpen && (

                <div
                    className="settingsOverlay"
                    onClick={closeSettings}
                >

                    <div
                        className="settingsModal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="settingsHeader">

                            <div>

                                <h2>
                                    Settings
                                </h2>

                                <p>
                                    Manage your SigmaGPT preferences
                                </p>

                            </div>


                            <button
                                className="settingsClose"
                                onClick={closeSettings}
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>


                        <div className="settingsBody">


                            {/* ACCOUNT */}

                            <div className="settingsSection">

                                <h3>
                                    Account
                                </h3>


                                <div className="settingsCard">

                                    <div className="settingsAvatar">

                                        <i className="fa-solid fa-user"></i>

                                    </div>


                                    <div className="settingsUserInfo">

                                        <strong>
                                            Aditya Sharma
                                        </strong>

                                        <span>
                                            Free Plan
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* PREFERENCES */}

                            <div className="settingsSection">

                                <h3>
                                    Preferences
                                </h3>


                                {/* APPEARANCE */}

                                <div
                                    className="settingsOption"
                                    onClick={
                                        openAppearanceFromSettings
                                    }
                                >

                                    <div className="settingsOptionIcon">

                                        <i className="fa-solid fa-palette"></i>

                                    </div>


                                    <div className="settingsOptionText">

                                        <strong>
                                            Appearance
                                        </strong>

                                        <span>
                                            Change your theme
                                        </span>

                                    </div>


                                    <i className="fa-solid fa-chevron-right settingsOptionArrow"></i>

                                </div>


                                {/* CHAT PREFERENCES */}

                                <div
                                    className="settingsOption"
                                    onClick={
                                        openChatPreferences
                                    }
                                >

                                    <div className="settingsOptionIcon">

                                        <i className="fa-solid fa-message"></i>

                                    </div>


                                    <div className="settingsOptionText">

                                        <strong>
                                            Chat Preferences
                                        </strong>

                                        <span>
                                            Customize your chat experience
                                        </span>

                                    </div>


                                    <i className="fa-solid fa-chevron-right settingsOptionArrow"></i>

                                </div>

                            </div>


                            {/* ABOUT */}

                            <div className="settingsSection">

                                <h3>
                                    About
                                </h3>


                                <div
                                    className="settingsOption"
                                    onClick={openAbout}
                                >

                                    <div className="settingsOptionIcon">

                                        <i className="fa-solid fa-circle-info"></i>

                                    </div>


                                    <div className="settingsOptionText">

                                        <strong>
                                            About SigmaGPT
                                        </strong>

                                        <span>
                                            AI-powered chat assistant
                                        </span>

                                    </div>


                                    <i className="fa-solid fa-chevron-right settingsOptionArrow"></i>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================
                CHAT PREFERENCES
            ===================================== */}

            {chatPreferencesOpen && (

                <div
                    className="settingsOverlay"
                    onClick={closeChatPreferences}
                >

                    <div
                        className="preferencesModal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="settingsHeader">

                            <div>

                                <h2>
                                    Chat Preferences
                                </h2>

                                <p>
                                    Customize your SigmaGPT chat experience
                                </p>

                            </div>


                            <button
                                className="settingsClose"
                                onClick={closeChatPreferences}
                            >

                                <i className="fa-solid fa-xmark"></i>

                            </button>

                        </div>


                        <div className="preferencesBody">


                            {/* ENTER */}

                            <div className="preferenceRow">

                                <div className="preferenceInfo">

                                    <strong>
                                        Enter to send
                                    </strong>

                                    <span>
                                        Press Enter to send your message
                                    </span>

                                </div>


                                <button
                                    className={`toggleSwitch ${
                                        enterToSend
                                            ? "toggleActive"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setEnterToSend(
                                            !enterToSend
                                        )
                                    }
                                >

                                    <span></span>

                                </button>

                            </div>


                            {/* MARKDOWN */}

                            <div className="preferenceRow">

                                <div className="preferenceInfo">

                                    <strong>
                                        Markdown rendering
                                    </strong>

                                    <span>
                                        Format AI responses with Markdown
                                    </span>

                                </div>


                                <button
                                    className={`toggleSwitch ${
                                        markdownEnabled
                                            ? "toggleActive"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setMarkdownEnabled(
                                            !markdownEnabled
                                        )
                                    }
                                >

                                    <span></span>

                                </button>

                            </div>


                            {/* CODE */}

                            <div className="preferenceRow">

                                <div className="preferenceInfo">

                                    <strong>
                                        Code highlighting
                                    </strong>

                                    <span>
                                        Highlight programming code in responses
                                    </span>

                                </div>


                                <button
                                    className={`toggleSwitch ${
                                        codeHighlightEnabled
                                            ? "toggleActive"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setCodeHighlightEnabled(
                                            !codeHighlightEnabled
                                        )
                                    }
                                >

                                    <span></span>

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================
                ABOUT SIGMAGPT
            ===================================== */}

            {aboutOpen && (

                <div
                    className="settingsOverlay"
                    onClick={closeAbout}
                >

                    <div
                        className="aboutModal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* CLOSE */}

                        <button
                            className="aboutClose"
                            onClick={closeAbout}
                        >

                            <i className="fa-solid fa-xmark"></i>

                        </button>


                        {/* LOGO */}

                        <div className="aboutLogo">

                            <span>
                                Σ
                            </span>

                        </div>


                        {/* TITLE */}

                        <h1>
                            SigmaGPT
                        </h1>


                        <p className="aboutTagline">
                            AI-powered chat assistant
                        </p>


                        {/* VERSION */}

                        <div className="aboutVersion">
                            Version 1.0.0
                        </div>


                        {/* DESCRIPTION */}

                        <p className="aboutDescription">

                            SigmaGPT is an AI-powered conversational
                            assistant designed to provide fast,
                            intelligent and helpful responses.

                        </p>


                        {/* TECH STACK */}

                        <div className="aboutSection">

                            <h3>
                                Built With
                            </h3>


                            <div className="techStack">

                                <span>
                                    React
                                </span>

                                <span>
                                    Node.js
                                </span>

                                <span>
                                    Express
                                </span>

                                <span>
                                    MongoDB
                                </span>

                                <span>
                                    Gemini AI
                                </span>

                            </div>

                        </div>


                        {/* FEATURES */}

                        <div className="aboutSection">

                            <h3>
                                Features
                            </h3>


                            <div className="aboutFeatures">

                                <div>

                                    <i className="fa-solid fa-comments"></i>

                                    Chat with AI

                                </div>


                                <div>

                                    <i className="fa-solid fa-clock-rotate-left"></i>

                                    Chat history

                                </div>


                                <div>

                                    <i className="fa-solid fa-code"></i>

                                    Markdown & code

                                </div>


                                <div>

                                    <i className="fa-solid fa-palette"></i>

                                    Theme support

                                </div>

                            </div>

                        </div>


                        {/* GITHUB */}

                        <a
                            className="githubButton"
                            href="https://github.com/adityas7751-jpg/SigmaGpt"
                            target="_blank"
                            rel="noopener noreferrer"
                        >

                            <i className="fa-brands fa-github"></i>

                            View on GitHub

                        </a>


                        <p className="aboutFooter">

                            Made with ❤️ for learning and building.

                        </p>

                    </div>

                </div>

            )}


            {/* =====================================
                PREMIUM MODAL
            ===================================== */}

            {premiumOpen && (

                <div
                    className="settingsOverlay"
                    onClick={closePremium}
                >

                    <div
                        className="premiumModal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* CLOSE */}

                        <button
                            className="premiumClose"
                            onClick={closePremium}
                        >

                            <i className="fa-solid fa-xmark"></i>

                        </button>


                        {/* PREMIUM ICON */}

                        <div className="premiumIconLarge">

                            <i className="fa-solid fa-crown"></i>

                        </div>


                        {/* TITLE */}

                        <h1>
                            Upgrade to Premium
                        </h1>


                        <p className="premiumSubtitle">

                            Unlock the full power of SigmaGPT

                        </p>


                        {/* PLANS */}

                        <div className="premiumPlans">


                            {/* =========================
                                FREE PLAN
                            ========================= */}

                            <div
                                className={`planCard ${
                                    selectedPlan === "free"
                                        ? "selectedPlan"
                                        : ""
                                }`}
                                onClick={() =>
                                    setSelectedPlan("free")
                                }
                            >

                                {selectedPlan === "free" && (

                                    <div className="selectedBadge">
                                        SELECTED
                                    </div>

                                )}


                                <div className="planHeader">

                                    <div>

                                        <h3>
                                            Free
                                        </h3>

                                        <p>
                                            For casual users
                                        </p>

                                    </div>


                                    {selectedPlan === "free" && (

                                        <span className="currentBadge">
                                            Current
                                        </span>

                                    )}

                                </div>


                                <div className="planPrice">

                                    ₹0

                                    <span>
                                        /month
                                    </span>

                                </div>


                                <div className="planFeatures">

                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Basic AI conversations

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Chat history

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Markdown support

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Standard responses

                                    </div>

                                </div>

                            </div>


                            {/* =========================
                                PREMIUM PLAN
                            ========================= */}

                            <div
                                className={`planCard premiumPlan ${
                                    selectedPlan === "premium"
                                        ? "selectedPlan"
                                        : ""
                                }`}
                                onClick={() =>
                                    setSelectedPlan("premium")
                                }
                            >

                                <div className="popularBadge">
                                    MOST POPULAR
                                </div>


                                {selectedPlan === "premium" && (

                                    <div className="selectedBadge">
                                        SELECTED
                                    </div>

                                )}


                                <div className="planHeader">

                                    <div>

                                        <h3>
                                            Premium
                                        </h3>

                                        <p>
                                            For power users
                                        </p>

                                    </div>

                                </div>


                                <div className="planPrice">

                                    ₹499

                                    <span>
                                        /month
                                    </span>

                                </div>


                                <div className="planFeatures">

                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Higher AI usage limits

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Faster responses

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Advanced AI features

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Priority access

                                    </div>


                                    <div>

                                        <i className="fa-solid fa-check"></i>

                                        Premium support

                                    </div>

                                </div>


                                {selectedPlan === "premium" && (

                                    <button
                                        className="upgradeButton"
                                        onClick={(e) => {

                                            e.stopPropagation();

                                            alert(
                                                "Premium payment will be available soon."
                                            );

                                        }}
                                    >

                                        <i className="fa-solid fa-crown"></i>

                                        Upgrade Now

                                    </button>

                                )}

                            </div>

                        </div>


                        {/* FOOTER */}

                        <p className="premiumFooter">

                            {selectedPlan === "free"

                                ? "You are currently using the Free plan."

                                : "Cancel anytime. Payment integration will be available soon."

                            }

                        </p>

                    </div>

                </div>

            )}


            {/* =====================================
                CHAT
            ===================================== */}

            <Chat />


            {/* =====================================
                LOADER
            ===================================== */}

            <div className="loaderWrapper">

                <ScaleLoader
                    color={
                        activeTheme === "light"
                            ? "#333"
                            : "#fff"
                    }
                    loading={loading}
                    height={18}
                    width={3}
                    radius={2}
                    margin={2}
                />

            </div>


            {/* =====================================
                INPUT
            ===================================== */}

            <div className="chatInput">

                <div className="inputBox">

                    <input
                        placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) =>
                            setPrompt(e.target.value)
                        }
                        onKeyDown={(e) => {

                            if (
                                e.key === "Enter" &&
                                !e.shiftKey &&
                                enterToSend
                            ) {

                                e.preventDefault();

                                getReply();

                            }

                        }}
                    />


                    <div
                        id="submit"
                        onClick={getReply}
                    >

                        <i className="fa-solid fa-paper-plane"></i>

                    </div>

                </div>


                <p className="info">

                    SigmaGPT can make mistakes.
                    Check important info.
                    See Cookie Preferences.

                </p>

            </div>

        </div>

    );
}

export default ChatWindow;