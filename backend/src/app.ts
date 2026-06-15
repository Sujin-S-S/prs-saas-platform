import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import { resolveTenant } from './middleware/tenantResolver';
import { rateLimiterMiddleware } from './middleware/rateLimiter';

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*', // For demo. In production, configure specific allowed tenant host wildcard patterns
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting & tenant resolver globally to all API paths
app.use(rateLimiterMiddleware);
app.use('/api', resolveTenant, apiRouter);

// Base health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

export default app;
