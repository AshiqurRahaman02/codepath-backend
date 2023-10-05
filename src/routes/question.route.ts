import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import QuestionsModel, { IQuestion } from "../models/questions.model";
import { verifyToken, authorizedUser, adminVerification } from "../middlewares/auth.middleware";

const questionRouter = express.Router();

// for admin only
questionRouter.post("/post-data",verifyToken, adminVerification, async (req: Request, res: Response) => {
	try {
		const dataPath = path.join(__dirname, "../../data.json");
		const jsonData = fs.readFileSync(dataPath, "utf8");
		const questionsData: IQuestion[] = JSON.parse(jsonData).data;

		for (const questionData of questionsData) {
			// Check if the question already exists in the database
			const existingQuestion = await QuestionsModel.findOne({
				question: questionData.question,
			});

			if (!existingQuestion) {
				// Create a new question document in the database if it doesn't exist
				const question = new QuestionsModel({
					question: questionData.question,
					answer: questionData.answer,
					skill: questionData.skill,
					difficulty: questionData.difficulty,
					creatorID: questionData.creatorID,
					creatorName: questionData.creatorName,
				});
				await question.save();
			} else {
				console.log(questionData.question);
			}
		}

		res.status(200).json({ message: "Data posted successfully" });
	} catch (error: any) {
		res.status(500).json({
			message: "Failed to post data",
			error: error.message,
		});
	}
});

