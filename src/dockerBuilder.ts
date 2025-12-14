import Docker from 'dockerode';
import { logger } from './logger';
import path from 'path';

const docker = new Docker();

export const buildAndPushImage = async (
  version: string,
  changeSet: string,
  namespace: string,
  repository: string,
): Promise<void> => {
  const imageName = `${namespace}/${repository}:${version}`;

  try {
    logger.info(
      { event: 'build_start', unity_version: version },
      `Starting build for ${imageName}`,
    );

    const buildOptions = {
      context: path.join(__dirname, '..', 'docker'),
      src: ['Dockerfile'],
      dockerfile: 'Dockerfile',
      t: imageName,
      buildargs: {
        version,
        changeSet,
        module: 'base',
      },
    };

    const stream = await docker.buildImage(buildOptions, {});

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err: any, res: any) => {
        if (err) {
          logger.error('Build failed', err);
          reject(err);
        } else {
          logger.info(
            { event: 'build_complete', unity_version: version },
            `Build completed for ${imageName}`,
          );
          resolve(res);
        }
      });
    });

    logger.info({ event: 'push_start', unity_version: version }, `Starting push for ${imageName}`);
    const image = docker.getImage(imageName);
    const pushStream = await image.push({
      authconfig: {
        username: process.env.DOCKER_USERNAME,
        auth: process.env.DOCKER_PASSWORD,
      },
    });

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(pushStream, (err: any, res: any) => {
        if (err) {
          logger.error(err, `Push failed for ${imageName}`);
          reject(err);
        } else {
          logger.info(
            { event: 'push_complete', unity_version: version },
            `Push completed for ${imageName}`,
          );
          resolve(res);
        }
      });
    });
  } catch (error) {
    logger.error(error, `Error during build and push for ${imageName}`);
    throw error;
  }
};
