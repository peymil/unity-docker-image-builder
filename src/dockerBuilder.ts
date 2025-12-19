import { logger } from './logger';
import path from 'path';
import { spawn } from 'child_process';

export const buildAndPushImage = async (
  version: string,
  changeSet: string,
  module: string,
  namespace: string,
  repository: string,
): Promise<void> => {
  const imageName = `${namespace}/${repository}:${version}`;
  const contextPath = path.join(__dirname, '..', 'docker');

  logger.info({ event: 'build_start', unity_version: version }, `Starting build for ${imageName}`);

  // Build with Buildah
  const buildArgs = [
    'bud',
    '--build-arg',
    `version=${version}`,
    '--isolation=chroot',
    '--build-arg',
    `changeSet=${changeSet}`,
    '--build-arg',
    `module=${module}`,
    '-t',
    imageName,
    contextPath,
  ];

  const buildResult = await runCommand('buildah', buildArgs).catch(({ error, stdout, stderr }) => {
    logger.error(
      {
        event: 'BUILD_FAILED',
        unity_version: version,
        error: error.message,
        logs: `${stdout}\n${stderr}`,
      },
      `Build failed for ${imageName}`,
    );
    throw error;
  });

  logger.info(
    {
      event: 'BUILD_SUCCESS',
      unity_version: version,
      logs: `${buildResult.stdout}\n${buildResult.stderr}`,
    },
    `Build completed for ${imageName}`,
  );

  logger.info({ event: 'push_start', unity_version: version }, `Starting push for ${imageName}`);

  // Push with Buildah
  const pushArgs = [
    'push',
    '--creds',
    `${process.env.DOCKER_USERNAME}:${process.env.DOCKER_PASSWORD}`,
    imageName,
  ];

  const pushResult = await runCommand('buildah', pushArgs).catch(({ error, stdout, stderr }) => {
    logger.error(
      {
        event: 'PUSH_FAILED',
        unity_version: version,
        error: error.message,
        logs: `${stdout}\n${stderr}`,
      },
      `Build failed for ${imageName}`,
    );
    throw error;
  });

  logger.info(
    {
      event: 'PUSH_SUCCESS',
      unity_version: version,
      logs: `${pushResult.stdout}\n${pushResult.stderr}`,
    },
    `Push completed for ${imageName}`,
  );
};

const runCommand = (
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject({ error: new Error(`${command} exited with code ${code}`), stdout, stderr });
      }
    });

    child.on('error', (error) => {
      logger.error(error, `Error running ${command}`);
      reject(error);
    });
  });
};
