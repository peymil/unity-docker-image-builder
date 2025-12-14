import axios from 'axios';
import { logger } from './logger';

const DOCKER_HUB_API = 'https://registry-1.docker.io/v2';

export const fetchDockerHubTags = async (namespace: string, repository: string): Promise<string[]> => {
  try {
    const tags: string[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const url = `${DOCKER_HUB_API}/repositories/${namespace}/${repository}/tags?page_size=${pageSize}&page=${page}`;
      const response = await axios.get(url);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const data = response.data;
      if (data.results && data.results.length > 0) {
        tags.push(...data.results.map((tag: any) => tag.name));
        if (data.results.length < pageSize) {
          break;
        }
        page++;
      } else {
        break;
      }
    }

    logger.info({event: 'fetched_tags', tag_count: tags.length},`Fetched ${tags.length} tags from Docker Hub`);
    return tags;
  } catch (error) {
    logger.error(error, 'Failed to fetch Docker Hub tags');
    throw error;
  }
};