// routes/comments.routes.ts
import express, { Request, Response } from 'express';
import CommentModel, { IComment } from '../models/comment.model';
import  {verifyToken}  from '../middlewares/auth.middleware';

const commentRouter = express.Router();

// Create a new comment
commentRouter.post('/create', verifyToken, async (req: Request, res: Response) => {
  const { userID, userName, comment, questionID } = req.body;

  try {
    const newComment: IComment = await CommentModel.create({
      userID,
      userName,
      comment,
      questionID,
    });

    res.status(201).json({ isError: false, comment: newComment });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error creating comment', error: error.message });
  }
});

// Get all comments for a specific question
commentRouter.get('/get/:questionID', async (req: Request, res: Response) => {
  const questionID: string = req.params.questionID;

  try {
    const comments: IComment[] = await CommentModel.find({ questionID });

    res.status(200).json({ isError: false, comments });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error fetching comments', error: error.message });
  }
});

// Update a comment by ID
commentRouter.put('/update/:id', verifyToken, async (req: Request, res: Response) => {
  const commentID: string = req.params.id;
  const { comment } = req.body;

  try {
    const updatedComment: IComment | null = await CommentModel.findByIdAndUpdate(
      commentID,
      { comment },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ isError: true, message: 'Comment not found' });
    }

    res.status(200).json({ isError: false, comment: updatedComment });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error updating comment', error: error.message });
  }
});

// Delete a comment by ID
commentRouter.delete('/delete/:id', verifyToken, async (req: Request, res: Response) => {
  const commentID: string = req.params.id;

  try {
    const deletedComment: IComment | null = await CommentModel.findByIdAndDelete(commentID);

    if (!deletedComment) {
      return res.status(404).json({ isError: true, message: 'Comment not found' });
    }

    res.status(200).json({ isError: false, message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ isError: true, message: 'Error deleting comment', error: error.message });
  }
});

export default commentRouter;
