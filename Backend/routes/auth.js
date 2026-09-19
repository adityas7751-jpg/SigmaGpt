import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();


// =====================================
// CREATE JWT
// =====================================

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


// =====================================
// REGISTER
// =====================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


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


        const existingUser =
            await User.findOne({
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


        res.status(201).json({

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

        res.status(500).json({
            error: "Server error while creating account."
        });

    }

});


// =====================================
// LOGIN
// =====================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                error: "Email and password are required."
            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.status(401).json({
                error: "Invalid email or password."
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


        res.json({

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

        res.status(500).json({
            error: "Server error while logging in."
        });

    }

});


// =====================================
// AUTH MIDDLEWARE
// =====================================

const authenticate = (req, res, next) => {

    try {

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({
                error: "Authorization token required."
            });

        }


        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null;


        if (!token) {

            return res.status(401).json({
                error: "Invalid authorization format."
            });

        }


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        req.userId = decoded.userId;

        next();


    } catch (err) {

        return res.status(401).json({
            error: "Invalid or expired token."
        });

    }

};


// =====================================
// CURRENT USER
// =====================================

router.get("/me", authenticate, async (req, res) => {

    try {

        const user =
            await User.findById(
                req.userId
            ).select("-password");


        if (!user) {

            return res.status(404).json({
                error: "User not found."
            });

        }


        res.json({
            user
        });


    } catch (err) {

        console.log("Get user error:", err);

        res.status(500).json({
            error: "Server error."
        });

    }

});


export default router;