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
// routes/comments.routes.ts
const express_1 = __importDefault(require("express"));
const comment_model_1 = __importDefault(require("../models/comment.model"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const commentRouter = express_1.default.Router();
// Create a new comment
commentRouter.post('/create', auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, userName, comment, questionID } = req.body;
    try {
        const newComment = yield comment_model_1.default.create({
            userID,
            userName,
            comment,
            questionID,
        });
        res.status(201).json({ isError: false, comment: newComment });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error creating comment', error: error.message });
    }
}));
// Get all comments for a specific question
commentRouter.get('/get/:questionID', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const questionID = req.params.questionID;
    try {
        const comments = yield comment_model_1.default.find({ questionID });
        res.status(200).json({ isError: false, comments });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error fetching comments', error: error.message });
    }
}));
// Update a comment by ID
commentRouter.put('/update/:id', auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentID = req.params.id;
    const { comment } = req.body;
    try {
        const updatedComment = yield comment_model_1.default.findByIdAndUpdate(commentID, { comment }, { new: true });
        if (!updatedComment) {
            return res.status(404).json({ isError: true, message: 'Comment not found' });
        }
        res.status(200).json({ isError: false, comment: updatedComment });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error updating comment', error: error.message });
    }
}));
// Delete a comment by ID
commentRouter.delete('/delete/:id', auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const commentID = req.params.id;
    try {
        const deletedComment = yield comment_model_1.default.findByIdAndDelete(commentID);
        if (!deletedComment) {
            return res.status(404).json({ isError: true, message: 'Comment not found' });
        }
        res.status(200).json({ isError: false, message: 'Comment deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error deleting comment', error: error.message });
    }
}));
exports.default = commentRouter;
