import express, { Request, Response } from "express";
import QuestionsModel, { IQuestion } from "../models/questions.model";
import { verifyToken, authorizedUser } from "../middlewares/auth.middleware";

const questionRouter = express.Router();

// Add a new question
questionRouter.post(
	"/add",
	verifyToken,
	authorizedUser,
	async (req: Request, res: Response) => {
		const { question, answer, category, level, creatorID, creatorName } = req.body;

		try {
			const newQuestion: IQuestion = new QuestionsModel({
				question,
				answer,
				level,
				category,
				creatorID,
				creatorName,
			});

			const savedQuestion = await newQuestion.save();
			res.status(201).json({
				isError: false,
				message: "Question added successfully",
				question: savedQuestion,
			});
		} catch (error: any) {
			res.status(500).json({
				isError: true,
				message: "Failed to add question",
				error: error.message,
			});
		}
	}
);

// Get all questions
questionRouter.get("/all", async (req: Request, res: Response) => {
	try {
		const questions: IQuestion[] = await QuestionsModel.find();
		res.status(200).json({ isError: false, questions });
	} catch (error: any) {
		res.status(500).json({
			isError: true,
			message: "Failed to retrieve questions",
			error: error.message,
		});
	}
});

// Search questions by input text
questionRouter.get(
	"/search/:searchTerm",
	async (req: Request, res: Response) => {
		try {
			const searchTerm: string = req.params.searchTerm.toLowerCase();

			// Search for questions that include the search term in the question field (case-insensitive)
			const questions: IQuestion[] = await QuestionsModel.find({
				question: { $regex: searchTerm, $options: "i" },
			});

			if (questions.length === 0) {
				return res
					.status(404)
					.json({ isError: true, message: "No matching questions found" });
			}

			res.status(200).json({ isError: false, questions });
		} catch (error: any) {
			res.status(500).json({ isError: true, message: error.message });
		}
	}
);

// get by categories
questionRouter.get("/get/byCategories", async (req: Request, res: Response) => {
	const categories: string | string[] = req.query.categories as
		| string
		| string[];

	try {
		let questions: IQuestion[];
		if (categories) {
			const categoryArray = Array.isArray(categories)
				? categories
				: [categories];

			// Convert the category names to regular expressions for case-insensitive search
			const regexArray = categoryArray.map(
				(category) => new RegExp(category, "i")
			);

			questions = await QuestionsModel.find({
				category: { $in: regexArray },
			});
		} else {
			questions = await QuestionsModel.find();
		}

		res.status(200).json({ isError: false, questions });
	} catch (error: any) {
		res.status(500).json({
			isError: true,
			message: "Error fetching questions",
			error: error.message,
		});
	}
});

// Get a specific question by ID
questionRouter.get("/getById/:id", async (req: Request, res: Response) => {
	const questionId: string = req.params.id;

	try {
		const question: IQuestion | null = await QuestionsModel.findById(
			questionId
		);
		if (!question) {
			return res
				.status(404)
				.json({ isError: true, message: "Question not found" });
		}
		res.status(200).json({ isError: false, question });
	} catch (error: any) {
		res.status(500).json({
			isError: true,
			message: "Failed to retrieve the question",
			error: error.message,
		});
	}
});

// Get a random question
questionRouter.get("/random", async (req: Request, res: Response) => {
	const { categories } = req.body;

	try {
		let query: any = {}; // An empty query to fetch all questions

		if (categories && Array.isArray(categories)) {
			query = { category: { $in: categories } }; // Fetch questions from specified categories
		}

		// Count the total number of questions that match the query
		const totalQuestionsCount = await QuestionsModel.countDocuments(query);

		if (totalQuestionsCount === 0) {
			return res
				.status(404)
				.json({ isError: true, message: "No questions found" });
		}

		// Generate a random index to fetch a random question
		const randomIndex = Math.floor(Math.random() * totalQuestionsCount);

		// Fetch a single random question using the random index
		const randomQuestion: IQuestion | null = await QuestionsModel.findOne(
			query
		).skip(randomIndex);

		if (!randomQuestion) {
			return res
				.status(404)
				.json({ isError: true, message: "Random question not found" });
		}

		res.status(200).json({ isError: false, randomQuestion });
	} catch (error: any) {
		res.status(500).json({
			isError: true,
			message: "Error fetching a random question",
			error: error.message,
		});
	}
});

// Update a question by ID
questionRouter.put(
	"/update/:id",
	verifyToken,
	authorizedUser,
	async (req: Request, res: Response) => {
		const questionId: string = req.params.id;
		const { question, answer, category } = req.body;

		try {
			const updatedQuestion: IQuestion | null =
				await QuestionsModel.findByIdAndUpdate(
					questionId,
					{ question, answer, category },
					{ new: true }
				);

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
		} catch (error: any) {
			res.status(500).json({
				isError: true,
				message: "Failed to update the question",
				error: error.message,
			});
		}
	}
);

// Delete a question by ID
questionRouter.delete(
	"/delete/:id",
	verifyToken,
	authorizedUser,
	async (req: Request, res: Response) => {
		try {
			const questionId = req.params.id;

			// Check if the question exists
			const question = await QuestionsModel.findById(questionId);
			if (!question) {
				return res
					.status(404)
					.json({ isError: true, message: "Question not found" });
			}

			// Check if the authenticated user is the creator of the question
			if (question.creatorID !== req.user?.id) {
				return res
					.status(403)
					.json({
						isError: true,
						message: "You are not authorized to delete this question",
					});
			}

			// If the user is the creator, proceed with deleting the question
			await QuestionsModel.findByIdAndDelete(questionId);

			res.status(200).json({
				isError: false,
				message: "Question deleted successfully",
			});
		} catch (error: any) {
			res.status(500).json({ isError: true, message: error.message });
		}
	}
);

export default questionRouter;
