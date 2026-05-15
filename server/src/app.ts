import { mkdirSync } from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

app.use(
  cors({
    origin: [env.clientUrl],
    credentials: true,
  }),
);
app.use(express.json());

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
mkdirSync(uploadsRoot, { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
