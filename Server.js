/* ═══════════════════════════════════════════════════════════════════════
   FODMAP Helper - Backend API with Authentication
   Database: Neon PostgreSQL
   Features: User auth, food tracking, symptom logging
═══════════════════════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Neon PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ─────────────────────────────────────────────────────────────────────
// DATABASE INITIALIZATION
// ─────────────────────────────────────────────────────────────────────

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create food logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_name VARCHAR(255) NOT NULL,
        meal_type VARCHAR(50),
        notes TEXT,
        log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create symptom logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS symptom_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_log_id INTEGER REFERENCES food_logs(id) ON DELETE CASCADE,
        symptom_name VARCHAR(100) NOT NULL,
        severity INTEGER CHECK (severity >= 1 AND severity <= 10),
        notes TEXT,
        log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create favorite foods table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorite_foods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        food_name VARCHAR(255) NOT NULL,
        food_category VARCHAR(100),
        is_safe BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────
// MIDDLEWARE - Verify JWT Token
// ─────────────────────────────────────────────────────────────────────

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─────────────────────────────────────────────────────────────────────
// AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// Register user
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password_hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      user: { id: user.id, username: user.username, email: user.email }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// FOOD LOG ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// Create food log
app.post('/api/food-logs', verifyToken, async (req, res) => {
  const { food_name, meal_type, notes } = req.body;
  
  if (!food_name) {
    return res.status(400).json({ error: 'Food name required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO food_logs (user_id, food_name, meal_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, food_name, meal_type, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's food logs
app.get('/api/food-logs', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM food_logs WHERE user_id = $1 ORDER BY log_date DESC LIMIT 100',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get food logs with symptoms
app.get('/api/food-logs/detailed', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fl.id,
        fl.food_name,
        fl.meal_type,
        fl.notes,
        fl.log_date,
        json_agg(json_build_object('id', sl.id, 'symptom_name', sl.symptom_name, 'severity', sl.severity)) as symptoms
      FROM food_logs fl
      LEFT JOIN symptom_logs sl ON fl.id = sl.food_log_id
      WHERE fl.user_id = $1
      GROUP BY fl.id
      ORDER BY fl.log_date DESC
      LIMIT 100
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete food log
app.delete('/api/food-logs/:id', verifyToken, async (req, res) => {
  try {
    // First delete associated symptoms
    await pool.query('DELETE FROM symptom_logs WHERE food_log_id = $1', [req.params.id]);
    
    // Then delete food log
    const result = await pool.query(
      'DELETE FROM food_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food log not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// SYMPTOM LOG ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// Create symptom log
app.post('/api/symptom-logs', verifyToken, async (req, res) => {
  const { food_log_id, symptom_name, severity, notes } = req.body;
  
  if (!food_log_id || !symptom_name || !severity) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO symptom_logs (user_id, food_log_id, symptom_name, severity, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, food_log_id, symptom_name, severity, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get symptoms for food log
app.get('/api/symptom-logs/:food_log_id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM symptom_logs WHERE food_log_id = $1 AND user_id = $2',
      [req.params.food_log_id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete symptom log
app.delete('/api/symptom-logs/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM symptom_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Symptom log not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// ANALYTICS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// Get symptom summary
app.get('/api/analytics/symptoms', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        symptom_name, 
        COUNT(*) as count, 
        ROUND(AVG(severity)::numeric, 1) as avg_severity
      FROM symptom_logs 
      WHERE user_id = $1 
      GROUP BY symptom_name 
      ORDER BY count DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trigger foods (foods with symptoms)
app.get('/api/analytics/trigger-foods', verifyToken, async (req, res) => {
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
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get safe foods (foods without symptoms)
app.get('/api/analytics/safe-foods', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fl.food_name,
        COUNT(*) as times_eaten
      FROM food_logs fl
      LEFT JOIN symptom_logs sl ON fl.id = sl.food_log_id
      WHERE fl.user_id = $1 AND sl.id IS NULL
      GROUP BY fl.food_name
      ORDER BY times_eaten DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard summary
app.get('/api/dashboard/summary', verifyToken, async (req, res) => {
  try {
    const logs = await pool.query('SELECT COUNT(*) as count FROM food_logs WHERE user_id = $1', [req.user.id]);
    const symptoms = await pool.query('SELECT COUNT(*) as count FROM symptom_logs WHERE user_id = $1', [req.user.id]);
    const recentLogs = await pool.query('SELECT COUNT(*) as count FROM food_logs WHERE user_id = $1 AND log_date > NOW() - INTERVAL \'7 days\'', [req.user.id]);
    
    res.json({
      total_food_logs: parseInt(logs.rows[0].count),
      total_symptoms: parseInt(symptoms.rows[0].count),
      week_logs: parseInt(recentLogs.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// FAVORITE FOODS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// Add favorite food
app.post('/api/favorites', verifyToken, async (req, res) => {
  const { food_name, food_category, is_safe } = req.body;
  
  if (!food_name) {
    return res.status(400).json({ error: 'Food name required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO favorite_foods (user_id, food_name, food_category, is_safe) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, food_name, food_category, is_safe]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's favorite foods
app.get('/api/favorites', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM favorite_foods WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete favorite
app.delete('/api/favorites/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM favorite_foods WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ─────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FODMAP Helper API running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
