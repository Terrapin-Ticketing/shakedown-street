import eventRoutes from './events';
import authRoutes from './auth';
import ticketRoutes from './tickets';
import paymentRoutes from './payment';

module.exports = (server) => {
  authRoutes(server);
  eventRoutes(server);
  ticketRoutes(server);
  paymentRoutes(server);
};
