import 'dotenv/config';
import { startCronJob } from './cron';
import { logger } from './logger';

logger.info('Starting Unity Docker Image Builder...');

startCronJob();

logger.info('Unity Docker Image Builder started');