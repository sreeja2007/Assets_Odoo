const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

function signToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /auth/signup
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const hash   = await bcrypt.hash(password, rounds);
    const avatar = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, avatar)
       VALUES ($1, $2, $3, 'Employee', $4)
       RETURNING id, name, email, role, department_id, status, avatar, created_at`,
      [name.trim(), email.toLowerCase(), hash, avatar]
    );

    const user  = rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your admin.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /auth/me
async function me(req, res) {
  res.json({ user: req.user });
}

// PATCH /auth/me/password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });

    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const hash   = await bcrypt.hash(newPassword, rounds);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me, changePassword };
