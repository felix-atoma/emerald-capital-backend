import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

export const generateAuthTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);
  
  return {
    accessToken: token,
    expiresIn: config.jwt.expire,
    tokenType: 'Bearer',
  };
};