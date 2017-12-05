import jwt from 'express-jwt';
import config from 'config';

export default jwt({ secret: config.secret });
