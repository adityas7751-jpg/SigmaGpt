import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: false
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true
        },

        plan: {
            type: String,
            enum: ["free", "premium"],
            default: "free"
        },

        razorpaySubscriptionId: {
            type: String,
            default: null
        },

        premiumSince: {
            type: Date,
            default: null
        },

        resetOtp: {
            type: String,
            default: null
        },

        resetOtpExpiry: {
            type: Date,
            default: null
        },

        resetOtpAttempts: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;