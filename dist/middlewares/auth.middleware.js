"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminVerification = exports.authorizedUser = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwtSecretKey = process.env.jwt_secret_key;
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[0];
    if (!token) {
        return res.status(401).json({ isError: true, message: 'No token, authorization denied' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecretKey);
        const { userId } = decoded;
        // Check if the user exists
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ isError: true, message: 'Unauthorized' });
        }
        // Attach the user to the request object
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ isError: true, message: 'Invalid token', err });
    }
});
exports.verifyToken = verifyToken;
const authorizedUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        // Assuming the authenticated user's ID is available on req.user.id
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            return res.status(401).json({ isError: true, message: 'Unauthorized' });
        }
        // Fetch the user from the database
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ isError: true, message: 'Unauthorized' });
        }
        // Check if the user is either a "creator" or an "admin"
        if (user.userType !== 'creator' && user.userType !== 'admin') {
            return res.status(403).json({ isError: true, message: 'Unauthorized' });
        }
        // If the user is authorized, proceed to the next middleware or route handler
        next();
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Internal server error' });
    }
});
exports.authorizedUser = authorizedUser;
const adminVerification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        // Assuming the authenticated user's ID is available on req.user.id
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
        if (!userId) {
            return res.status(401).json({ isError: true, message: 'Unauthorized' });
        }
        // Fetch the user from the database
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return res.status(401).json({ isError: true, message: 'Unauthorized' });
        }
        // Check if the user is an "admin"
        if (user.userType !== 'admin') {
            return res.status(403).json({ isError: true, message: 'Unauthorized' });
        }
        // If the user is authorized, proceed to the next middleware or route handler
        next();
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Internal server error' });
    }
});
exports.adminVerification = adminVerification;
