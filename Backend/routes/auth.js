import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";

const router = express.Router();

const googleClient = new OAuth2Client();


// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// ==========================================
// CREATE JWT TOKEN
// ==========================================

const createToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Name, email and password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                error: "User already exists."
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            plan: "free"
        });

        const token = createToken(user);

        return res.status(201).json({
            message: "Account created successfully.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (err) {
        console.log("Register error:", err);

        return res.status(500).json({
            error: "Server error while creating account."
        });
    }
});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        if (!user.password) {
            return res.status(401).json({
                error:
                    "This account uses Google login. Please continue with Google."
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        const token = createToken(user);

        return res.json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (err) {
        console.log("Login error:", err);

        return res.status(500).json({
            error: "Server error while logging in."
        });
    }
});


// ==========================================
// GOOGLE LOGIN
// ==========================================

router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                error: "Google credential is required."
            });
        }

        const googleClientId =
            process.env.GOOGLE_CLIENT_ID;

        if (!googleClientId) {
            return res.status(500).json({
                error:
                    "Google authentication is not configured on the server."
            });
        }

        const ticket =
            await googleClient.verifyIdToken({
                idToken: credential,
                audience: googleClientId
            });

        const payload =
            ticket.getPayload();

        if (!payload) {
            return res.status(401).json({
                error:
                    "Invalid Google account information."
            });
        }

        const googleId = payload.sub;

        const email =
            payload.email?.trim().toLowerCase();

        const name =
            payload.name ||
            payload.email?.split("@")[0] ||
            "Google User";

        const emailVerified =
            payload.email_verified;

        if (!googleId || !email) {
            return res.status(401).json({
                error:
                    "Google account information is incomplete."
            });
        }

        if (!emailVerified) {
            return res.status(401).json({
                error:
                    "Google email is not verified."
            });
        }

        let user = await User.findOne({
            googleId
        });

        if (!user) {
            user = await User.findOne({
                email
            });

            if (user) {
                user.googleId = googleId;

                if (!user.name) {
                    user.name = name;
                }

                await user.save();

            } else {
                user = await User.create({
                    name,
                    email,
                    googleId,
                    plan: "free"
                });
            }
        }

        const token = createToken(user);

        return res.json({
            message: "Google login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: user.plan
            }
        });

    } catch (err) {
        console.log(
            "Google authentication error:",
            err
        );

        return res.status(401).json({
            error:
                "Google authentication failed."
        });
    }
});


