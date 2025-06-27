import handleAsyncError from '../middleware/handleAsyncError.js';
import User from '../models/userModel.js';
import HandleError from '../utils/handleError.js';
import { sendToken } from '../utils/jwtToken.js';

export const registerUser = handleAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: "This is temporary public id",
            url: "This is temporary avatar url",
        },
    });
    
    sendToken(user, 201, res);
})

// Login User
export const loginUser = handleAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return next(new HandleError("Email or password cannot be empty", 400));
    }

    // Find user by email and check password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new HandleError("Invalid email or password", 401));
    }

    const isPasswordValid= await user.verifyPassword(password);
    if (!isPasswordValid) {
        return next(new HandleError("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
});

// Logout User
export const logout = handleAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});