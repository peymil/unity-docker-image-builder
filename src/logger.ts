import pino from 'pino';

const transport =
  process.stdout.isTTY
    ? { transport: { target: 'pino-pretty' } }
    : {};


export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...transport,
});