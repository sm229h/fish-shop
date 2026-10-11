import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'احراز هویت لازم است' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'توکن نامعتبر است' });
  }
}

export function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'دسترسی مدیر لازم است' });
    }
    next();
  });
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
