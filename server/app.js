require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { initDatabase } = require('./models/database');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://whimsical-bombolone-ccd89f.netlify.app', process.env.CLIENT_URL].filter(Boolean)
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Session configuration
const sessionConfig = {
  store: new SQLiteStore({
    dir: process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '..'),
    db: 'sessions.sqlite',
    table: 'sessions'
  }),
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

app.use(session(sessionConfig));

// Routes
const authRoutes = require('./routes/auth');
const lettersRoutes = require('./routes/letters');
const driveRoutes = require('./routes/drive');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/drive', driveRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Letter App API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method
  });
  
  if (err.name === 'OAuth2Error') {
    console.error('OAuth Error:', err);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(err.message)}`);
  }
  
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
const port = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer(); 