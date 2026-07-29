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
    const result = await pool.query(`
      SELECT 
        fl.food_name, 
        COUNT(DISTINCT sl.id) as symptom_count,
        ROUND(AVG(sl.severity)::numeric, 1) as avg_severity,
        COUNT(DISTINCT fl.id) as times_eaten
      FROM food_logs fl
      LEFT JOIN symptom_logs sl ON fl.id = sl.food_log_id
      WHERE fl.user_id = $1 AND sl.id IS NOT NULL
      GROUP BY fl.food_name
      ORDER BY symptom_count DESC
    `, [decoded.id]);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
