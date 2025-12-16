import { logger } from './logger';
import path from 'path';
import { spawn } from 'child_process';

export const buildAndPushImage = async (
  version: string,
  changeSet: string,
  namespace: string,
  repository: string,
): Promise<void> => {
  const imageName = `${namespace}/${repository}:${version}`;
  const contextPath = path.join(__dirname, '..', 'docker');

  try {
    logger.info(
      { event: 'build_start', unity_version: version },
      `Starting build for ${imageName}`,
    );

    // Build with Buildah
    const buildArgs = [
      'bud',
      '--build-arg', `version=${version}`,
      '--build-arg', `changeSet=${changeSet}`,
      '--build-arg', 'module=base',
      '-t', imageName,
      contextPath,
    ];

    await runCommand('buildah', buildArgs);

    logger.info(
      { event: 'build_complete', unity_version: version },
      `Build completed for ${imageName}`,
    );

    logger.info({ event: 'push_start', unity_version: version }, `Starting push for ${imageName}`);

    // Push with Buildah
    const pushArgs = [
      'push',
      '--creds', `${process.env.DOCKER_USERNAME}:${process.env.DOCKER_PASSWORD}`,
      imageName,
    ];

    await runCommand('buildah', pushArgs);

    logger.info(
      { event: 'push_complete', unity_version: version },
      `Push completed for ${imageName}`,
    );
  } catch (error) {
    logger.error(error, `Error during build and push for ${imageName}`);
    throw error;
  }
};

const runCommand = (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};
