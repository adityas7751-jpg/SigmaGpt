import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";

import User from "../models/User.js";

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================

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
        console.log(
            "Authentication error:",
            err
        );

        return res.status(401).json({
            error:
                "Invalid or expired token."
        });
    }
};


// ===============================
// CREATE SUBSCRIPTION
// ===============================

router.post(
    "/create-subscription",
    authenticate,
    async (req, res) => {

        try {

            if (
                !process.env.RAZORPAY_KEY_ID ||
                !process.env.RAZORPAY_KEY_SECRET ||
                !process.env.RAZORPAY_PLAN_ID
            ) {
                return res.status(500).json({
                    error:
                        "Razorpay is not configured."
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


            if (
                user.plan === "premium"
            ) {
                return res.status(400).json({
                    error:
                        "You are already a Premium user."
                });
            }


            const subscription =
                await razorpay.subscriptions.create({

                    plan_id:
                        process.env.RAZORPAY_PLAN_ID,

                    total_count: 12,

                    quantity: 1,

                    customer_notify: 1,

                    notes: {
                        userId:
                            user._id.toString(),

                        email:
                            user.email,

                        product:
                            "SigmaGPT Premium"
                    }
                });


            return res.json({

                subscriptionId:
                    subscription.id,

                keyId:
                    process.env.RAZORPAY_KEY_ID,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email
                }
            });

        } catch (err) {

            console.log(
                "Create subscription error:",
                err
            );

            return res.status(500).json({
                error:
                    "Unable to create Razorpay subscription."
            });
        }
    }
);


// ===============================
// VERIFY PAYMENT
// ===============================

router.post(
    "/verify-subscription",
    authenticate,
    async (req, res) => {

        try {

            const {
                razorpay_payment_id,
                razorpay_subscription_id,
                razorpay_signature
            } = req.body;


            if (
                !razorpay_payment_id ||
                !razorpay_subscription_id ||
                !razorpay_signature
            ) {
                return res.status(400).json({
                    error:
                        "Payment verification data is incomplete."
                });
            }


            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env.RAZORPAY_KEY_SECRET
                    )
                    .update(
                        razorpay_payment_id +
                        "|" +
                        razorpay_subscription_id
                    )
                    .digest("hex");


            if (
                generatedSignature !==
                razorpay_signature
            ) {
                return res.status(400).json({
                    error:
                        "Invalid payment signature."
                });
            }


            const subscription =
                await razorpay.subscriptions.fetch(
                    razorpay_subscription_id
                );


            if (
                subscription.status !== "active" &&
                subscription.status !== "authenticated"
            ) {
                return res.status(400).json({
                    error:
                        "Subscription is not active."
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


            user.plan =
                "premium";


            user.razorpaySubscriptionId =
                razorpay_subscription_id;


            user.premiumSince =
                new Date();


            await user.save();


            return res.json({

                message:
                    "Premium payment successful.",

                plan:
                    "premium",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    plan:
                        user.plan
                }
            });

        } catch (err) {

            console.log(
                "Verify subscription error:",
                err
            );

            return res.status(500).json({
                error:
                    "Unable to verify payment."
            });
        }
    }
);


// ===============================
// CANCEL SUBSCRIPTION
// ===============================

router.post(
    "/cancel-subscription",
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


            if (
                user.razorpaySubscriptionId
            ) {

                try {

                    await razorpay.subscriptions.cancel(
                        user.razorpaySubscriptionId
                    );

                } catch (razorpayError) {

                    console.log(
                        "Razorpay cancellation error:",
                        razorpayError
                    );
                }
            }


            user.plan =
                "free";


            user.razorpaySubscriptionId =
                null;


            user.premiumSince =
                null;


            await user.save();


            return res.json({

                message:
                    "Subscription cancelled and account moved to Free plan.",

                plan:
                    "free",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    plan:
                        user.plan
                }
            });

        } catch (err) {

            console.log(
                "Cancel subscription error:",
                err
            );

            return res.status(500).json({
                error:
                    "Unable to cancel subscription."
            });
        }
    }
);


export default router;