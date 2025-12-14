import { searchChangesets, SearchMode } from 'unity-changeset';
import { UnityVersion } from './types';
import { logger } from './logger';

const unity_version_regex = /^(\d+)\.(\d+)\.(\d+)([a-zA-Z]+)(-?\d+)$/;

export const fetchUnityVersions = async (): Promise<UnityVersion[]> => {
  try {
    const unityVersions = await searchChangesets(SearchMode.Default);
    const unityXltsVersions = await searchChangesets(SearchMode.LTS);

    const existingVersions = new Set(unityVersions.map((v) => v.version));
    for (const xltsVersion of unityXltsVersions) {
      if (!existingVersions.has(xltsVersion.version)) {
        unityVersions.push(xltsVersion);
      }
    }

    if (unityVersions?.length > 0) {
      const filteredVersions = unityVersions
        .map((unityVersion) => {
          const match = RegExp(unity_version_regex).exec(unityVersion.version);
          if (match) {
            const [_, major, minor, patch, lifecycle] = match;

            if (lifecycle !== 'f' || Number(major) < 2017) {
              return null;
            }

            return {
              version: unityVersion.version,
              changeSet: unityVersion.changeset,
            } as UnityVersion;
          }
          return null;
        })
        .filter((versionInfo): versionInfo is UnityVersion => versionInfo !== null);

      logger.info({event: 'fetched_unity_versions', version_count: filteredVersions.length},`Fetched ${filteredVersions.length} Unity versions after filtering`);
      return filteredVersions;
    }

    throw new Error('No Unity versions found!');
  } catch (error) {
    logger.error(error, 'Failed to fetch Unity versions');
    throw error;
  }
};