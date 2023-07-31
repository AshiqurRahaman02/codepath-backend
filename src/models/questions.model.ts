import mongoose, { Document, Schema } from "mongoose";

export interface IQuestion extends Document {
	question: string;
	answer: string;
	skill: string;
	likes: number;
	difficulty: "Easy" | "Medium" | "Hard";
	creatorID: string;
	creatorName: string;
	date: Date;
	attemptedBy: string[];
	likedBy: string[];
}

const questionsSchema = new Schema<IQuestion>(
	{
		question: {
			type: String,
			required: true,
		},
		answer: {
			type: String,
			required: true,
		},
		skill: {
			type: String,
			required: true,
		},
		likes: {
			type: Number,
			default: 0,
		},
		difficulty: {
			type: String,
			enum: ["Easy", "Medium", "Hard"],
			default: "Medium",
		},
		creatorID: {
			type: String,
			required: true,
		},
		creatorName: {
			type: String,
			required: true,
		},
		date: {
			type: Date,
			default: Date.now,
		},
		attemptedBy: {
			type: [String],
			default: [],
		},
		likedBy: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

const QuestionsModel = mongoose.model<IQuestion>("Question", questionsSchema);

export default QuestionsModel;
