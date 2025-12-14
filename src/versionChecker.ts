import { UnityVersion } from './types';
import { logger } from './logger';

export const findMissingVersions = (unityVersions: UnityVersion[], dockerHubTags: string[]): { version: string; changeSet: string }[] => {
  const missingVersions = unityVersions.filter(uv => !dockerHubTags.includes(uv.version));

  logger.info({event: 'missing_versions_found', missing_count: missingVersions.length},`Found ${missingVersions.length} missing Unity versions`);
  return missingVersions;
};