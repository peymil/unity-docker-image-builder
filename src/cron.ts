import * as cron from 'node-cron';
import { fetchUnityVersions } from './unity';
import { fetchDockerHubTags } from './dockerhub';
import { findMissingVersions } from './versionChecker';
import { BuildScheduler } from './buildScheduler';
import { buildAndPushImage } from './dockerBuilder';
import { logger } from './logger';

const DOCKER_HUB_NAMESPACE = process.env.DOCKER_HUB_NAMESPACE || 'unityci';
const DOCKER_HUB_REPO = process.env.DOCKER_HUB_REPO || 'editor';

const scheduler = new BuildScheduler();

export const startCronJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
      logger.info('Starting cron job...');

      const unityVersions = await fetchUnityVersions();

      const dockerHubTags = await fetchDockerHubTags(DOCKER_HUB_NAMESPACE, DOCKER_HUB_REPO);

      const missingVersions = findMissingVersions(unityVersions, dockerHubTags);

      scheduler.addVersions(missingVersions);

      const batch = scheduler.getBatch();
      logger.info({event: 'processing_batch', versionsToBuild: batch.map(job => job.version) },`Processing batch of ${batch.length} builds`);

      for (const job of batch) {
        scheduler.markBuilding(job.version);
        try {
          await buildAndPushImage(job.version, job.changeSet, 'base', DOCKER_HUB_NAMESPACE, DOCKER_HUB_REPO);
          scheduler.markCompleted(job.version);
          logger.info({event: 'build_and_push_success', unity_version: job.version},`Successfully built and pushed ${job.version}`);
        } catch (error) {
          scheduler.markFailed(job.version);
          logger.error({event: 'build_and_push_failure', unity_version: job.version},`Failed to build and push ${job.version}`, error);
        }
      }

      logger.info('Cron job completed');
    } catch (error) {
      logger.error(error, 'Cron job failed');
    }
  });

  logger.info('Cron job scheduled to run every 5 minutes');
};