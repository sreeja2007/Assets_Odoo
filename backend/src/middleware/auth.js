const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Verify JWT and attach req.user.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }

  const { rows } = await query(
    'SELECT id, name, email, role, department_id, status, avatar FROM users WHERE id = $1',
    [payload.sub]
  );

  if (!rows.length || rows[0].status === 'Inactive') {
    return res.status(401).json({ error: 'User not found or deactivated' });
  }

  req.user = rows[0];
  next();
}

/**
 * Restrict access to the given roles.
 * @param  {...string} roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
