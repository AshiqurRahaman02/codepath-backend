import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
	name: string;
	email: string;
	password: string;
	userType: "client" | "creator" | "admin";
	tag: string;
	bookmarks: { questionID: mongoose.Types.ObjectId; question: string }[];
}

const userSchema: Schema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	userType: {
		type: String,
		enum: ["client", "creator", "admin"],
		default: "client",
	},
	tag: { type: String, required: true },
	bookmarks: [
		{
			questionID: { type: mongoose.Types.ObjectId, required: true },
			question: { type: String, required: true },
		},
	],
});

const UserModel = mongoose.model<IUser>("User", userSchema);


export default UserModel;
