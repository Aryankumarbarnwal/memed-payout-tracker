import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { notFound, errorHandler } from './middleware/errorHandler';
import campaignRoutes from './routes/campaign.routes';
import submissionRoutes from './routes/submission.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) =>{
    res.json({status: 'ok'});
});

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/submissions', submissionRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;