// Add a new question
questionRouter.post(
	"/add",
	verifyToken,
	authorizedUser,
	async (req: Request, res: Response) => {
		const { question, answer, skill, level, creatorID, creatorName } =
			req.body;

		try {
			const newQuestion: IQuestion = new QuestionsModel({
				question,
				answer,
				difficulty:level,
				skill,
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

// Get all questions by query
questionRouter.get(
	"/byQuery",
	verifyToken,
	async (req: Request, res: Response) => {
		try {
			const userId = req.user?.id;
			const { sort } = req.query;
			const status: string | string[] = req.query.s as string | string[];
			const difficulty: string | string[] = req.query.d as string | string[];
			const skills: string | string[] = req.query.skills as string | string[];
			const query: any = {};

			if (sort) {
				// Handle sorting
				if (sort === "po") {
					// Sort by popularity (if 'sort' is "po")
					query.likes = -1; // Sort by likes in descending order
				} else if (sort === "asc") {
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
				} else if (sort === "desc") {
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
				} else if (status === "not") {
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
			const skillMap: Record<string, string> = {
				js: "JavaScript",
				node: "Node Js",
				ts: "TypeScript",
				react: "React",
				// Add other mappings based on your requirements
			};

			// Create an array of all skill names
			const allSkills = Object.values(skillMap);
			console.log(skills)

			if (skills) {
				// Handle skills filtering
				if (Array.isArray(skills)) {
					// Filter based on selected skills and include others if present
					const selectedSkills = skills.filter(
						(skill) => skillMap[skill] || skill === "others"
					);
					if (selectedSkills.length === 0) {
						// If no valid skills are selected, return all skills except the ones in the skillMap
						query.skill = { $nin: allSkills };
					} else {
						query.skill = {
							$in: selectedSkills.map(
								(sortForm) => skillMap[sortForm] || sortForm
							),
						};
					}
				} else {
					// If 'skills' is a single string, filter based on that skill
					if (skills === "others") {
						query.skill = { $nin: allSkills }; // Filter out all skills that are in the skillMap
					} else {
						query.skill = skillMap[skills];
					}
				}
			}

			// Retrieve questions based on the constructed query
			const questions: IQuestion[] = await QuestionsModel.find(query);

			res.status(200).json({ isError: false, questions });
		} catch (error: any) {
			res.status(500).json({
				isError: true,
				message: "Failed to retrieve questions",
				error: error.message,
			});
		}
	}
);

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
questionRouter.get("/get/bySkill", async (req: Request, res: Response) => {
	const skills: string | string[] = req.query.skill as string | string[];

	try {
		let questions: IQuestion[];
		if (skills) {
			const categoryArray = Array.isArray(skills) ? skills : [skills];

			// Convert the category names to regular expressions for case-insensitive search
			const regexArray = categoryArray.map(
				(skill) => new RegExp(skill, "i")
			);

			questions = await QuestionsModel.find({
				skill: { $in: regexArray },
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

// get questions by levels
questionRouter.get("/get/byLevels", async (req: Request, res: Response) => {
	const levels: string | string[] = req.query.levels as string | string[];

	try {
		let query: any = {};

		if (levels && Array.isArray(levels)) {
			query = { level: { $in: levels } };
		}

		// Fetch questions based on the query
		const questions: IQuestion[] = await QuestionsModel.find(query);

		if (questions.length === 0) {
			return res
				.status(404)
				.json({ isError: true, message: "No questions found" });
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

// get a specific question by ID
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

// get a random question
questionRouter.get("/random",verifyToken, async (req: Request, res: Response) => {
	try {
		const userId = req.user?.id;
		const status: string | string[] = req.query.s as string | string[];
		const difficulty: string | string[] = req.query.d as string | string[];
		const skills: string | string[] = req.query.skills as string | string[];
		const query: any = {};


		if (status) {
			// Handle status filtering
			if (status === "a") {
				// Filter by 'Attempted' status (if 'status' is "a")
				query.attemptedBy = userId;
			} else if (status === "not") {
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
		const skillMap: Record<string, string> = {
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
				const selectedSkills = skills.filter(
					(skill) => skillMap[skill] || skill === "others"
				);
				if (selectedSkills.length === 0) {
					// If no valid skills are selected, return all skills except the ones in the skillMap
					query.skill = { $nin: allSkills };
				} else {
					query.skill = {
						$in: selectedSkills.map(
							(sortForm) => skillMap[sortForm] || sortForm
						),
					};
				}
			} else {
				// If 'skills' is a single string, filter based on that skill
				if (skills === "others") {
					query.skill = { $nin: allSkills }; // Filter out all skills that are in the skillMap
				} else {
					query.skill = skillMap[skills];
				}
			}
		}

		// Retrieve questions based on the constructed query
		const questions: IQuestion[] = await QuestionsModel.find(query);

		let question = questions[Math.floor(Math.random() * questions.length)];
		res.status(200).json({ isError: false, question });
	} catch (error: any) {
		res.status(500).json({
			isError: true,
			message: "Failed to retrieve questions",
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

// update attempted
questionRouter.put(
	"/update/attempted/:questionId",
	verifyToken,
	async (req, res) => {
		const questionId = req.params.questionId;
		const userId = req.user?.id;

		try {
			const question = await QuestionsModel.findById(questionId);

			if (!question) {
				return res
					.status(404)
					.json({ isError: true, message: "questionId not found" });
			}

			question.attemptedBy.push(userId);
			const updatedQuestion = await question.save();

			res.status(200).json({
				isError: false,
				message: "Question updated successfully",
				question: updatedQuestion,
			});
		} catch (error: any) {
			res.status(500).json({ isError: true, message: error.message });
		}
	}
);

// update like
questionRouter.put(
	"/update/like/:questionId",
	verifyToken,
	async (req, res) => {
		const questionId = req.params.questionId;
		const { action } = req.body;
		const userId = req.user?.id;

		try {
			const question = await QuestionsModel.findById(questionId);

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
			} else if (action === "decrement") {
				question.likes--;
			} else {
				return res
					.status(400)
					.json({ isError: true, message: "Invalid action" });
			}

			const updatedQuestion = await question.save();

			console.log(updatedQuestion);
			res.status(200).json({
				isError: false,
				message: "Likes updated successfully",
				question: updatedQuestion,
			});
		} catch (error: any) {
			res.status(500).json({ isError: true, message: error.message });
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
				return res.status(403).json({
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
