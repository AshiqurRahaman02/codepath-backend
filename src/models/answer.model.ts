import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  userID: mongoose.Types.ObjectId;
  userName: string;
  answer: string;
  questionID: string;
  likes: number;
}

const answerSchema: Schema = new Schema({
  userID: { type: mongoose.Types.ObjectId, required: true },
  userName: { type: String, required: true },
  answer: { type: String, required: true },
  questionID: { type: String, required: true },
  likes: { type: Number, default: 0 },
},{timestamps: true});


const AnswerModel = mongoose.model<IAnswer>('Answer', answerSchema);
export default AnswerModel;
