require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { initDatabase } = require('./models/database');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined
    },
    body: req.body,
    query: req.query
  });
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
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

// Ensure session directory exists
const sessionDir = process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '..');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

app.use(session(sessionConfig));

// Routes
const authRoutes = require('./routes/auth');
const lettersRoutes = require('./routes/letters');
const driveRoutes = require('./routes/drive');

app.use('/api/auth', authRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/drive', driveRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Letter App API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    clientUrl: process.env.CLIENT_URL,
    serverUrl: process.env.SERVER_URL
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
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
    await initDatabase();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer(); 
startServer(); 