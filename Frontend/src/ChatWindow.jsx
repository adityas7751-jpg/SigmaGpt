import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
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

  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  const [usage, setUsage] = useState({
    used: 0,
    limit: 10,
    remaining: 10,
  });

  const [limitReached, setLimitReached] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatPreferencesOpen, setChatPreferencesOpen] =
    useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const [editProfileOpen, setEditProfileOpen] =
    useState(false);

  const [editName, setEditName] = useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  // ==========================================
  // FILE ATTACHMENT
  // ==========================================

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ];

    const maxSize = 20 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please select an image, PDF, DOCX, TXT, or CSV file."
      );

      event.target.value = "";

      return;
    }

    if (file.size > maxSize) {
      alert("File size must be 20 MB or less.");

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================
  // PROFILE
  // ==========================================

  const handleProfileClick = () => {
    setProfileOpen((prev) => !prev);
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  // ==========================================
  // SETTINGS
  // ==========================================

  const openSettings = () => {
    setProfileOpen(false);
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  const openEditProfile = () => {
    setEditName(user?.name || "");

    setSettingsOpen(false);

    setEditProfileOpen(true);
  };

  const closeEditProfile = () => {
    if (profileSaving) {
      return;
    }

    setEditProfileOpen(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      alert("Please enter your name.");

      return;
    }

    if (trimmedName.length < 2) {
      alert("Name must contain at least 2 characters.");

      return;
    }

    const token =
      localStorage.getItem("sigmagpt-token");

    if (!token) {
      alert("Please login again.");

      return;
    }

    try {
      setProfileSaving(true);

      const response = await fetch(
        `${API_URL}/api/auth/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update profile."
        );
      }

      if (data.user) {
        setUser(data.user);

        localStorage.setItem(
          "sigmagpt-user",
          JSON.stringify(data.user)
        );
      }

      setEditProfileOpen(false);

      alert("Profile updated successfully.");
    } catch (err) {
      console.log(
        "Profile update error:",
        err
      );

      alert(
        err.message ||
          "Unable to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // ==========================================
  // APPEARANCE
  // ==========================================

  const openAppearance = () => {
    setSettingsOpen(false);

    setAppearanceOpen(true);
  };

  const closeAppearance = () => {
    setAppearanceOpen(false);
  };

  const handleThemeChange = (value) => {
    setTheme(value);
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
    localStorage.removeItem(
      "sigmagpt-token"
    );

    localStorage.removeItem(
      "sigmagpt-user"
    );

    setUser(null);

    setProfileOpen(false);

    setSettingsOpen(false);

    setChatPreferencesOpen(false);

    setAboutOpen(false);

    setPremiumOpen(false);

    setEditProfileOpen(false);
  };

  // ==========================================
  // PLAN
  // ==========================================

  const isPremium =
    user?.plan === "premium";

  const planName = isPremium
    ? "Premium Plan"
    : "Free Plan";

  // ==========================================
  // LOAD USER USAGE
  // ==========================================

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.plan === "premium") {
      setUsage({
        used: 0,
        limit: null,
        remaining: null,
      });

      setLimitReached(false);

      return;
    }

    setUsage((prev) => ({
      ...prev,
      limit: 10,
    }));
  }, [user]);

  // ==========================================
  // GET AI REPLY - STREAMING
  // ==========================================

  const getReply = async () => {
    const trimmedPrompt = prompt.trim();

    if (
      (!trimmedPrompt && !selectedFile) ||
      loading
    ) {
      return;
    }

    if (selectedFile) {
      alert(
        "Attachment selected successfully. File-to-AI processing will be connected next."
      );
      return;
    }

    if (!user) {
      alert("Please login to use SigmaGPT.");
      return;
    }

    if (
      user.plan !== "premium" &&
      usage.used >= 10
    ) {
      setLimitReached(true);
      return;
    }

    try {
      setLoading(true);
      setNewChat(false);
      setReply("");

      const token =
        localStorage.getItem("sigmagpt-token");

      const response = await fetch(
        `${API_URL}/api/chat/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            message: trimmedPrompt,
            threadId: currThreadId,
          }),
        }
      );

      if (!response.ok) {
        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (data.limitReached) {
          setUsage({
            used: data.used ?? 10,
            limit: data.dailyLimit ?? 10,
            remaining: data.remaining ?? 0,
          });

          setLimitReached(true);
          return;
        }

        throw new Error(
          data.error ||
            "Unable to get AI response."
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming is not supported by this browser."
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder("utf-8");

      let buffer = "";
      let streamedText = "";
      let streamStarted = false;

      setPrevChats((prev) => [
        ...(prev || []),
        {
          role: "user",
          content: trimmedPrompt,
        },
        {
          role: "assistant",
          content: "",
        },
      ]);

      const updateAssistantMessage = (
        text
      ) => {
        setReply(text);

        setPrevChats((prev) => {
          if (!prev || prev.length === 0) {
            return prev;
          }

          const updated = [...prev];
          const lastIndex =
            updated.length - 1;

          if (
            updated[lastIndex]?.role ===
            "assistant"
          ) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: text,
            };
          }

          return updated;
        });
      };

      const processEvent = (
        eventBlock
      ) => {
        if (!eventBlock.trim()) {
          return;
        }

        const lines =
          eventBlock.split("\n");

        let eventName = "message";
        let dataText = "";

        for (const line of lines) {
          const trimmedLine =
            line.trim();

          if (
            trimmedLine.startsWith(
              "event:"
            )
          ) {
            eventName =
              trimmedLine
                .substring(6)
                .trim();
          }

          if (
            trimmedLine.startsWith(
              "data:"
            )
          ) {
            dataText +=
              trimmedLine
                .substring(5)
                .trim();
          }
        }

        if (!dataText) {
          return;
        }

        let data;

        try {
          data =
            JSON.parse(dataText);
        } catch (error) {
          console.log(
            "SSE JSON parse warning:",
            error
          );
          return;
        }

        if (
          eventName === "start"
        ) {
          streamStarted = true;
          return;
        }

        if (
          eventName === "chunk"
        ) {
          const chunk =
            data?.text || "";

          if (chunk) {
            streamedText += chunk;

            updateAssistantMessage(
              streamedText
            );
          }

          return;
        }

        if (
          eventName === "done"
        ) {
          if (data?.reply) {
            streamedText =
              data.reply;

            updateAssistantMessage(
              streamedText
            );
          }

          if (data?.usage) {
            setUsage(data.usage);

            if (
              data.usage.remaining ===
                0 &&
              user.plan !== "premium"
            ) {
              setLimitReached(true);
            }
          }

          return;
        }

        if (
          eventName === "error"
        ) {
          throw new Error(
            data?.error ||
              "AI streaming failed."
          );
        }
      };

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer +=
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        const events =
          buffer.split("\n\n");

        buffer =
          events.pop() || "";

        for (
          const eventBlock of events
        ) {
          processEvent(
            eventBlock
          );
        }
      }

      buffer +=
        decoder.decode();

      if (buffer.trim()) {
        processEvent(buffer);
      }

      if (
        !streamStarted ||
        !streamedText.trim()
      ) {
        throw new Error(
          "AI returned an empty response."
        );
      }

      setPrompt("");

    } catch (err) {
      console.log(
        "Streaming chat error:",
        err
      );

      setPrevChats((prev) => {
        if (
          !prev ||
          prev.length === 0
        ) {
          return prev;
        }

        const updated = [...prev];
        const lastIndex =
          updated.length - 1;

        if (
          updated[lastIndex]?.role ===
            "assistant" &&
          !updated[lastIndex]?.content
        ) {
          updated.pop();
        }

        return updated;
      });

      alert(
        err.message ||
          "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RAZORPAY SCRIPT
  // ==========================================

  const loadRazorpay = () => {
    return new Promise(
      (resolve) => {
        if (
          window.Razorpay
        ) {
          resolve(true);

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => {
          resolve(true);
        };

        script.onerror = () => {
          resolve(false);
        };

        document.body.appendChild(
          script
        );
      }
    );
  };

  // ==========================================
  // UPGRADE
  // ==========================================

  const handleUpgrade = async () => {
    const token =
      localStorage.getItem(
        "sigmagpt-token"
      );

    if (!token) {
      alert(
        "Please login again."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/api/payment/create-subscription`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start payment."
        );
      }

      const loaded =
        await loadRazorpay();

      if (!loaded) {
        throw new Error(
          "Razorpay Checkout failed to load."
        );
      }

      const options = {
        key: data.keyId,

        subscription_id:
          data.subscriptionId,

        name: "SigmaGPT",

        description:
          "SigmaGPT Premium - ₹499/month",

        prefill: {
          name:
            data.user.name,

          email:
            data.user.email,
        },

        theme: {
          color: "#8b35f5",
        },

        handler:
          async function (
            paymentResponse
          ) {
            try {
              setLoading(true);

              const verifyResponse =
                await fetch(
                  `${API_URL}/api/payment/verify-subscription`,
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${token}`,
                    },

                    body: JSON.stringify(
                      paymentResponse
                    ),
                  }
                );

              const verifyData =
                await verifyResponse.json();

              if (
                !verifyResponse.ok
              ) {
                throw new Error(
                  verifyData.error ||
                    "Payment verification failed."
                );
              }

              if (
                verifyData.user
              ) {
                setUser(
                  verifyData.user
                );

                localStorage.setItem(
                  "sigmagpt-user",
                  JSON.stringify(
                    verifyData.user
                  )
                );
              }

              setPremiumOpen(
                false
              );

              alert(
                "🎉 Payment successful! SigmaGPT Premium is now active."
              );
            } catch (err) {
              console.log(
                "Payment verification error:",
                err
              );

              alert(
                err.message ||
                  "Payment verification failed."
              );
            } finally {
              setLoading(false);
            }
          },

        modal: {
          ondismiss:
            function () {
              setLoading(
                false
              );
            },
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        "payment.failed",
        function (
          response
        ) {
          console.log(
            "Payment failed:",
            response
          );

          setLoading(false);

          alert(
            "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (err) {
      console.log(
        "Payment error:",
        err
      );

      alert(
        err.message ||
          "Unable to start payment."
      );

      setLoading(false);
    }
  };

  // ==========================================
  // CANCEL PREMIUM
  // ==========================================

  const handleCancelPremium =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel Premium?"
        );

      if (!confirmed) {
        return;
      }

      const token =
        localStorage.getItem(
          "sigmagpt-token"
        );

      if (!token) {
        alert(
          "Please login again."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_URL}/api/payment/cancel-subscription`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to cancel subscription."
          );
        }

        if (
          data.user
        ) {
          setUser(
            data.user
          );

          localStorage.setItem(
            "sigmagpt-user",
            JSON.stringify(
              data.user
            )
          );
        }

        setPremiumOpen(
          false
        );

        alert(
          "Premium subscription cancelled."
        );
      } catch (err) {
        console.log(
          "Cancel premium error:",
          err
        );

        alert(
          err.message ||
            "Unable to cancel Premium."
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className={`chatWindow ${
        activeTheme === "light"
          ? "lightTheme"
          : ""
      }`}
    >
      {/* ==================================
          MOBILE OVERLAY
      ================================== */}

      {sidebarOpen && (
        <div
          className="sidebarOverlay"
          onClick={closeSidebar}
        ></div>
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

        </div>

        <div
          className="userIconDiv"
          onClick={
            handleProfileClick
          }
        >
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
          <div
            className="profileOutside"
            onClick={closeProfile}
          ></div>

          <div className="profilePanel">
            <div className="profileHeader">
              <div className="profileAvatar">
                <i className="fa-solid fa-user"></i>
              </div>

              <div className="profileInfo">
                <h3>
                  {user?.name ||
                    "User"}
                </h3>

                <span>
                  {planName}
                </span>
              </div>
            </div>

            <div className="profileDivider"></div>

            {/* SETTINGS */}

            <button
              className="profileItem"
              onClick={
                openSettings
              }
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
              className="profileItem premiumProfileItem"
              onClick={() => {
                setProfileOpen(
                  false
                );

                setPremiumOpen(
                  true
                );
              }}
            >
              <div className="profileItemIcon premiumIcon">
                <i className="fa-solid fa-crown"></i>
              </div>

              <div className="profileItemText">
                <strong>
                  Premium Plan
                </strong>

                <span>
                  {isPremium
                    ? "You have premium access"
                    : "Unlock unlimited AI"}
                </span>
              </div>

              <i className="fa-solid fa-chevron-right profileArrow"></i>
            </button>

            {/* UNLIMITED AI */}

            {isPremium && (
              <div className="premiumMiniCard">
                <div className="premiumMiniIcon">
                  <i className="fa-solid fa-infinity"></i>
                </div>

                <div>
                  <strong>
                    Unlimited AI
                  </strong>

                  <span>
                    Premium access
                  </span>

                  <small>
                    <i className="fa-solid fa-circle-check"></i>
                    No daily message limit
                  </small>
                </div>
              </div>
            )}

            {/* APPEARANCE */}

            <button
              className="profileItem"
              onClick={
                openAppearance
              }
            >
              <div className="profileItemIcon">
                <i className="fa-solid fa-moon"></i>
              </div>

              <div className="profileItemText">
                <strong>
                  Appearance
                </strong>

                <span>
                  {activeTheme ===
                  "light"
                    ? "Light mode"
                    : "Dark mode"}
                </span>
              </div>

              <i className="fa-solid fa-chevron-right profileArrow"></i>
            </button>

            <div className="profileDivider"></div>

            {/* LOGOUT */}

            <button
              className="profileItem logoutItem"
              onClick={
                handleLogout
              }
            >
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

      {/* ==================================
          SETTINGS MODAL
      ================================== */}

      {settingsOpen && (
        <div className="modalOverlay">
          <div className="settingsModal">
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
                className="modalCloseButton"
                onClick={
                  closeSettings
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="settingsBody">
              {/* ACCOUNT */}

              <div className="settingsSectionTitle">
                ACCOUNT
              </div>

              <button
                className="accountCard"
                onClick={
                  openEditProfile
                }
              >
                <div className="settingsAvatar">
                  <i className="fa-solid fa-user"></i>
                </div>

                <div className="accountInfo">
                  <strong>
                    {user?.name ||
                      "User"}
                  </strong>

                  <span>
                    {planName}
                  </span>

                  <small>
                    Edit Profile
                  </small>
                </div>

                <i className="fa-solid fa-chevron-right settingsChevron"></i>
              </button>

              {/* PREFERENCES */}

              <div className="settingsSectionTitle">
                PREFERENCES
              </div>

              <button
                className="settingsOption"
                onClick={
                  openAppearance
                }
              >
                <div className="settingsOptionIcon">
                  <i className="fa-solid fa-palette"></i>
                </div>

                <div>
                  <strong>
                    Appearance
                  </strong>

                  <span>
                    Change your theme
                  </span>
                </div>

                <i className="fa-solid fa-chevron-right"></i>
              </button>

              <button
                className="settingsOption"
                onClick={
                  openChatPreferences
                }
              >
                <div className="settingsOptionIcon">
                  <i className="fa-solid fa-message"></i>
                </div>

                <div>
                  <strong>
                    Chat Preferences
                  </strong>

                  <span>
                    Customize your chat experience
                  </span>
                </div>

                <i className="fa-solid fa-chevron-right"></i>
              </button>

              {/* ABOUT */}

              <div className="settingsSectionTitle">
                ABOUT
              </div>

              <button
                className="settingsOption"
                onClick={
                  openAbout
                }
              >
                <div className="settingsOptionIcon">
                  <i className="fa-solid fa-circle-info"></i>
                </div>

                <div>
                  <strong>
                    About SigmaGPT
                  </strong>

                  <span>
                    AI-powered chat assistant
                  </span>
                </div>

                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          EDIT PROFILE MODAL
      ================================== */}

      {editProfileOpen && (
        <div className="modalOverlay">
          <div className="editProfileModal">
            <div className="editProfileHeader">
              <div>
                <h2>
                  Edit Profile
                </h2>

                <p>
                  Update your SigmaGPT profile information
                </p>
              </div>

              <button
                className="modalCloseButton"
                onClick={
                  closeEditProfile
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="editProfileBody">
              <div className="editProfileAvatar">
                <i className="fa-solid fa-user"></i>
              </div>

              <div className="profileField">
                <label>
                  Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) =>
                    setEditName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your name"
                  disabled={
                    profileSaving
                  }
                />
              </div>

              <div className="profileField">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={
                    user?.email ||
                    ""
                  }
                  disabled
                />

                <small>
                  Email address cannot be changed.
                </small>
              </div>

              <div className="editProfileActions">
                <button
                  type="button"
                  className="cancelProfileButton"
                  onClick={
                    closeEditProfile
                  }
                  disabled={
                    profileSaving
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="saveProfileButton"
                  onClick={
                    handleSaveProfile
                  }
                  disabled={
                    profileSaving
                  }
                >
                  {profileSaving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          APPEARANCE MODAL
      ================================== */}

      {appearanceOpen && (
        <div className="modalOverlay">
          <div className="preferenceModal">
            <div className="preferenceHeader">
              <div>
                <h2>
                  Appearance
                </h2>

                <p>
                  Choose how SigmaGPT looks
                </p>
              </div>

              <button
                className="modalCloseButton"
                onClick={
                  closeAppearance
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="preferenceBody">
              <button
                className={`themeOption ${
                  activeTheme ===
                  "dark"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleThemeChange(
                    "dark"
                  )
                }
              >
                <div className="themeOptionIcon">
                  <i className="fa-solid fa-moon"></i>
                </div>

                <div>
                  <strong>
                    Dark
                  </strong>

                  <span>
                    Easy on the eyes
                  </span>
                </div>

                {activeTheme ===
                  "dark" && (
                  <i className="fa-solid fa-circle-check"></i>
                )}
              </button>

              <button
                className={`themeOption ${
                  activeTheme ===
                  "light"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleThemeChange(
                    "light"
                  )
                }
              >
                <div className="themeOptionIcon">
                  <i className="fa-solid fa-sun"></i>
                </div>

                <div>
                  <strong>
                    Light
                  </strong>

                  <span>
                    Bright and clean
                  </span>
                </div>

                {activeTheme ===
                  "light" && (
                  <i className="fa-solid fa-circle-check"></i>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          CHAT PREFERENCES
      ================================== */}

      {chatPreferencesOpen && (
        <div className="modalOverlay">
          <div className="preferenceModal">
            <div className="preferenceHeader">
              <div>
                <h2>
                  Chat Preferences
                </h2>

                <p>
                  Customize your chat experience
                </p>
              </div>

              <button
                className="modalCloseButton"
                onClick={
                  closeChatPreferences
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="preferenceBody">
              <div className="preferenceToggle">
                <div>
                  <strong>
                    Enter to send
                  </strong>

                  <span>
                    Press Enter to send messages
                  </span>
                </div>

                <button
                  className={`toggleSwitch ${
                    enterToSend
                      ? "active"
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

              <div className="preferenceToggle">
                <div>
                  <strong>
                    Markdown
                  </strong>

                  <span>
                    Format AI responses using Markdown
                  </span>
                </div>

                <button
                  className={`toggleSwitch ${
                    markdownEnabled
                      ? "active"
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

              <div className="preferenceToggle">
                <div>
                  <strong>
                    Code highlighting
                  </strong>

                  <span>
                    Highlight programming code
                  </span>
                </div>

                <button
                  className={`toggleSwitch ${
                    codeHighlightEnabled
                      ? "active"
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

      {/* ==================================
          ABOUT
      ================================== */}

      {aboutOpen && (
        <div className="modalOverlay">
          <div className="aboutModal">
            <div className="aboutHeader">
              <div>
                <h2>
                  About SigmaGPT
                </h2>

                <p>
                  Your AI-powered workspace
                </p>
              </div>

              <button
                className="modalCloseButton"
                onClick={
                  closeAbout
                }
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="aboutBody">
              <div className="aboutLogo">
                <i className="fa-solid fa-brain"></i>
              </div>

              <h3>
                SigmaGPT
              </h3>

              <p>
                Think smarter. Ask anything.
                Create anything.
              </p>

              <div className="aboutVersion">
                Version 1.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          PREMIUM MODAL
      ================================== */}

      {premiumOpen && (
        <div className="premiumOverlay">
          <div className="premiumModal">

            {/* HEADER */}
            <div className="premiumHero">

              <button
                type="button"
                className="premiumCloseButton"
                onClick={() => setPremiumOpen(false)}
                aria-label="Close premium modal"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div className="premiumCrown">
                <i className="fa-solid fa-crown"></i>
              </div>

              <h2>Upgrade to Premium</h2>

              <p>Unlock the full power of SigmaGPT</p>
            </div>


            {/* PLAN CARDS */}
            <div className="premiumPlans">

              {/* FREE PLAN */}
              <div
                className={`premiumPlanCard freePlanCard ${
                  !isPremium ? "currentPlan" : ""
                }`}
              >

                {!isPremium && (
                  <div className="currentPlanBadge">
                    CURRENT PLAN
                  </div>
                )}

                <div className="planHeader">

                  <div>
                    <h3>Free</h3>
                    <p>For casual users</p>
                  </div>

                  {!isPremium && (
                    <span className="currentPlanTag">
                      Current
                    </span>
                  )}

                </div>


                <div className="planPrice">
                  ₹0
                  <span>/month</span>
                </div>


                <div className="planFeatureList">

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>10 AI messages per day</span>
                  </div>

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>Chat history</span>
                  </div>

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>Markdown support</span>
                  </div>

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>Standard responses</span>
                  </div>

                </div>


                {/* FREE USER USAGE */}
                {!isPremium && (
                  <div className="premiumUsageCard">

                    <div className="usageTopRow">
                      <span>AI Usage Today</span>

                      <strong>
                        {usage.used}/{usage.limit || 10}
                      </strong>
                    </div>

                    <div className="premiumUsageBar">
                      <div
                        className="premiumUsageProgress"
                        style={{
                          width: `${Math.min(
                            ((usage.used || 0) / 10) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>

                    <div className="usageRemaining">
                      {Math.max(
                        usage.remaining ?? (10 - (usage.used || 0)),
                        0
                      ) > 0
                        ? `${Math.max(
                            usage.remaining ?? (10 - (usage.used || 0)),
                            0
                          )} messages remaining`
                        : "Daily limit reached"}
                    </div>

                  </div>
                )}


                {/* PREMIUM USER DOWNGRADE */}
                {isPremium && (
                  <button
                    type="button"
                    className="downgradeButton"
                    onClick={handleCancelPremium}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-arrow-down"></i>

                    {loading
                      ? "Downgrading..."
                      : "Downgrade to Free"}
                  </button>
                )}

              </div>


              {/* PREMIUM PLAN */}
              <div
                className={`premiumPlanCard premiumPlan ${
                  isPremium ? "activePremiumPlan" : ""
                }`}
              >

                <div className="mostPopularBadge">
                  MOST POPULAR
                </div>


                <div className="planHeader">

                  <div>
                    <h3>Premium</h3>
                    <p>For power users</p>
                  </div>

                </div>


                <div className="planPrice premiumPrice">
                  ₹499
                  <span>/month</span>
                </div>


                <div className="planFeatureList">

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>Unlimited AI conversations</span>
                  </div>

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>No daily message limit</span>
                  </div>

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>Full chat history</span>
                  </div>

                  <div className="planFeature">
                    <i className="fa-solid fa-check"></i>
                    <span>Markdown &amp; code support</span>
                  </div>

                </div>


                {/* FREE USER → PAYMENT */}
                {!isPremium && (
                  <button
                    type="button"
                    className="premiumUpgradeButton"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    <i className="fa-solid fa-crown"></i>

                    {loading
                      ? "Opening Secure Checkout..."
                      : "Upgrade to Premium"}

                    <span>₹499/month</span>
                  </button>
                )}


                {/* PREMIUM USER → ACTIVE */}
                {isPremium && (
                  <div className="premiumActiveState">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Premium Active</span>
                  </div>
                )}

              </div>

            </div>


            {/* FOOTER */}
            <div className="premiumModalFooter">

              {!isPremium ? (
                <>
                  <i className="fa-solid fa-shield-halved"></i>
                  Secure payment powered by Razorpay
                  <span>•</span>
                  Cancel anytime
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  Your Premium plan is active
                </>
              )}

            </div>

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
          color={
            activeTheme ===
            "light"
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

           {/* ==================================
          CHAT INPUT / AI COMPOSER
      ================================== */}

      <div className="chatInput">

        {/* ATTACHMENT PREVIEW */}

        {selectedFile && (
          <div className="attachmentPreview">

            <div className="attachmentFileIcon">
              <i
                className={
                  selectedFile.type.startsWith("image/")
                    ? "fa-solid fa-image"
                    : selectedFile.type === "application/pdf"
                    ? "fa-solid fa-file-pdf"
                    : "fa-solid fa-file"
                }
              ></i>
            </div>

            <div className="attachmentFileInfo">

              <strong>
                {selectedFile.name}
              </strong>

              <span>
                {(
                  selectedFile.size /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </span>

            </div>

            <button
              type="button"
              className="removeAttachment"
              onClick={removeSelectedFile}
              aria-label="Remove attachment"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

          </div>
        )}

        {/* MAIN COMPOSER */}

        <div className="inputBox sigmaComposer">

          {/* HIDDEN FILE INPUT */}

          <input
            ref={fileInputRef}
            type="file"
            accept="
              image/png,
              image/jpeg,
              image/webp,
              image/gif,
              application/pdf,
              application/vnd.openxmlformats-officedocument.wordprocessingml.document,
              text/plain,
              text/csv
            "
            onChange={handleFileSelect}
            className="hiddenFileInput"
          />

          {/* ATTACH */}

          <button
            type="button"
            className="composerIconButton"
            onClick={() =>
              fileInputRef.current?.click()
            }
            title="Attach image or document"
            aria-label="Attach image or document"
          >
            <i className="fa-solid fa-paperclip"></i>
          </button>


          {/* TEXT INPUT */}

          <input
            className="promptInput"
            placeholder={
              selectedFile
                ? "Ask something about this file..."
                : "Ask anything..."
            }
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


          {/* SEND */}

          <button
            type="button"
            className="composerSendButton"
            onClick={getReply}
            disabled={
              loading ||
              (!prompt.trim() && !selectedFile)
            }
            title="Send"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>

        </div>


        {/* HELPER TEXT */}

        <p className="info composerInfo">

          <i className="fa-solid fa-sparkles"></i>

          Attach images or documents and ask
          SigmaGPT to work with them.

        </p>

      </div>
    </div>
  );
}

export default ChatWindow;