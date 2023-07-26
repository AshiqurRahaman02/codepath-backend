import express, { Request, Response } from "express";
import UserModel, { IUser } from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyToken } from "../middlewares/auth.middleware";

dotenv.config();
const jwtSecretKey: string = process.env.jwt_secret_key!;

const userRouter = express.Router();

// Get user
userRouter.get("/get/:id", async (req: Request, res: Response) => {
	const userId = req.params.id;

	try {
		const user = await UserModel.findById(userId);

		if (!user) {
			return res
				.status(404)
				.json({ isError: true, message: "User not found" });
		}

		res.status(200).json({ isError: false, user });
	} catch (error) {
		res.status(500).json({ isError: true, message: error });
	}
});

// Register route
userRouter.post("/register", async (req: Request, res: Response) => {
	const { email, password, name } = req.body;
	try {
		let user = await UserModel.findOne({ email });
		if (user) {
			return res.status(404).json({
				isError: true,
				message: "Email already used in this website.",
			});
		}
		bcrypt.hash(password, 5, async (err, hash) => {
			if (err) throw err;
			const user = new UserModel({ email, password: hash, name });
			console.log(user);
			await user.save();
			console.log("User registered successfully");
			res.status(201).json({
				isError: false,
				message: "User registered successfully",
			});
		});
	} catch (error: any) {
		res.status(404).json({ isError: true, message: error.message });
	}
});

// Login route
userRouter.post("/login", async (req: Request, res: Response) => {
	const { email, password } = req.body;
	try {
		let user: IUser | null = await UserModel.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ isError: true, message: "User not found" });
		}
		bcrypt.compare(password, user.password, (err, result) => {
			if (result) {
				res.status(200).json({
					isError: false,
					message: "Welcome Back to our website",
					token: jwt.sign({ userId: user?._id }, jwtSecretKey),
					user,
				});
			} else {
				res.status(401).json({
					isError: true,
					message: "Invalid password",
				});
			}
		});
	} catch (error: any) {
		console.log(error);
		res.status(404).json({isError: true, message: error.message });
	}
});

// Change password route
userRouter.post("/change_password", verifyToken, async (req: Request, res: Response) => {
	const { email, oldPassword, newPassword } = req.body;
	try {
		let user: IUser | null = await UserModel.findOne({ email });
		if (!user) {
			return res.status(404).json({isError: true, message: "User not found" });
		}

		bcrypt.compare(oldPassword, user.password, async (err, result) => {
			if (err) {
				return res.status(500).json({isError: true, message: "Internal server error" });
			}

			if (result) {
				try {
					if (user) {
						const hashedNewPassword = await bcrypt.hash(newPassword, 5);
						user.password = hashedNewPassword;
						await user.save();
						res.status(200).json({
              isError: false,
							message: "Password updated successfully",
						});
					}else{
            return res.status(404).json({isError: true, message: "User not found" });
          }
				} catch (error) {
					console.log(error);
					res.status(500).json({isError: true, message: "Internal server error" });
				}
			} else {
				res.status(401).json({isError: true, message: "Invalid old password" });
			}
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({isError: true, message: "Internal server error" });
	}
});

// Forgot password route
userRouter.post("/forgot_password", async (req: Request, res: Response) => {
	const { email } = req.body;
	try {
		let user: IUser | null = await UserModel.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ isError: true, message: "Email not found" });
		}

		const temporaryPassword = Math.random().toString(36).slice(-8);

		const hashedTemporaryPassword = await bcrypt.hash(temporaryPassword, 5);
		user.password = hashedTemporaryPassword;
		await user.save();

		res.status(200).json({
			isError: false,
			message: "Your password has been changed successfully",
			password: temporaryPassword,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ isError: true, message: "Internal server error" });
	}
});

// Logout route (protected with verifyToken middleware)
userRouter.post('/logout', verifyToken, async(req: Request, res: Response) => {
  try {
		res.status(200).json({isError: false, message: "User logedout successfully" });
	} catch (error: any) {
		res.status(404).json({isError: true, message: error.message });
	}
});

// Delete route
userRouter.delete('/delete/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ isError: true, message: 'User not found' });
    }

    // Compare the provided password with the user's actual password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ isError: true, message: 'Invalid password' });
    }

    // If the password is correct, proceed with user deletion
    await UserModel.findByIdAndDelete(userId);

    res.status(200).json({ isError: false, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: error.message });
  }
});

export default userRouter ;
