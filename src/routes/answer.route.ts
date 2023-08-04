
import express, { Request, Response } from 'express';
import AnswerModel, { IAnswer } from '../models/answer.model';
import  {verifyToken}  from '../middlewares/auth.middleware';

const answerRouter = express.Router();

// Create a new answer
answerRouter.post('/create', verifyToken, async (req: Request, res: Response) => {
  const { userID, userName, answer, questionID } = req.body;

  try {
    const newAnswer: IAnswer = await AnswerModel.create({
      userID,
      userName,
      answer,
      questionID,
    });

    res.status(201).json({ isError: false, message: 'Answer posted successfully', answer: newAnswer });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error creating answer', error: error.message });
  }
});

// Get all answer for a specific question
answerRouter.get('/get/:questionID', async (req: Request, res: Response) => {
  const questionID: string = req.params.questionID;

  try {
    const answers: IAnswer[] = await AnswerModel.find({ questionID });

    res.status(200).json({ isError: false, answers });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error fetching answers', error: error.message });
  }
});

// Update a answer by ID
answerRouter.put('/update/:id', verifyToken, async (req: Request, res: Response) => {
  const answerID: string = req.params.id;
  const { answer } = req.body;

  try {
    const updatedAnswer: IAnswer | null = await AnswerModel.findByIdAndUpdate(
      answerID,
      { answer },
      { new: true }
    );

    if (!updatedAnswer) {
      return res.status(404).json({ isError: true, message: 'Answer not found' });
    }

    res.status(200).json({ isError: false, answer: updatedAnswer });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error updating answer', error: error.message });
  }
});

// Delete a answer by ID
answerRouter.delete('/delete/:id', verifyToken, async (req: Request, res: Response) => {
  const answerID: string = req.params.id;

  try {
    const deletedAnswer: IAnswer | null = await AnswerModel.findByIdAndDelete(answerID);

    if (!deletedAnswer) {
      return res.status(404).json({ isError: true, message: 'Answer not found' });
    }

    res.status(200).json({ isError: false, message: 'Answer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error deleting comment', error: error.message });
  }
});

export default answerRouter;
