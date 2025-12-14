import pino from 'pino';

const transports = [];

if (process.env.LOKI_URL) {
  transports.push({
    target: 'pino-loki',
    options: {
      host: process.env.LOKI_URL,
      labels: { app: 'unity-docker-image-builder' },
      basicAuth: process.env.LOKI_USERNAME && process.env.LOKI_PASSWORD ? {
        username: process.env.LOKI_USERNAME,
        password: process.env.LOKI_PASSWORD
      } : undefined,
    }
  });
}

transports.push({
  target: 'pino-pretty',
  options: {
    colorize: true,
  }
});

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: transports
  }
});