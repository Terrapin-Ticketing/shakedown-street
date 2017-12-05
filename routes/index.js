import eventRoutes from './events';
import authRoutes from './auth';

module.exports = (server) => {
  authRoutes(server);
  eventRoutes(server);
};
