import dotenv from 'dotenv';

dotenv.config();

import https from 'https';
import fs from 'fs';
import path from 'path';
import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

const startServer = async () => {
  await connectDatabase();

  const httpServer = app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  const certPath = path.join(__dirname, '..', 'certs', 'cert.pem');
  const keyPath = path.join(__dirname, '..', 'certs', 'key.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };

    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    });
  }

  return httpServer;
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
