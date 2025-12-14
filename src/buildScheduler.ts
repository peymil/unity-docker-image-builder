import fs from 'fs';
import path from 'path';
import { BuildJob } from './types';
import { logger } from './logger';

const QUEUE_FILE = path.join(__dirname, '..', 'build-queue.json');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '2', 10);

export class BuildScheduler {
  private queue: BuildJob[] = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      logger.error(error, 'Failed to load build queue');
    }
  }

  private saveQueue() {
    try {
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.queue, null, 2));
    } catch (error) {
      logger.error(error ,'Failed to save build queue');
    }
  }

  addVersions(missingVersions: { version: string; changeSet: string }[]) {
    for (const { version, changeSet } of missingVersions) {
      if (!this.queue.some(job => job.version === version)) {
        this.queue.push({
          version,
          changeSet,
          retries: 0,
          status: 'pending'
        });
      }
    }
    this.saveQueue();
  }

  getPendingJobs(): BuildJob[] {
    return this.queue.filter(job => job.status === 'pending' || (job.status === 'failed' && job.retries < MAX_RETRIES));
  }

  getBatch(): BuildJob[] {
    const pending = this.getPendingJobs();
    return pending.slice(0, BATCH_SIZE);
  }

  markBuilding(version: string) {
    const job = this.queue.find(j => j.version === version);
    if (job) {
      job.status = 'building';
      this.saveQueue();
    }
  }

  markCompleted(version: string) {
    const job = this.queue.find(j => j.version === version);
    if (job) {
      job.status = 'completed';
      this.saveQueue();
    }
  }

  markFailed(version: string) {
    const job = this.queue.find(j => j.version === version);
    if (job) {
      job.retries++;
      if (job.retries >= MAX_RETRIES) {
        job.status = 'failed';
        logger.error(`Build failed for version ${version} after ${MAX_RETRIES} retries`);
      } else {
        job.status = 'pending';
        logger.warn(`Build failed for version ${version}, retrying (${job.retries}/${MAX_RETRIES})`);
      }
      this.saveQueue();
    }
  }
}