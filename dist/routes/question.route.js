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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const questions_model_1 = __importDefault(require("../models/questions.model"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const questionRouter = express_1.default.Router();
// for admin only
questionRouter.post("/post-data", auth_middleware_1.verifyToken, auth_middleware_1.adminVerification, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataPath = path_1.default.join(__dirname, "../../data.json");
        const jsonData = fs_1.default.readFileSync(dataPath, "utf8");
        const questionsData = JSON.parse(jsonData).data;
        for (const questionData of questionsData) {
            // Check if the question already exists in the database
            const existingQuestion = yield questions_model_1.default.findOne({
                question: questionData.question,
            });
            if (!existingQuestion) {
                // Create a new question document in the database if it doesn't exist
                const question = new questions_model_1.default({
                    question: questionData.question,
                    answer: questionData.answer,
                    skill: questionData.skill,
                    difficulty: questionData.difficulty,
                    creatorID: questionData.creatorID,
                    creatorName: questionData.creatorName,
                });
                yield question.save();
            }
            else {
                console.log(questionData.question);
            }
        }
        res.status(200).json({ message: "Data posted successfully" });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to post data",
            error: error.message,
        });
    }
}));
// Add a new question
questionRouter.post("/add", auth_middleware_1.verifyToken, auth_middleware_1.authorizedUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { question, answer, skill, difficulty, creatorID, creatorName } = req.body;
    try {
        const newQuestion = new questions_model_1.default({
            question,
            answer,
            difficulty,
            skill,
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
// Get all questions by query
questionRouter.get("/byQuery", auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { sort } = req.query;
        const status = req.query.s;
        const difficulty = req.query.d;
        const skills = req.query.skills;
        const query = {};
        if (sort) {
            // Handle sorting
            if (sort === "po") {
                // Sort by popularity (if 'sort' is "po")
                query.likes = -1; // Sort by likes in descending order
            }
            else if (sort === "asc") {
                // Sort by difficulty: Easy to Hard (if 'sort' is "asc")
                query.difficulty = {
                    $sort: {
                        $cond: [
                            { $eq: ["$difficulty", "Easy"] },
                            1,
                            { $cond: [{ $eq: ["$difficulty", "Medium"] }, 2, 3] },
                        ],
                    },
                };
            }
            else if (sort === "desc") {
                // Sort by difficulty: Hard to Easy (if 'sort' is "desc")
                query.difficulty = {
                    $sort: {
                        $cond: [
                            { $eq: ["$difficulty", "Hard"] },
                            1,
                            { $cond: [{ $eq: ["$difficulty", "Medium"] }, 2, 3] },
                        ],
                    },
                };
            }
        }
        if (status) {
            // Handle status filtering
            if (status === "a") {
                // Filter by 'Attempted' status (if 'status' is "a")
                query.attemptedBy = userId;
            }
            else if (status === "not") {
                // Filter by 'Not Attempted' status (if 'status' is "not")
                query.attemptedBy = { $not: { $eq: userId } };
            }
        }
        if (difficulty) {
            // Handle difficulty filtering
            if (difficulty === "e") {
                // Filter by 'Easy' difficulty (if 'd' is "e")
                query.difficulty = "Easy";
            }
            if (difficulty === "m") {
                // Filter by 'Medium' difficulty (if 'd' is "m")
                query.difficulty = "Medium";
            }
            if (difficulty === "h") {
                // Filter by 'Hard' difficulty (if 'd' is "h")
                query.difficulty = "Hard";
            }
        }
        // Map the sort form to the actual skill name
        const skillMap = {
            js: "JavaScript",
            node: "Node Js",
            ts: "TypeScript",
            react: "React",
            // Add other mappings based on your requirements
        };
        // Create an array of all skill names
        const allSkills = Object.values(skillMap);
        console.log(skills);
        if (skills) {
            // Handle skills filtering
            if (Array.isArray(skills)) {
                // Filter based on selected skills and include others if present
                const selectedSkills = skills.filter((skill) => skillMap[skill] || skill === "others");
                if (selectedSkills.length === 0) {
                    // If no valid skills are selected, return all skills except the ones in the skillMap
                    query.skill = { $nin: allSkills };
                }
                else {
                    query.skill = {
                        $in: selectedSkills.map((sortForm) => skillMap[sortForm] || sortForm),
                    };
                }
            }
            else {
                // If 'skills' is a single string, filter based on that skill
                if (skills === "others") {
                    query.skill = { $nin: allSkills }; // Filter out all skills that are in the skillMap
                }
                else {
                    query.skill = skillMap[skills];
                }
            }
        }
        // Retrieve questions based on the constructed query
        const questions = yield questions_model_1.default.find(query);
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
questionRouter.get("/get/bySkill", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const skills = req.query.skill;
    try {
        let questions;
        if (skills) {
            const categoryArray = Array.isArray(skills) ? skills : [skills];
            // Convert the category names to regular expressions for case-insensitive search
            const regexArray = categoryArray.map((skill) => new RegExp(skill, "i"));
            questions = yield questions_model_1.default.find({
                skill: { $in: regexArray },
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
questionRouter.get("/random", auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const status = req.query.s;
        const difficulty = req.query.d;
        const skills = req.query.skills;
        const query = {};
        if (status) {
            // Handle status filtering
            if (status === "a") {
                // Filter by 'Attempted' status (if 'status' is "a")
                query.attemptedBy = userId;
            }
            else if (status === "not") {
                // Filter by 'Not Attempted' status (if 'status' is "not")
                query.attemptedBy = { $not: { $eq: userId } };
            }
        }
        if (difficulty) {
            // Handle difficulty filtering
            if (difficulty === "e") {
                // Filter by 'Easy' difficulty (if 'd' is "e")
                query.difficulty = "Easy";
            }
            if (difficulty === "m") {
                // Filter by 'Medium' difficulty (if 'd' is "m")
                query.difficulty = "Medium";
            }
            if (difficulty === "h") {
                // Filter by 'Hard' difficulty (if 'd' is "h")
                query.difficulty = "Hard";
            }
        }
        // Map the sort form to the actual skill name
        const skillMap = {
            js: "JavaScript",
            node: "Node Js",
            ts: "TypeScript",
            react: "React",
            // Add other mappings based on your requirements
        };
        // Create an array of all skill names
        const allSkills = Object.values(skillMap);
        if (skills) {
            // Handle skills filtering
            if (Array.isArray(skills)) {
                // Filter based on selected skills and include others if present
                const selectedSkills = skills.filter((skill) => skillMap[skill] || skill === "others");
                if (selectedSkills.length === 0) {
                    // If no valid skills are selected, return all skills except the ones in the skillMap
                    query.skill = { $nin: allSkills };
                }
                else {
                    query.skill = {
                        $in: selectedSkills.map((sortForm) => skillMap[sortForm] || sortForm),
                    };
                }
            }
            else {
                // If 'skills' is a single string, filter based on that skill
                if (skills === "others") {
                    query.skill = { $nin: allSkills }; // Filter out all skills that are in the skillMap
                }
                else {
                    query.skill = skillMap[skills];
                }
            }
        }
        // Retrieve questions based on the constructed query
        const questions = yield questions_model_1.default.find(query);
        let question = questions[Math.floor(Math.random() * questions.length)];
        res.status(200).json({ isError: false, question });
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            message: "Failed to retrieve questions",
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
// update attempted
questionRouter.put("/update/attempted/:questionId", auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const questionId = req.params.questionId;
    const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
    try {
        const question = yield questions_model_1.default.findById(questionId);
        if (!question) {
            return res
                .status(404)
                .json({ isError: true, message: "questionId not found" });
        }
        question.attemptedBy.push(userId);
        const updatedQuestion = yield question.save();
        res.status(200).json({
            isError: false,
            message: "Question updated successfully",
            question: updatedQuestion,
        });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: error.message });
    }
}));
// update like
questionRouter.put("/update/like/:questionId", auth_middleware_1.verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const questionId = req.params.questionId;
    const { action } = req.body;
    const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
    try {
        const question = yield questions_model_1.default.findById(questionId);
        if (!question) {
            return res
                .status(404)
                .json({ isError: true, message: "questionId not found" });
        }
        if (question.likedBy.includes(userId)) {
            return res.status(404).json({
                isError: true,
                message: "You cannot like one question multiple times.",
            });
        }
        if (action === "increment") {
            question.likes++;
            question.likedBy.push(userId);
        }
        else if (action === "decrement") {
            question.likes--;
        }
        else {
            return res
                .status(400)
                .json({ isError: true, message: "Invalid action" });
        }
        const updatedQuestion = yield question.save();
        console.log(updatedQuestion);
        res.status(200).json({
            isError: false,
            message: "Likes updated successfully",
            question: updatedQuestion,
        });
    }
    catch (error) {
        res.status(500).json({ isError: true, message: error.message });
    }
}));
// Delete a question by ID
questionRouter.delete("/delete/:id", auth_middleware_1.verifyToken, auth_middleware_1.authorizedUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
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
        if (question.creatorID !== ((_e = req.user) === null || _e === void 0 ? void 0 : _e.id)) {
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
