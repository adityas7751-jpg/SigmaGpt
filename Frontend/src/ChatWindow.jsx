import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { API_URL } from "./config.js";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,

    prevChats,
    setPrevChats,

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
    setCodeHighlightEnabled,

    user,
    setUser,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({
    used: 0,
    limit: 10,
    remaining: 10,
  });

  const [limitReached, setLimitReached] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatPreferencesOpen, setChatPreferencesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  // ==========================================
  // PREMIUM PLAN
  // ==========================================

  const [selectedPlan, setSelectedPlan] = useState(user?.plan || "free");

  useEffect(() => {
    if (user?.plan) {
      setSelectedPlan(user.plan);
    }
  }, [user?.plan]);

  // ==========================================
  // GET AI REPLY
  // ==========================================

  const getReply = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || loading) {
      return;
    }

    setLoading(true);
    setNewChat(false);

    // Clear previous reply
    setReply(null);

    // Show user message immediately
    setPrevChats((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmedPrompt,
      },
    ]);

    try {
      const token = localStorage.getItem("sigmagpt-token");

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        body: JSON.stringify({
          message: trimmedPrompt,
          threadId: currThreadId,
        }),
      });

      const res = await response.json();

      if (!response.ok) {
        const error = new Error(res.error || "Failed to get response");

        error.limitReached = res.limitReached;
        error.dailyLimit = res.dailyLimit;
        error.used = res.used;
        error.remaining = res.remaining;

        throw error;
      }

      // Save AI reply in state
      setReply(res.reply);

      // Show AI response immediately
      setPrevChats((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
        },
      ]);

      // Update AI usage
      if (res.usage) {
        setUsage(res.usage);
      }
    } catch (err) {
      console.log("Chat error:", err);

      // If Free plan limit is reached
      if (err.limitReached) {
        setUsage({
          used: err.used ?? err.dailyLimit ?? 10,
          limit: err.dailyLimit ?? 10,
          remaining: err.remaining ?? 0,
        });

        setLimitReached(true);
      }

      if (err.message) {
        console.log("AI Error:", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLEAR INPUT AFTER RESPONSE
  // ==========================================

  useEffect(() => {
    if (reply) {
      setPrompt("");
    }
  }, [reply, setPrompt]);

  // ==========================================
  // PROFILE
  // ==========================================

  const handleProfileClick = () => {
    setProfileOpen((prev) => !prev);
    setAppearanceOpen(false);
  };

  const closeProfile = () => {
    setProfileOpen(false);
    setAppearanceOpen(false);
  };

  // ==========================================
  // SETTINGS
  // ==========================================

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

  // ==========================================
  // CHAT PREFERENCES
  // ==========================================

  const openChatPreferences = () => {
    setSettingsOpen(false);
    setChatPreferencesOpen(true);
  };

  const closeChatPreferences = () => {
    setChatPreferencesOpen(false);
  };

  // ==========================================
  // ABOUT
  // ==========================================

  const openAbout = () => {
    setSettingsOpen(false);
    setAboutOpen(true);
  };

  const closeAbout = () => {
    setAboutOpen(false);
  };

  // ==========================================
  // PREMIUM
  // ==========================================

  const openPremium = () => {
    setPremiumOpen(true);
    setProfileOpen(false);
    setAppearanceOpen(false);

    // Free user ke liye Premium automatically select hoga
    setSelectedPlan("premium");
  };

  const closePremium = () => {
    setPremiumOpen(false);
  };

  // ==========================================
  // LOAD RAZORPAY
  // ==========================================

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));

        existingScript.addEventListener("error", () => resolve(false));

        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  // ==========================================
  // UPGRADE TO PREMIUM - RAZORPAY
  // ==========================================

  const handleUpgrade = async () => {
    const token = localStorage.getItem("sigmagpt-token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      setLoading(true);

      // =====================================
      // CREATE RAZORPAY SUBSCRIPTION
      // =====================================

      const response = await fetch(
        `${API_URL}/api/payment/create-subscription`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }

      // =====================================
      // LOAD RAZORPAY CHECKOUT
      // =====================================

      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error("Razorpay Checkout failed to load.");
      }

      // =====================================
      // RAZORPAY CHECKOUT OPTIONS
      // =====================================

      const options = {
        key: data.keyId,

        subscription_id: data.subscriptionId,

        name: "SigmaGPT",

        description: "SigmaGPT Premium - ₹499/month",

        prefill: {
          name: data.user.name,

          email: data.user.email,
        },

        theme: {
          color: "#8b35f5",
        },

        // =================================
        // PAYMENT SUCCESS
        // =================================

        handler: async function (paymentResponse) {
          try {
            setLoading(true);

            const verifyResponse = await fetch(
              `${API_URL}/api/payment/verify-subscription`,
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",

                  Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify(paymentResponse),
              },
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error || "Payment verification failed.",
              );
            }

            // =========================
            // UPDATE USER
            // =========================

            if (verifyData.user) {
              setUser(verifyData.user);

              localStorage.setItem(
                "sigmagpt-user",
                JSON.stringify(verifyData.user),
              );
            }

            setSelectedPlan("premium");

            setPremiumOpen(false);

            alert("🎉 Payment successful! SigmaGPT Premium is now active.");
          } catch (err) {
            console.log("Payment verification error:", err);

            alert(err.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },

        // =================================
        // CHECKOUT CLOSED
        // =================================

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      // =====================================
      // OPEN RAZORPAY
      // =====================================

      const razorpay = new window.Razorpay(options);

      // =====================================
      // PAYMENT FAILED
      // =====================================

      razorpay.on("payment.failed", function (response) {
        console.log("Payment failed:", response);

        setLoading(false);

        alert("Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err) {
      console.log("Payment error:", err);

      alert(err.message || "Unable to start payment.");

      setLoading(false);
    }
  };

  // ==========================================
  // DOWNGRADE TO FREE
  // ==========================================

  const handleDowngrade = async () => {
    const token = localStorage.getItem("sigmagpt-token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel your Premium subscription and move to the Free plan?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/payment/cancel-subscription`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel subscription.");
      }

      // =====================================
      // UPDATE USER
      // =====================================

      if (data.user) {
        setUser(data.user);

        localStorage.setItem("sigmagpt-user", JSON.stringify(data.user));
      } else {
        const updatedUser = {
          ...user,
          plan: "free",
          razorpaySubscriptionId: null,
          premiumSince: null,
        };

        setUser(updatedUser);

        localStorage.setItem("sigmagpt-user", JSON.stringify(updatedUser));
      }

      setSelectedPlan("free");

      alert(
        "Your Premium subscription has been cancelled. You are now on the Free plan.",
      );
    } catch (err) {
      console.log("Downgrade error:", err);

      alert(err.message || "Unable to cancel subscription.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // APPEARANCE
  // ==========================================

  const handleAppearance = () => {
    setAppearanceOpen((prev) => !prev);
  };

  const changeTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    setAppearanceOpen(false);
  };

  // ==========================================
  // APPEARANCE FROM SETTINGS
  // ==========================================

  const openAppearanceFromSettings = () => {
    setSettingsOpen(false);
    setProfileOpen(true);
    setAppearanceOpen(true);
  };

  // ==========================================
  // MOBILE SIDEBAR
  // ==========================================

  const openSidebar = () => {
    setSidebarOpen(true);
    setProfileOpen(false);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("sigmagpt-token");

    localStorage.removeItem("sigmagpt-user");

    setUser(null);

    setProfileOpen(false);
    setSettingsOpen(false);
    setChatPreferencesOpen(false);
    setAboutOpen(false);
    setPremiumOpen(false);
  };

  // ==========================================
  // PLAN DISPLAY
  // ==========================================

  const isPremium = user?.plan === "premium";

  const planName = isPremium ? "Premium Plan" : "Free Plan";

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="chatWindow">
      {/* ==================================
                    MOBILE OVERLAY
                ================================== */}

      {sidebarOpen && (
        <div className="sidebarOverlay" onClick={closeSidebar}></div>
      )}

      {/* ==================================
                    NAVBAR
                ================================== */}

      <div className="navbar">
        <div className="navbarLeft">
          <button
            className="mobileMenuButton"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          <span className="brandName">
            SigmaGPT
            <i className="fa-solid fa-chevron-down"></i>
          </span>
        </div>

        <div className="userIconDiv" onClick={handleProfileClick}>
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </div>
      </div>

      {/* ==================================
                    PROFILE PANEL
                ================================== */}

      {profileOpen && (
        <>
          <div className="profileOutside" onClick={closeProfile}></div>

          <div className="profilePanel">
            <div className="profileHeader">
              <div className="profileAvatar">
                <i className="fa-solid fa-user"></i>
              </div>

              <div className="profileInfo">
                <h3>{user?.name || "User"}</h3>

                <span>{planName}</span>
              </div>
            </div>

            <div className="profileDivider"></div>

            {/* SETTINGS */}

            <button className="profileItem" onClick={openSettings}>
              <div className="profileItemIcon">
                <i className="fa-solid fa-gear"></i>
              </div>

              <div className="profileItemText">
                <strong>Settings</strong>

                <span>Manage your preferences</span>
              </div>

              <i className="fa-solid fa-chevron-right profileArrow"></i>
            </button>

            {/* PREMIUM */}

            <button className="profileItem premiumItem" onClick={openPremium}>
              <div className="profileItemIcon premiumIcon">
                <i className="fa-solid fa-sparkles"></i>
              </div>

              <div className="profileItemText">
                <strong>
                  {isPremium ? "Premium Plan" : "Upgrade to Premium"}
                </strong>

                <span>
                  {isPremium
                    ? "You have premium access"
                    : "Unlock more AI features"}
                </span>
              </div>

              <i className="fa-solid fa-chevron-right profileArrow"></i>
            </button>

            {/* APPEARANCE */}

            <button className="profileItem" onClick={handleAppearance}>
              <div className="profileItemIcon">
                <i className="fa-solid fa-moon"></i>
              </div>

              <div className="profileItemText">
                <strong>Appearance</strong>

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
                  appearanceOpen ? "fa-chevron-down" : "fa-chevron-right"
                } profileArrow`}
              ></i>
            </button>

            {/* THEME OPTIONS */}

            {appearanceOpen && (
              <div className="appearanceOptions">
                <button
                  className={`themeOption ${
                    theme === "dark" ? "activeTheme" : ""
                  }`}
                  onClick={() => changeTheme("dark")}
                >
                  <div className="themeIcon">
                    <i className="fa-solid fa-moon"></i>
                  </div>

                  <span>Dark</span>

                  {theme === "dark" && <i className="fa-solid fa-check"></i>}
                </button>

                <button
                  className={`themeOption ${
                    theme === "light" ? "activeTheme" : ""
                  }`}
                  onClick={() => changeTheme("light")}
                >
                  <div className="themeIcon">
                    <i className="fa-solid fa-sun"></i>
                  </div>

                  <span>Light</span>

                  {theme === "light" && <i className="fa-solid fa-check"></i>}
                </button>

                <button
                  className={`themeOption ${
                    theme === "system" ? "activeTheme" : ""
                  }`}
                  onClick={() => changeTheme("system")}
                >
                  <div className="themeIcon">
                    <i className="fa-solid fa-desktop"></i>
                  </div>

                  <span>System</span>

                  {theme === "system" && <i className="fa-solid fa-check"></i>}
                </button>
              </div>
            )}

            <div className="profileDivider"></div>

            {/* LOGOUT */}

            <button className="profileItem logoutItem" onClick={handleLogout}>
              <div className="profileItemIcon">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </div>

              <div className="profileItemText">
                <strong>Log out</strong>

                <span>Sign out of SigmaGPT</span>
              </div>
            </button>
          </div>
        </>
      )}

      {/* ==================================
                    SETTINGS MODAL
                ================================== */}

      {settingsOpen && (
        <div className="settingsOverlay" onClick={closeSettings}>
          <div className="settingsModal" onClick={(e) => e.stopPropagation()}>
            <div className="settingsHeader">
              <div>
                <h2>Settings</h2>

                <p>Manage your SigmaGPT preferences</p>
              </div>

              <button className="settingsClose" onClick={closeSettings}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="settingsBody">
              {/* ACCOUNT */}

              <div className="settingsSection">
                <h3>Account</h3>

                <div className="settingsCard">
                  <div className="settingsAvatar">
                    <i className="fa-solid fa-user"></i>
                  </div>

                  <div className="settingsUserInfo">
                    <strong>{user?.name || "User"}</strong>

                    <span>{planName}</span>
                  </div>
                </div>
              </div>

              {/* PREFERENCES */}

              <div className="settingsSection">
                <h3>Preferences</h3>

                <div
                  className="settingsOption"
                  onClick={openAppearanceFromSettings}
                >
                  <div className="settingsOptionIcon">
                    <i className="fa-solid fa-palette"></i>
                  </div>

                  <div className="settingsOptionText">
                    <strong>Appearance</strong>

                    <span>Change your theme</span>
                  </div>

                  <i className="fa-solid fa-chevron-right settingsOptionArrow"></i>
                </div>

                <div className="settingsOption" onClick={openChatPreferences}>
                  <div className="settingsOptionIcon">
                    <i className="fa-solid fa-message"></i>
                  </div>

                  <div className="settingsOptionText">
                    <strong>Chat Preferences</strong>

                    <span>Customize your chat experience</span>
                  </div>

                  <i className="fa-solid fa-chevron-right settingsOptionArrow"></i>
                </div>
              </div>

              {/* ABOUT */}

              <div className="settingsSection">
                <h3>About</h3>

                <div className="settingsOption" onClick={openAbout}>
                  <div className="settingsOptionIcon">
                    <i className="fa-solid fa-circle-info"></i>
                  </div>

                  <div className="settingsOptionText">
                    <strong>About SigmaGPT</strong>

                    <span>AI-powered chat assistant</span>
                  </div>

                  <i className="fa-solid fa-chevron-right settingsOptionArrow"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
                    CHAT PREFERENCES
                ================================== */}

      {chatPreferencesOpen && (
        <div className="settingsOverlay" onClick={closeChatPreferences}>
          <div
            className="preferencesModal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settingsHeader">
              <div>
                <h2>Chat Preferences</h2>

                <p>Customize your SigmaGPT chat experience</p>
              </div>

              <button className="settingsClose" onClick={closeChatPreferences}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="preferencesBody">
              {/* ENTER TO SEND */}

              <div className="preferenceRow">
                <div className="preferenceInfo">
                  <strong>Enter to send</strong>

                  <span>Press Enter to send your message</span>
                </div>

                <button
                  className={`toggleSwitch ${
                    enterToSend ? "toggleActive" : ""
                  }`}
                  onClick={() => setEnterToSend(!enterToSend)}
                >
                  <span></span>
                </button>
              </div>

              {/* MARKDOWN */}

              <div className="preferenceRow">
                <div className="preferenceInfo">
                  <strong>Markdown rendering</strong>

                  <span>Format AI responses with Markdown</span>
                </div>

                <button
                  className={`toggleSwitch ${
                    markdownEnabled ? "toggleActive" : ""
                  }`}
                  onClick={() => setMarkdownEnabled(!markdownEnabled)}
                >
                  <span></span>
                </button>
              </div>

              {/* CODE HIGHLIGHTING */}

              <div className="preferenceRow">
                <div className="preferenceInfo">
                  <strong>Code highlighting</strong>

                  <span>Highlight programming code in responses</span>
                </div>

                <button
                  className={`toggleSwitch ${
                    codeHighlightEnabled ? "toggleActive" : ""
                  }`}
                  onClick={() => setCodeHighlightEnabled(!codeHighlightEnabled)}
                >
                  <span></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
                    ABOUT
                ================================== */}

      {aboutOpen && (
        <div className="settingsOverlay" onClick={closeAbout}>
          <div className="aboutModal" onClick={(e) => e.stopPropagation()}>
            <button className="aboutClose" onClick={closeAbout}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="aboutLogo">
              <span>Σ</span>
            </div>

            <h1>SigmaGPT</h1>

            <p className="aboutTagline">AI-powered chat assistant</p>

            <div className="aboutVersion">Version 1.0.0</div>

            <p className="aboutDescription">
              SigmaGPT is an AI-powered conversational assistant designed to
              provide fast, intelligent and helpful responses.
            </p>

            <div className="aboutSection">
              <h3>Built With</h3>

              <div className="techStack">
                <span>React</span>

                <span>Node.js</span>

                <span>Express</span>

                <span>MongoDB</span>

                <span>Gemini AI</span>
              </div>
            </div>

            <div className="aboutSection">
              <h3>Features</h3>

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

      {/* ==================================
                    DAILY LIMIT MODAL
                ================================== */}

      {limitReached && (
        <div
          className="limitModalOverlay"
          onClick={() => setLimitReached(false)}
        >
          <div className="limitModal" onClick={(e) => e.stopPropagation()}>
            <button
              className="limitModalClose"
              onClick={() => setLimitReached(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="limitIcon">
              <i className="fa-solid fa-lock"></i>
            </div>

            <h2>Daily Free Limit Reached</h2>

            <p>You've used all 10 free AI messages for today.</p>

            <div className="limitUsage">
              <strong>
                {usage.used}/{usage.limit}
              </strong>

              <span>AI messages used today</span>
            </div>

            <p className="limitUpgradeText">
              Upgrade to Premium for unlimited AI conversations.
            </p>

            <button
              className="limitUpgradeButton"
              onClick={() => {
                setLimitReached(false);
                setSelectedPlan("premium");
                setPremiumOpen(true);
              }}
            >
              <i className="fa-solid fa-crown"></i>
              Upgrade to Premium
            </button>

            <button
              className="limitLaterButton"
              onClick={() => setLimitReached(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ==================================
                    PREMIUM MODAL
                ================================== */}

      {premiumOpen && (
        <div className="settingsOverlay" onClick={closePremium}>
          <div className="premiumModal" onClick={(e) => e.stopPropagation()}>
            {/* CLOSE */}

            <button className="premiumClose" onClick={closePremium}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* ICON */}

            <div className="premiumIconLarge">
              <i className="fa-solid fa-crown"></i>
            </div>

            <h1>Upgrade to Premium</h1>

            <p className="premiumSubtitle">Unlock the full power of SigmaGPT</p>

            {/* PLANS */}

            <div className="premiumPlans">
              {/* ==============================
                                    FREE PLAN
                                ============================== */}

              <div
                className={`planCard ${
                  selectedPlan === "free" ? "selectedPlan" : ""
                }`}
                onClick={() => setSelectedPlan("free")}
              >
                {/* ACTUAL CURRENT PLAN */}

                {user?.plan === "free" && (
                  <div className="selectedBadge">CURRENT PLAN</div>
                )}

                <div className="planHeader">
                  <div>
                    <h3>Free</h3>

                    <p>For casual users</p>
                  </div>

                  {user?.plan === "free" && (
                    <span className="currentBadge">Current</span>
                  )}
                </div>

                <div className="planPrice">
                  ₹0
                  <span>/month</span>
                </div>

                <div className="planFeatures">
                  <div>
                    <i className="fa-solid fa-check"></i>
                    10 AI messages per day
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

                {/* FREE PLAN AI USAGE */}
                {user?.plan === "free" && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "rgba(139, 53, 245, 0.08)",
                      border: "1px solid rgba(139, 53, 245, 0.22)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "9px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#aaa" }}>AI Usage Today</span>

                      <strong style={{ color: "#fff" }}>
                        {usage.used}/{usage.limit}
                      </strong>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "7px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "20px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(
                            (usage.used / usage.limit) * 100,
                            100,
                          )}%`,
                          borderRadius: "20px",
                          background:
                            "linear-gradient(90deg, #8b35f5, #b86cff)",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>

                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: usage.remaining === 0 ? "#ff7b7b" : "#999",
                      }}
                    >
                      {usage.remaining > 0
                        ? `${usage.remaining} messages remaining`
                        : "Daily limit reached"}
                    </p>
                  </div>
                )}

                {/* DOWNGRADE BUTTON */}

                {selectedPlan === "free" && isPremium && (
                  <button
                    className="downgradeButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDowngrade();
                    }}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-arrow-down"></i>

                    {loading ? "Cancelling..." : "Cancel Premium"}
                  </button>
                )}
              </div>

              {/* ==============================
                                    PREMIUM PLAN
                                ============================== */}

              <div
                className={`planCard premiumPlan ${
                  selectedPlan === "premium" ? "selectedPlan" : ""
                }`}
                onClick={() => setSelectedPlan("premium")}
              >
                <div className="popularBadge">MOST POPULAR</div>

                {selectedPlan === "premium" && (
                  <div className="selectedBadge">
                    {isPremium ? "CURRENT PLAN" : "SELECTED"}
                  </div>
                )}

                <div className="planHeader">
                  <div>
                    <h3>Premium</h3>

                    <p>For power users</p>
                  </div>
                </div>

                <div className="planPrice">
                  ₹499
                  <span>/month</span>
                </div>

                <div className="planFeatures">
                  <div>
                    <i className="fa-solid fa-check"></i>
                    Unlimited AI conversations
                  </div>

                  <div>
                    <i className="fa-solid fa-check"></i>
                    No daily message limit
                  </div>

                  <div>
                    <i className="fa-solid fa-check"></i>
                    Full chat history
                  </div>

                  <div>
                    <i className="fa-solid fa-check"></i>
                    Markdown & code support
                  </div>
                </div>

                {/* PREMIUM USAGE */}
                {isPremium && user?.plan === "premium" && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "rgba(34, 197, 94, 0.08)",
                      border: "1px solid rgba(34, 197, 94, 0.25)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "#aaa" }}>AI Usage</span>

                      <strong
                        style={{
                          color: "#4ade80",
                          fontSize: "20px",
                        }}
                      >
                        ∞
                      </strong>
                    </div>

                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      Unlimited AI conversations
                    </p>
                  </div>
                )}

                {/* UPGRADE BUTTON */}

                {selectedPlan === "premium" && !isPremium && (
                  <button
                    className="upgradeButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade();
                    }}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-credit-card"></i>

                    {loading ? "Opening Payment..." : "Pay ₹499 / month"}
                  </button>
                )}

                {/* PREMIUM ACTIVE */}

                {isPremium && user?.plan === "premium" && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "12px",
                      borderRadius: "10px",
                      textAlign: "center",
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.25)",
                      color: "#4ade80",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    <i
                      className="fa-solid fa-circle-check"
                      style={{
                        marginRight: "7px",
                      }}
                    ></i>
                    Premium Active
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}

            <p className="premiumFooter">
              {isPremium
                ? "Your Premium plan is currently active."
                : selectedPlan === "free"
                  ? "You are currently using the Free plan."
                  : "Secure payment powered by Razorpay. ₹499/month."}
            </p>
          </div>
        </div>
      )}

      {/* ==================================
                    CHAT
                ================================== */}

      <Chat />

      {/* ==================================
                    LOADER
                ================================== */}

      <div className="loaderWrapper">
        <ScaleLoader
          color={activeTheme === "light" ? "#333" : "#fff"}
          loading={loading}
          height={18}
          width={3}
          radius={2}
          margin={2}
        />
      </div>

      {/* ==================================
                    INPUT
                ================================== */}

      <div className="chatInput">
        <div className="inputBox">
          <input
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && enterToSend) {
                e.preventDefault();

                getReply();
              }
            }}
          />

          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>

        <p className="info">
          SigmaGPT can make mistakes. Check important info. See Cookie
          Preferences.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
