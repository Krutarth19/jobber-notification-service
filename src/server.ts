import 'express-async-errors';
import http from 'http';

import { config } from '@notifications/config';
import { Logger } from 'winston';
import { IEmailMessageDetails, winstonLogger } from '@Krutarth19/jobber-shared';
import { Application } from 'express';
import { Channel } from 'amqplib';
import { healthRoute } from '@notifications/routes';
import { checkConnection } from '@notifications/elasticsearch';
import { createConnection } from '@notifications/queues/connection';
import { consumeAuthEmailMessage, consumeOrderEmailMessage } from '@notifications/queues/email.consumer';

const SERVER_PORT = 4001;

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application): void {
  startServer(app);
  app.use('', healthRoute);
  startQueues();
  startElasticSearch();
}

async function startQueues(): Promise<void> {
  const emailChannel: Channel = (await createConnection()) as Channel;
  await consumeAuthEmailMessage(emailChannel);
  await consumeOrderEmailMessage(emailChannel);
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=123234whqhqhehwhqhe`;
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: `${config.SENDER_EMAIL}`,
    resetLink: verificationLink,
    template: 'forgotPassword'
  };

  await emailChannel.assertExchange('jobber-email-notification', 'direct');
  const message = JSON.stringify(messageDetails);
  emailChannel.publish('jobber-email-notification', 'auth-email', Buffer.from(message));

  // await emailChannel.assertExchange('jobber-order-notification', 'direct');
  // const message1 = JSON.stringify({ name: 'jobber', service: 'order notification service' });
  // emailChannel.publish('jobber-order-notification', 'order-email', Buffer.from(message1));
}

function startElasticSearch(): void {
  checkConnection();
}

function startServer(app: Application) {
  try {
    const httpServer: http.Server = new http.Server(app);
    log.info(`Notification server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'NotificationService startServer() method:', error);
  }
}
