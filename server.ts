import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/utils/dbHelper.js';

// Load environment variables
dotenv.config();

// Load routes
import authRoutes from './server/routes/authRoutes.js';
import projectRoutes from './server/routes/projectRoutes.js';
import taskRoutes from './server/routes/taskRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB Connection
  await connectDB();

  // Basic Middleware
  app.use(cors({
    origin: '*', // Dynamic preview requires general access
    credentials: true,
  }));
  app.use(express.json());

  // API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
  });

  // Serve Frontend / Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Vite server in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production build files...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal crash on server boot:', err);
});
