import cors from 'cors';
import express from 'express';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
