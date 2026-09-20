import "./Auth.css";
import { API_URL } from "./config.js";
import { useState } from "react";

import {
    GoogleLogin,
    GoogleOAuthProvider
} from "@react-oauth/google";


function Auth({ onLogin }) {

    const [mode, setMode] = useState("login");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // ==========================================
    // CLEAR MESSAGES
    // ==========================================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };


    // ==========================================
    // LOGIN / REGISTER
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        clearMessages();

        if (
            !email ||
            !password ||
            (mode === "register" && !name)
        ) {

            setError(
                "Please fill all required fields."
            );

            return;
        }

        setLoading(true);

        try {

            const endpoint =
                mode === "login"
                    ? `${API_URL}/api/auth/login`
                    : `${API_URL}/api/auth/register`;


            const body =
                mode === "login"
                    ? {
                        email,
                        password
                    }
                    : {
                        name,
                        email,
                        password
                    };


            const response = await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Something went wrong."
                );
            }


            // Save token

            localStorage.setItem(
                "sigmagpt-token",
                data.token
            );


            // Save user

            localStorage.setItem(
                "sigmagpt-user",
                JSON.stringify(data.user)
            );


            if (onLogin) {
                onLogin(data.user);
            }

        } catch (err) {

            console.log(
                "Authentication error:",
                err
            );

            setError(
                err.message ||
                "Authentication failed."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // GOOGLE LOGIN
    // ==========================================

    const handleGoogleSuccess = async (
        credentialResponse
    ) => {

        clearMessages();

        setLoading(true);

        try {

            if (!credentialResponse?.credential) {

                throw new Error(
                    "Google credential was not received."
                );
            }


            const response = await fetch(
                `${API_URL}/api/auth/google`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        credential:
                            credentialResponse.credential
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Google login failed."
                );
            }


            localStorage.setItem(
                "sigmagpt-token",
                data.token
            );


            localStorage.setItem(
                "sigmagpt-user",
                JSON.stringify(data.user)
            );


            if (onLogin) {
                onLogin(data.user);
            }

        } catch (err) {

            console.log(
                "Google authentication error:",
                err
            );

            setError(
                err.message ||
                "Google login failed."
            );

        } finally {

            setLoading(false);

        }
    };


    const handleGoogleError = () => {

        setError(
            "Google login was cancelled or failed."
        );

    };


    // ==========================================
    // SEND OTP
    // ==========================================

    const handleForgotPassword = async () => {

        clearMessages();

        if (!email) {

            setError(
                "Please enter your email address."
            );

            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/api/auth/forgot-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to send OTP."
                );
            }


            setSuccess(
                "If an account exists with this email, an OTP has been sent."
            );


            setMode("otp");

        } catch (err) {

            setError(
                err.message ||
                "Unable to send OTP."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // VERIFY OTP
    // ==========================================

    const handleVerifyOtp = async () => {

        clearMessages();

        if (!otp || otp.length !== 6) {

            setError(
                "Please enter the 6-digit OTP."
            );

            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/api/auth/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        otp
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Invalid OTP."
                );
            }


            setSuccess(
                "OTP verified successfully."
            );


            setMode("reset");

        } catch (err) {

            setError(
                err.message ||
                "OTP verification failed."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // RESET PASSWORD
    // ==========================================

    const handleResetPassword = async () => {

        clearMessages();

        if (!password || !confirmPassword) {

            setError(
                "Please enter both passwords."
            );

            return;
        }


        if (password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;
        }


        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        setLoading(true);

        try {

            const response = await fetch(
                `${API_URL}/api/auth/reset-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        otp,
                        newPassword: password
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Password reset failed."
                );
            }


            setSuccess(
                "Password reset successfully. You can now login."
            );


            setPassword("");
            setConfirmPassword("");
            setOtp("");


            setTimeout(() => {

                setMode("login");

                setSuccess("");

            }, 1500);

        } catch (err) {

            setError(
                err.message ||
                "Password reset failed."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // LOGIN SCREEN
    // ==========================================

    const renderLogin = () => (

        <>

            <h1>
                Welcome back
            </h1>


            <p className="authSubtitle">
                Login to continue using SigmaGPT
            </p>


            <form onSubmit={handleSubmit}>

                <div className="authField">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                </div>


                <div className="authField">

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                </div>


                <div className="forgotPasswordRow">

                    <button
                        type="button"
                        onClick={() => {

                            clearMessages();

                            setPassword("");

                            setMode("forgot");

                        }}
                    >
                        Forgot Password?
                    </button>

                </div>


                {error && (

                    <div className="authError">
                        {error}
                    </div>

                )}


                {success && (

                    <div className="authSuccess">
                        {success}
                    </div>

                )}


                <button
                    type="submit"
                    className="authButton"
                    disabled={loading}
                >

                    {loading
                        ? "Please wait..."
                        : "Login"}

                </button>

            </form>


            <div className="authDivider">

                <span></span>

                <p>OR</p>

                <span></span>

            </div>


            <div className="googleLoginWrapper">

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                />

            </div>


            <div className="authSwitch">

                Don't have an account?

                <button
                    type="button"
                    onClick={() => {

                        clearMessages();

                        setMode("register");

                    }}
                >
                    Create account
                </button>

            </div>

        </>

    );


    // ==========================================
    // REGISTER SCREEN
    // ==========================================

    const renderRegister = () => (

        <>

            <h1>
                Create your account
            </h1>


            <p className="authSubtitle">
                Create your SigmaGPT account
            </p>


            <form onSubmit={handleSubmit}>

                <div className="authField">

                    <label>
                        Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                    />

                </div>


                <div className="authField">

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                </div>


                <div className="authField">

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                </div>


                {error && (

                    <div className="authError">
                        {error}
                    </div>

                )}


                <button
                    type="submit"
                    className="authButton"
                    disabled={loading}
                >

                    {loading
                        ? "Please wait..."
                        : "Create Account"}

                </button>

            </form>


            <div className="authDivider">

                <span></span>

                <p>OR</p>

                <span></span>

            </div>


            <div className="googleLoginWrapper">

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                />

            </div>


            <div className="authSwitch">

                Already have an account?

                <button
                    type="button"
                    onClick={() => {

                        clearMessages();

                        setMode("login");

                    }}
                >
                    Login
                </button>

            </div>

        </>

    );


    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    const renderForgot = () => (

        <>

            <h1>
                Forgot Password?
            </h1>


            <p className="authSubtitle">
                Enter your email and we'll send you
                a verification OTP.
            </p>


            <div className="authField">

                <label>
                    Email
                </label>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

            </div>


            {error && (

                <div className="authError">
                    {error}
                </div>

            )}


            {success && (

                <div className="authSuccess">
                    {success}
                </div>

            )}


            <button
                type="button"
                className="authButton"
                onClick={handleForgotPassword}
                disabled={loading}
            >

                {loading
                    ? "Sending OTP..."
                    : "Send OTP"}

            </button>


            <div className="authBack">

                <button
                    type="button"
                    onClick={() => {

                        clearMessages();

                        setMode("login");

                    }}
                >
                    ← Back to Login
                </button>

            </div>

        </>

    );


    // ==========================================
    // OTP
    // ==========================================

    const renderOtp = () => (

        <>

            <h1>
                Verify OTP
            </h1>


            <p className="authSubtitle">
                Enter the 6-digit OTP sent to your
                email.
            </p>


            <div className="authField">

                <label>
                    Verification Code
                </label>

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                        setOtp(
                            e.target.value.replace(
                                /\D/g,
                                ""
                            )
                        )
                    }
                />

            </div>


            {error && (

                <div className="authError">
                    {error}
                </div>

            )}


            {success && (

                <div className="authSuccess">
                    {success}
                </div>

            )}


            <button
                type="button"
                className="authButton"
                onClick={handleVerifyOtp}
                disabled={loading}
            >

                {loading
                    ? "Verifying..."
                    : "Verify OTP"}

            </button>


            <div className="authBack">

                <button
                    type="button"
                    onClick={() => {

                        clearMessages();

                        setMode("forgot");

                    }}
                >
                    ← Change Email
                </button>

            </div>

        </>

    );


    // ==========================================
    // RESET PASSWORD
    // ==========================================

    const renderReset = () => (

        <>

            <h1>
                New Password
            </h1>


            <p className="authSubtitle">
                Create a new password for your
                SigmaGPT account.
            </p>


            <div className="authField">

                <label>
                    New Password
                </label>

                <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

            </div>


            <div className="authField">

                <label>
                    Confirm Password
                </label>

                <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                        setConfirmPassword(
                            e.target.value
                        )
                    }
                />

            </div>


            {error && (

                <div className="authError">
                    {error}
                </div>

            )}


            {success && (

                <div className="authSuccess">
                    {success}
                </div>

            )}


            <button
                type="button"
                className="authButton"
                onClick={handleResetPassword}
                disabled={loading}
            >

                {loading
                    ? "Resetting..."
                    : "Reset Password"}

            </button>

        </>

    );


    // ==========================================
    // MAIN AUTH UI
    // ==========================================

    return (

        <GoogleOAuthProvider
            clientId={
                import.meta.env
                    .VITE_GOOGLE_CLIENT_ID
            }
        >

            <div className="authPage">

                <div className="authCard">

                    <div className="authLogo">
                        Σ
                    </div>


                    {mode === "login" &&
                        renderLogin()}


                    {mode === "register" &&
                        renderRegister()}


                    {mode === "forgot" &&
                        renderForgot()}


                    {mode === "otp" &&
                        renderOtp()}


                    {mode === "reset" &&
                        renderReset()}


                    <div className="authFooter">

                        <span>
                            Powered by
                        </span>

                        <strong>
                            SigmaGPT
                        </strong>

                    </div>

                </div>

            </div>

        </GoogleOAuthProvider>

    );
}


export default Auth;