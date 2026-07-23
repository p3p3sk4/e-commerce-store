import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

function toPublicUser(user) {
  // Nunca devolver password_hash al cliente
  const { password_hash, ...rest } = user;
  return rest;
}

export async function register(req, res) {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !password) {
    return res.status(400).json({ error: 'full_name y password son obligatorios' });
  }
  if (!email && !phone) {
    return res.status(400).json({ error: 'Se requiere email o phone (al menos uno)' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone, role, is_active, created_at`,
      [full_name, email || null, phone || null, password_hash]
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({ user: toPublicUser(user), token });
  } catch (err) {
    if (err.code === '23505') {
      // Índice único parcial (email o phone) violado entre cuentas activas
      return res.status(409).json({ error: 'Ese correo o teléfono ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
}

export async function login(req, res) {
  const { identifier, password } = req.body; // identifier = email o phone

  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier y password son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users
       WHERE (email = $1 OR phone = $1) AND is_active = TRUE`,
      [identifier]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken(user);
    res.json({ user: toPublicUser(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

export async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.sub]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
}
