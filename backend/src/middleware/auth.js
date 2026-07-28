import { verifyToken } from '../utils/jwt.js';

// Verifica el Bearer token y adjunta el usuario decodificado a req.user
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload; // { sub, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Usar DESPUÉS de authenticate en rutas que solo el administrador puede usar
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' });
  }
  next();
}
