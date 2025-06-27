import handleAsyncError from '../middleware/handleAsyncError.js';
import User from '../models/userModel.js';
import HandleError from '../utils/handleError.js';
import { sendToken } from '../utils/jwtToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

// Register User
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

    const isPasswordValid = await user.verifyPassword(password);
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

// Forgot Password
export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return next(new HandleError("User doesn't exist", 404));
    }
    let resetToken;
    try {
        resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

    } catch (error) {
        return next(new HandleError("Could not save reset token, Please try again later", 500));
    }
    const resetPasswordURL = `http://localhost/api/v1/reset/${resetToken}`;
    const message = `Use the following link to reset your password: ${resetPasswordURL}. \n\n This link will expire in 30 minutes.\n\n If you did not request this, please ignore this email.`;
    try {
        //send email
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            message,
        })
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new HandleError("Email could not be sent, please try again later", 500));
    }
});

// Reset Password
export const resetPassword = handleAsyncError(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(new HandleError("Reset password token is invalid or has expired", 400));
    }
    const {password, confirmPassword} = req.body;
    if (password !== confirmPassword) {
        return next(new HandleError("Passwords do not match", 400));
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user, 200, res);
});

// Get User Details
export const getUserDetails = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new HandleError("User not found", 404));
    }
    res.status(200).json({
        success: true,
        user,
    });
});

// Update Password
export const updatePassword = handleAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
        return next(new HandleError("User not found", 404));
    }
    const checkPasswordMatch = await user.verifyPassword(oldPassword);
    if (!checkPasswordMatch) {
        return next(new HandleError("Old password is incorrect", 400));
    }
    if (newPassword !== confirmPassword) {
        return next(new HandleError("New password and confirm password do not match", 400));
    }
    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
});

// Update User Profile
export const updateProfile = handleAsyncError(async (req, res, next) => {
    const { name, email } = req.body;
    const updateUserDetails = {
        name,
        email,
    };
    const user = await User.findByIdAndUpdate(req.user.id, updateUserDetails, {
        new: true,
        runValidators: true
    });
    if (!user) {
        return next(new HandleError("User not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user,
    });

});

// Admin: Getting User Details
export const getUsersList = handleAsyncError(async (req, res, next) => {
    const users = await User.find();
    if (!users || users.length === 0) {
        return next(new HandleError("No users found", 404));
    }
    res.status(200).json({
        success: true,
        users,
    });
});
