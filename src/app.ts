import { winstonLogger } from '@Krutarth19/jobber-shared';
import { Logger } from 'winston';
import express, { Express } from 'express';
import { start } from '@notifications/server';

import { config } from './config';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

function initialize(): void {
  const app: Express = express();
  start(app);
  log.info('Notification Service Initialized');
}

initialize();
