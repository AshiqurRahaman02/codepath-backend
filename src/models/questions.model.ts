
import mongoose, { Document, Schema } from "mongoose";

export interface IQuestion extends Document {
	question: string;
	answer: string;
	category: string;
	likes: number;
	level: "Easy" | "Medium" | "Hard";
	creatorID: string;
	creatorName: string;
	date: Date;
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
		category: {
			type: String,
			required: true,
		},
		likes: {
			type: Number,
			default: 0,
		},
		level: {
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
	},
	{ timestamps: true }
);

const QuestionsModel = mongoose.model<IQuestion>("Question", questionsSchema);

export default QuestionsModel;
