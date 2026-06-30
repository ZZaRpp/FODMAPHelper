import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS food_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_name VARCHAR(255) NOT NULL,
        meal_type VARCHAR(50),
        notes TEXT,
        log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS symptom_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_log_id INTEGER REFERENCES food_logs(id) ON DELETE CASCADE,
        symptom_name VARCHAR(100) NOT NULL,
        severity INTEGER CHECK (severity >= 1 AND severity <= 10),
        notes TEXT,
        log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    // Tables already exist
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS headers - allow all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await initDatabase();

  const { method, url, body } = req;

  try {
    // REGISTER
    if (url.includes('/register') && method === 'POST') {
      const { username, email, password } = body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
      }

      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, password_hash]
      );

      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({ user, token });
    }

    // LOGIN
    if (url.includes('/login') && method === 'POST') {
      const { email, password } = body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        user: { id: user.id, username: user.username, email: user.email },
        token
      });
    }

    // GET CURRENT USER
    if (url.includes('/me') && method === 'GET') {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const result = await pool.query(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
