import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import UserModel, { IUser } from '../models/user.model';
import dotenv from "dotenv";

dotenv.config();

const jwtSecretKey: string = process.env.jwt_secret_key!;

// Extend the Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[0];

  if (!token) {
    return res.status(401).json({isError: true, message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecretKey) as JwtPayload;
    const { userId } = decoded;

    // Check if the user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(401).json({isError: true, message: 'Unauthorized' });
    }

    // Attach the user to the request object
    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({isError: true, message: 'Invalid token', err });
  }
};



export const authorizedUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming the authenticated user's ID is available on req.user.id
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch the user from the database
    const user: IUser | null = await UserModel.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the user is either a "creator" or an "admin"
    if (user.userType !== 'creator' && user.userType !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // If the user is authorized, proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming the authenticated user's ID is available on req.user.id
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch the user from the database
    const user: IUser | null = await UserModel.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the user is an "admin"
    if (user.userType !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // If the user is authorized, proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};