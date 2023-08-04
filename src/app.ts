import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import userRouter from './routes/user.route';
import questionRouter from './routes/question.route';
import answerRouter from './routes/answer.route';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/user", userRouter)
app.use("/question", questionRouter)
app.use("/answer", answerRouter)


export default app;