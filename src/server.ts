import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  return server;
};

const server = startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import { disconnectDatabase } from './config/database';

const shutdown = async () => {
  const s = await server;
  if (s && typeof s.close === 'function') {
    s.close(() => {
      disconnectDatabase().then(() => process.exit(0));
    });
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;
