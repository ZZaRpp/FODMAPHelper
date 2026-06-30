import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

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

  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // CREATE FOOD LOG
    if (req.method === 'POST') {
      const { food_name, meal_type, notes } = req.body;

      if (!food_name) {
        return res.status(400).json({ error: 'Food name required' });
      }

      const result = await pool.query(
        'INSERT INTO food_logs (user_id, food_name, meal_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [decoded.id, food_name, meal_type, notes]
      );

      return res.status(200).json(result.rows[0]);
    }

    // GET FOOD LOGS
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM food_logs WHERE user_id = $1 ORDER BY log_date DESC LIMIT 100',
        [decoded.id]
      );

      return res.status(200).json(result.rows);
    }

    // DELETE FOOD LOG
    if (req.method === 'DELETE') {
      const id = req.url.split('/').pop();

      await pool.query('DELETE FROM symptom_logs WHERE food_log_id = $1', [id]);
      const result = await pool.query(
        'DELETE FROM food_logs WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
