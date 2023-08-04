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
const express_1 = __importDefault(require("express"));
const answer_model_1 = __importDefault(require("../models/answer.model"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const answerRouter = express_1.default.Router();
// Create a new answer
answerRouter.post('/create', auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, userName, answer, questionID } = req.body;
    try {
        const newAnswer = yield answer_model_1.default.create({
            userID,
            userName,
            answer,
            questionID,
        });
        res.status(201).json({ isError: false, message: 'Answer posted successfully', answer: newAnswer });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error creating answer', error: error.message });
    }
}));
// Get all answer for a specific question
answerRouter.get('/get/:questionID', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const questionID = req.params.questionID;
    try {
        const answers = yield answer_model_1.default.find({ questionID });
        res.status(200).json({ isError: false, answers });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error fetching answers', error: error.message });
    }
}));
// Update a answer by ID
answerRouter.put('/update/:id', auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const answerID = req.params.id;
    const { answer } = req.body;
    try {
        const updatedAnswer = yield answer_model_1.default.findByIdAndUpdate(answerID, { answer }, { new: true });
        if (!updatedAnswer) {
            return res.status(404).json({ isError: true, message: 'Answer not found' });
        }
        res.status(200).json({ isError: false, answer: updatedAnswer });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error updating answer', error: error.message });
    }
}));
// Delete a answer by ID
answerRouter.delete('/delete/:id', auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const answerID = req.params.id;
    try {
        const deletedAnswer = yield answer_model_1.default.findByIdAndDelete(answerID);
        if (!deletedAnswer) {
            return res.status(404).json({ isError: true, message: 'Answer not found' });
        }
        res.status(200).json({ isError: false, message: 'Answer deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: 'Error deleting comment', error: error.message });
    }
}));
exports.default = answerRouter;
