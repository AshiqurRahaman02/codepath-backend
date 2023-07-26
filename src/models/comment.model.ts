import mongoose, { Schema, Document } from 'mongoose';

// Define the comment schema
export interface IComment extends Document {
  userID: mongoose.Types.ObjectId;
  userName: string;
  comment: string;
  likes: number;
}

const commentSchema: Schema = new Schema({
  userID: { type: mongoose.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  comment: { type: String, required: true },
  likes: { type: Number, default: 0 },
});

// Create and export the Comment model
const CommentModel = mongoose.model<IComment>('Comment', commentSchema);
export default CommentModel;