// ==========================================
// FORGOT PASSWORD - SEND OTP
// ==========================================

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: "Email is required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        console.log(
            "======================================"
        );

        console.log(
            "Forgot Password Request:"
        );

        console.log(
            "Email:",
            normalizedEmail
        );

        const user = await User.findOne({
            email: normalizedEmail
        });

        console.log(
            "User found:",
            Boolean(user)
        );

        if (!user) {
            console.log(
                "No account found for this email."
            );

            return res.status(404).json({
                error:
                    "No SigmaGPT account found with this email."
            });
        }

        console.log(
            "Password account:",
            Boolean(user.password)
        );

        if (!user.password) {
            console.log(
                "User is a Google-only account."
            );

            return res.status(400).json({
                error:
                    "This account uses Google login. Please continue with Google."
            });
        }

        const otp =
            crypto.randomInt(
                100000,
                1000000
            ).toString();

        console.log(
            "OTP generated successfully."
        );

        const hashedOtp =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

        user.resetOtp = hashedOtp;

        user.resetOtpExpiry =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        user.resetOtpAttempts = 0;

        await user.save();

        console.log(
            "OTP saved to MongoDB."
        );

        const info =
            await emailTransporter.sendMail({
                from:
                    `"SigmaGPT" <${process.env.SMTP_USER}>`,

                to: user.email,

                subject:
                    "SigmaGPT Password Reset OTP",

                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 520px;
                        margin: 40px auto;
                        padding: 32px;
                        background: #171717;
                        color: #ffffff;
                        border-radius: 16px;
                        border: 1px solid #333333;
                    ">

                        <div style="
                            text-align: center;
                            margin-bottom: 25px;
                        ">

                            <div style="
                                display: inline-block;
                                width: 55px;
                                height: 55px;
                                line-height: 55px;
                                border-radius: 14px;
                                background: #8b35f5;
                                font-size: 30px;
                                font-weight: bold;
                            ">
                                Σ
                            </div>

                        </div>

                        <h2 style="
                            text-align: center;
                            margin-bottom: 10px;
                        ">
                            Reset your SigmaGPT password
                        </h2>

                        <p style="
                            color: #bbbbbb;
                            text-align: center;
                            line-height: 1.6;
                        ">
                            We received a request to
                            reset your SigmaGPT password.
                        </p>

                        <p style="
                            text-align: center;
                            color: #bbbbbb;
                            margin-top: 25px;
                        ">
                            Your verification code is:
                        </p>

                        <div style="
                            font-size: 34px;
                            font-weight: bold;
                            letter-spacing: 10px;
                            background: #252525;
                            padding: 20px;
                            text-align: center;
                            border-radius: 12px;
                            margin: 20px 0;
                            color: #ffffff;
                        ">
                            ${otp}
                        </div>

                        <p style="
                            text-align: center;
                            color: #aaaaaa;
                        ">
                            This OTP is valid for
                            <strong style="color:#ffffff;">
                                10 minutes
                            </strong>.
                        </p>

                        <hr style="
                            border: none;
                            border-top: 1px solid #333333;
                            margin: 25px 0;
                        ">

                        <p style="
                            color: #777777;
                            font-size: 12px;
                            text-align: center;
                            line-height: 1.5;
                        ">
                            If you did not request a password
                            reset, you can safely ignore this email.
                        </p>

                        <p style="
                            color: #666666;
                            font-size: 11px;
                            text-align: center;
                            margin-top: 20px;
                        ">
                            SigmaGPT
                        </p>

                    </div>
                `
            });

        console.log(
            "OTP email sent successfully."
        );

        console.log(
            "Message ID:",
            info.messageId
        );

        console.log(
            "======================================"
        );

        return res.json({
            message:
                "OTP sent successfully."
        });

    } catch (err) {
        console.log(
            "======================================"
        );

        console.log(
            "Forgot password error:"
        );

        console.log(err);

        console.log(
            "======================================"
        );

        return res.status(500).json({
            error:
                "Unable to send password reset OTP."
        });
    }
});


// ==========================================
// VERIFY OTP
// ==========================================

router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                error:
                    "Email and OTP are required."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(400).json({
                error: "Invalid OTP."
            });
        }

        if (
            !user.resetOtp ||
            !user.resetOtpExpiry
        ) {
            return res.status(400).json({
                error:
                    "OTP not found. Please request a new OTP."
            });
        }

        if (
            user.resetOtpExpiry.getTime() <
            Date.now()
        ) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            user.resetOtpAttempts = 0;

            await user.save();

            return res.status(400).json({
                error:
                    "OTP has expired. Please request a new OTP."
            });
        }

        if (
            user.resetOtpAttempts >= 5
        ) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            user.resetOtpAttempts = 0;

            await user.save();

            return res.status(429).json({
                error:
                    "Too many attempts. Please request a new OTP."
            });
        }

        const hashedOtp =
            crypto
                .createHash("sha256")
                .update(otp.trim())
                .digest("hex");

        if (
            hashedOtp !== user.resetOtp
        ) {
            user.resetOtpAttempts += 1;

            await user.save();

            return res.status(400).json({
                error: "Invalid OTP."
            });
        }

        return res.json({
            message:
                "OTP verified successfully.",
            verified: true
        });

    } catch (err) {
        console.log(
            "Verify OTP error:",
            err
        );

        return res.status(500).json({
            error:
                "Server error while verifying OTP."
        });
    }
});


// ==========================================
// RESET PASSWORD
// ==========================================

router.post("/reset-password", async (req, res) => {
    try {
        const {
            email,
            otp,
            newPassword
        } = req.body;

        if (
            !email ||
            !otp ||
            !newPassword
        ) {
            return res.status(400).json({
                error:
                    "Email, OTP and new password are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error:
                    "Password must be at least 6 characters."
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(400).json({
                error:
                    "Invalid reset request."
            });
        }

        if (
            !user.resetOtp ||
            !user.resetOtpExpiry
        ) {
            return res.status(400).json({
                error:
                    "OTP not found. Please request a new OTP."
            });
        }

        if (
            user.resetOtpExpiry.getTime() <
            Date.now()
        ) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            user.resetOtpAttempts = 0;

            await user.save();

            return res.status(400).json({
                error:
                    "OTP has expired. Please request a new OTP."
            });
        }

        if (
            user.resetOtpAttempts >= 5
        ) {
            return res.status(429).json({
                error:
                    "Too many attempts. Please request a new OTP."
            });
        }

        const hashedOtp =
            crypto
                .createHash("sha256")
                .update(otp.trim())
                .digest("hex");

        if (
            hashedOtp !== user.resetOtp
        ) {
            user.resetOtpAttempts += 1;

            await user.save();

            return res.status(400).json({
                error: "Invalid OTP."
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        user.password =
            hashedPassword;

        user.resetOtp = null;
        user.resetOtpExpiry = null;
        user.resetOtpAttempts = 0;

        await user.save();

        return res.json({
            message:
                "Password reset successfully."
        });

    } catch (err) {
        console.log(
            "Reset password error:",
            err
        );

        return res.status(500).json({
            error:
                "Server error while resetting password."
        });
    }
});


// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const authenticate = (req, res, next) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error:
                    "Authorization token required."
            });
        }

        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null;

        if (!token) {
            return res.status(401).json({
                error:
                    "Invalid authorization format."
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.userId =
            decoded.userId;

        next();

    } catch (err) {
        return res.status(401).json({
            error:
                "Invalid or expired token."
        });
    }
};


// ==========================================
// GET CURRENT USER
// ==========================================

router.get(
    "/me",
    authenticate,
    async (req, res) => {
        try {
            const user =
                await User.findById(
                    req.userId
                ).select("-password");

            if (!user) {
                return res.status(404).json({
                    error:
                        "User not found."
                });
            }

            return res.json({
                user
            });

        } catch (err) {
            console.log(
                "Get user error:",
                err
            );

            return res.status(500).json({
                error:
                    "Server error."
            });
        }
    }
);


// ==========================================
// UPDATE PROFILE
// ==========================================

router.put(
    "/profile",
    authenticate,
    async (req, res) => {
        try {
            const { name } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    error:
                        "Name is required."
                });
            }

            if (name.trim().length < 2) {
                return res.status(400).json({
                    error:
                        "Name must be at least 2 characters."
                });
            }

            const user =
                await User.findById(
                    req.userId
                );

            if (!user) {
                return res.status(404).json({
                    error:
                        "User not found."
                });
            }

            user.name =
                name.trim();

            await user.save();

            return res.json({
                message:
                    "Profile updated successfully.",

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    plan: user.plan
                }
            });

        } catch (err) {
            console.log(
                "Profile update error:",
                err
            );

            return res.status(500).json({
                error:
                    "Unable to update profile."
            });
        }
    }
);


// ==========================================
// UPGRADE TO PREMIUM
// ==========================================

router.post(
    "/upgrade",
    authenticate,
    async (req, res) => {
        try {
            const user =
                await User.findById(
                    req.userId
                );

            if (!user) {
                return res.status(404).json({
                    error:
                        "User not found."
                });
            }

            if (user.plan === "premium") {
                return res.json({
                    message:
                        "You are already a premium user.",
                    plan: "premium",
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        plan: user.plan
                    }
                });
            }

            user.plan = "premium";

            await user.save();

            return res.json({
                message:
                    "Successfully upgraded to Premium.",
                plan: "premium",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    plan: user.plan
                }
            });

        } catch (err) {
            console.log(
                "Premium upgrade error:",
                err
            );

            return res.status(500).json({
                error:
                    "Unable to upgrade to Premium."
            });
        }
    }
);


// ==========================================
// DOWNGRADE TO FREE
// ==========================================

router.post(
    "/downgrade",
    authenticate,
    async (req, res) => {
        try {
            const user =
                await User.findById(
                    req.userId
                );

            if (!user) {
                return res.status(404).json({
                    error:
                        "User not found."
                });
            }

            if (user.plan === "free") {
                return res.json({
                    message:
                        "You are already on the Free plan.",
                    plan: "free",
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        plan: user.plan
                    }
                });
            }

            user.plan = "free";

            await user.save();

            return res.json({
                message:
                    "Successfully downgraded to Free plan.",
                plan: "free",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    plan: user.plan
                }
            });

        } catch (err) {
            console.log(
                "Downgrade error:",
                err
            );

            return res.status(500).json({
                error:
                    "Unable to downgrade to Free plan."
            });
        }
    }
);


export default router;