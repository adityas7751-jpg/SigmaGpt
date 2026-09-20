import "./Chat.css";

import React, {
    useContext,
    useState,
    useEffect
} from "react";

import { MyContext } from "./MyContext";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

import sigmaLogo from "./assets/sigmagpt-icon.png";


function Chat() {

    const {
        newChat,
        prevChats,
        reply,
        markdownEnabled,
        codeHighlightEnabled,
        setPrompt
    } = useContext(MyContext);


    const [latestReply, setLatestReply] = useState(null);


    // =========================================
    // TYPING EFFECT
    // =========================================

    useEffect(() => {

        if (
            reply === null ||
            reply === undefined ||
            !reply.trim()
        ) {
            setLatestReply(null);
            return;
        }


        const content = reply.trim();

        if (!content) {
            setLatestReply(null);
            return;
        }


        const words = content.split(" ");

        let index = 0;

        setLatestReply("");


        const interval = setInterval(() => {

            setLatestReply(
                words
                    .slice(0, index + 1)
                    .join(" ")
            );

            index++;


            if (index >= words.length) {

                clearInterval(interval);

                setLatestReply(content);

            }

        }, 35);


        return () => {
            clearInterval(interval);
        };

    }, [reply]);


    // =========================================
    // MARKDOWN MESSAGE
    // =========================================

    const renderMessage = (content) => {

        if (!content) {
            return null;
        }


        if (!markdownEnabled) {

            return (
                <p className="plainMessage">
                    {content}
                </p>
            );

        }


        if (codeHighlightEnabled) {

            return (
                <ReactMarkdown
                    rehypePlugins={[
                        rehypeHighlight
                    ]}
                >
                    {content}
                </ReactMarkdown>
            );

        }


        return (
            <ReactMarkdown>
                {content}
            </ReactMarkdown>
        );

    };


    // =========================================
    // START SCREEN SUGGESTIONS
    // =========================================

    const handleSuggestion = (text) => {

        if (setPrompt) {
            setPrompt(text);
        }

    };


    // =========================================
    // START SCREEN
    // =========================================

    const renderStartScreen = () => {

        return (

            <div className="sigmaWelcome">


                {/* =================================
                    BRAND
                ================================= */}

                <div className="sigmaBrand">

                    <div className="sigmaLogoWrapper">

                        <img
                            src={sigmaLogo}
                            alt="SigmaGPT"
                            className="sigmaWelcomeLogo"
                        />

                    </div>


                    <h1>

                        Welcome to

                        <span>
                            {" "}SigmaGPT
                        </span>

                    </h1>


                    <p className="sigmaTagline">

                        Think

                        <span>•</span>

                        Ask

                        <span>•</span>

                        Create

                    </p>

                </div>


                {/* =================================
                    FEATURE CARDS
                ================================= */}

                <div className="sigmaFeatures">


                    {/* =================================
                        GET ANSWERS
                    ================================= */}

                    <button
                        type="button"
                        className="sigmaFeatureCard"
                        onClick={() =>
                            handleSuggestion(
                                "Explain this topic in a simple way"
                            )
                        }
                    >

                        <div className="featureIcon answerIcon">
                            💡
                        </div>


                        <h3>
                            Get Answers
                        </h3>


                        <p>
                            Quick, accurate
                            <br />
                            information
                        </p>

                    </button>


                    {/* =================================
                        WRITE CODE
                    ================================= */}

                    <button
                        type="button"
                        className="sigmaFeatureCard"
                        onClick={() =>
                            handleSuggestion(
                                "Write a clean and optimized program for me"
                            )
                        }
                    >

                        <div className="featureIcon codeIcon">
                            &lt;/&gt;
                        </div>


                        <h3>
                            Write Code
                        </h3>


                        <p>
                            From simple scripts
                            <br />
                            to complex projects
                        </p>

                    </button>


                    {/* =================================
                        SUMMARIZE
                    ================================= */}

                    <button
                        type="button"
                        className="sigmaFeatureCard"
                        onClick={() =>
                            handleSuggestion(
                                "Summarize the following content clearly"
                            )
                        }
                    >

                        <div className="featureIcon summaryIcon">
                            ▤
                        </div>


                        <h3>
                            Summarize
                        </h3>


                        <p>
                            Turn long content
                            <br />
                            into clear insights
                        </p>

                    </button>


                    {/* =================================
                        BE CREATIVE
                    ================================= */}

                    <button
                        type="button"
                        className="sigmaFeatureCard"
                        onClick={() =>
                            handleSuggestion(
                                "Give me some creative ideas"
                            )
                        }
                    >

                        <div className="featureIcon creativeIcon">
                            ✦
                        </div>


                        <h3>
                            Be Creative
                        </h3>


                        <p>
                            Ideas, designs,
                            <br />
                            and more
                        </p>

                    </button>


                </div>

            </div>

        );

    };


    // =========================================
    // CHAT MESSAGE RENDERER
    // =========================================

    const renderChatMessages = () => {

        if (!prevChats || prevChats.length === 0) {
            return null;
        }


        /*
         * Remove accidental duplicate assistant
         * messages having exactly the same content.
         *
         * This keeps the UI clean if the same
         * response is received twice.
         */

        const cleanedChats = [];

        prevChats.forEach((chat) => {

            const previous =
                cleanedChats[
                    cleanedChats.length - 1
                ];


            if (
                chat.role === "assistant" &&
                previous?.role === "assistant" &&
                previous?.content?.trim() ===
                    chat.content?.trim()
            ) {
                return;
            }


            cleanedChats.push(chat);

        });


        return cleanedChats.map((chat, index) => {

            const isLast =
                index === cleanedChats.length - 1;


            // =================================
            // USER MESSAGE
            // =================================

            if (chat.role === "user") {

                return (

                    <div
                        className="userDiv"
                        key={`user-${index}`}
                    >

                        <p className="userMessage">
                            {chat.content}
                        </p>

                    </div>

                );

            }


            // =================================
            // ASSISTANT MESSAGE
            // =================================

            if (chat.role === "assistant") {

                /*
                 * Only show typing animation
                 * for the latest assistant reply.
                 */

                const isLatestAssistant =
                    isLast &&
                    reply &&
                    reply.trim() ===
                        chat.content?.trim();


                const content =
                    isLatestAssistant &&
                    latestReply !== null
                        ? latestReply
                        : chat.content;


                return (

                    <div
                        className="gptDiv"
                        key={`assistant-${index}`}
                    >

                        {renderMessage(content)}

                    </div>

                );

            }


            return null;

        });

    };


    // =========================================
    // MAIN
    // =========================================

    return (
        <>


            {/* =================================
                NEW CHAT / WELCOME SCREEN
            ================================= */}

            {newChat &&
                !prevChats?.length &&
                renderStartScreen()
            }


            {/* =================================
                CHAT AREA
            ================================= */}

            <div className="chats">

                {renderChatMessages()}

            </div>


        </>
    );

}


export default Chat;