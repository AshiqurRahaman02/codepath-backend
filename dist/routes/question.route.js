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
const questions_model_1 = __importDefault(require("../models/questions.model"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const questionRouter = express_1.default.Router();
// Add a new question
questionRouter.post("/add", auth_middleware_1.verifyToken, auth_middleware_1.authorizedUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { question, answer, category, level, creatorID, creatorName } = req.body;
    try {
        const newQuestion = new questions_model_1.default({
            question,
            answer,
            level,
            category,
            creatorID,
            creatorName,
        });
        const savedQuestion = yield newQuestion.save();
        res.status(201).json({
            isError: false,
            message: "Question added successfully",
            question: savedQuestion,
        });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Failed to add question",
            error: error.message,
        });
    }
}));
// Get all questions
questionRouter.get("/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questions = yield questions_model_1.default.find();
        res.status(200).json({ isError: false, questions });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Failed to retrieve questions",
            error: error.message,
        });
    }
}));
// Search questions by input text
questionRouter.get("/search/:searchTerm", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.params.searchTerm.toLowerCase();
        // Search for questions that include the search term in the question field (case-insensitive)
        const questions = yield questions_model_1.default.find({
            question: { $regex: searchTerm, $options: "i" },
        });
        if (questions.length === 0) {
            return res
                .status(404)
                .json({ isError: true, message: "No matching questions found" });
        }
        res.status(200).json({ isError: false, questions });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: error.message });
    }
}));
// get by categories
questionRouter.get("/get/byCategories", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = req.query.categories;
    try {
        let questions;
        if (categories) {
            const categoryArray = Array.isArray(categories)
                ? categories
                : [categories];
            // Convert the category names to regular expressions for case-insensitive search
            const regexArray = categoryArray.map((category) => new RegExp(category, "i"));
            questions = yield questions_model_1.default.find({
                category: { $in: regexArray },
            });
        }
        else {
            questions = yield questions_model_1.default.find();
        }
        res.status(200).json({ isError: false, questions });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Error fetching questions",
            error: error.message,
        });
    }
}));
// get questions by levels
questionRouter.get("/get/byLevels", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const levels = req.query.levels;
    try {
        let query = {};
        if (levels && Array.isArray(levels)) {
            query = { level: { $in: levels } };
        }
        // Fetch questions based on the query
        const questions = yield questions_model_1.default.find(query);
        if (questions.length === 0) {
            return res
                .status(404)
                .json({ isError: true, message: "No questions found" });
        }
        res.status(200).json({ isError: false, questions });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Error fetching questions",
            error: error.message,
        });
    }
}));
// get a specific question by ID
questionRouter.get("/getById/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const questionId = req.params.id;
    try {
        const question = yield questions_model_1.default.findById(questionId);
        if (!question) {
            return res
                .status(404)
                .json({ isError: true, message: "Question not found" });
        }
        res.status(200).json({ isError: false, question });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Failed to retrieve the question",
            error: error.message,
        });
    }
}));
// get a random question
questionRouter.get("/random", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { categories } = req.body;
    try {
        let query = {}; // An empty query to fetch all questions
        if (categories && Array.isArray(categories)) {
            query = { category: { $in: categories } }; // Fetch questions from specified categories
        }
        // Count the total number of questions that match the query
        const totalQuestionsCount = yield questions_model_1.default.countDocuments(query);
        if (totalQuestionsCount === 0) {
            return res
                .status(404)
                .json({ isError: true, message: "No questions found" });
        }
        // Generate a random index to fetch a random question
        const randomIndex = Math.floor(Math.random() * totalQuestionsCount);
        // Fetch a single random question using the random index
        const randomQuestion = yield questions_model_1.default.findOne(query).skip(randomIndex);
        if (!randomQuestion) {
            return res
                .status(404)
                .json({ isError: true, message: "Random question not found" });
        }
        res.status(200).json({ isError: false, randomQuestion });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Error fetching a random question",
            error: error.message,
        });
    }
}));
// Update a question by ID
questionRouter.put("/update/:id", auth_middleware_1.verifyToken, auth_middleware_1.authorizedUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const questionId = req.params.id;
    const { question, answer, category } = req.body;
    try {
        const updatedQuestion = yield questions_model_1.default.findByIdAndUpdate(questionId, { question, answer, category }, { new: true });
        if (!updatedQuestion) {
            return res
                .status(404)
                .json({ isError: true, message: "Question not found" });
        }
        res.status(200).json({
            isError: false,
            message: "Question updated successfully",
            question: updatedQuestion,
        });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Failed to update the question",
            error: error.message,
        });
    }
}));
// update like
questionRouter.put("/update/like/:questionId", auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const questionId = req.params.questionId;
    const { action } = req.body;
    try {
        const question = yield questions_model_1.default.findById(questionId);
        if (!question) {
            return res
                .status(404)
                .json({ isError: true, message: "questionId not found" });
        }
        if (action === "increment") {
            question.likes++;
        }
        else if (action === "decrement") {
            question.likes--;
        }
        else {
            return res
                .status(400)
                .json({ isError: true, message: "Invalid action" });
        }
        const updatedVideo = yield question.save();
        res.status(200).json({
            isError: false,
            message: "Likes updated successfully",
            video: updatedVideo,
        });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: error.message });
    }
}));
// Delete a question by ID
questionRouter.delete("/delete/:id", auth_middleware_1.verifyToken, auth_middleware_1.authorizedUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const questionId = req.params.id;
        // Check if the question exists
        const question = yield questions_model_1.default.findById(questionId);
        if (!question) {
            return res
                .status(404)
                .json({ isError: true, message: "Question not found" });
        }
        // Check if the authenticated user is the creator of the question
        if (question.creatorID !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(403).json({
                isError: true,
                message: "You are not authorized to delete this question",
            });
        }
        // If the user is the creator, proceed with deleting the question
        yield questions_model_1.default.findByIdAndDelete(questionId);
        res.status(200).json({
            isError: false,
            message: "Question deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: error.message });
    }
}));
exports.default = questionRouter;
