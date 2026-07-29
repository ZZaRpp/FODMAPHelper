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
    // Get total food logs
    const logs = await pool.query('SELECT COUNT(*) as count FROM food_logs WHERE user_id = $1', [decoded.id]);
    
    // Get total symptoms
    const symptoms = await pool.query('SELECT COUNT(*) as count FROM symptom_logs WHERE user_id = $1', [decoded.id]);
    
    // Get this week's logs
    const recentLogs = await pool.query(
      'SELECT COUNT(*) as count FROM food_logs WHERE user_id = $1 AND log_date > NOW() - INTERVAL \'7 days\'',
      [decoded.id]
    );

    return res.status(200).json({
      total_food_logs: parseInt(logs.rows[0].count),
      total_symptoms: parseInt(symptoms.rows[0].count),
      week_logs: parseInt(recentLogs.rows[0].count)
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
