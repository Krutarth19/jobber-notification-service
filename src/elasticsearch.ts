import { Client } from '@elastic/elasticsearch';
import { Logger } from 'winston';
import { winstonLogger } from '@Krutarth19/jobber-shared';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';

import { config } from './config';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

const elasticSearch = new Client({
  node: `${config.ELASTIC_SEARCH_URL}`
});

export async function checkConnection(): Promise<void> {
  let isConnected = false;
  while (!isConnected) {
    try {
      const health: ClusterHealthResponse = await elasticSearch.cluster.health({});
      log.info(`NotificationService ElasticSearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('Connection to ElasticSearch failed. Retrying...');
      log.error('error', 'NotificationService checkConnection() method:', error);
    }
  }
}
