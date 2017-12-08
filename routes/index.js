import eventRoutes from './events';
import authRoutes from './auth';
import ticketRoutes from './tickets';

module.exports = (server) => {
  authRoutes(server);
  eventRoutes(server);
  ticketRoutes(server);
};
