require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { initDatabase } = require('./models/database');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Request logging
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Session configuration
const sessionConfig = {
  store: new SQLiteStore({
    dir: dataDir,
    db: 'sessions.sqlite',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: parseInt(process.env.SESSION_EXPIRY) || 24 * 60 * 60 * 1000 // 24 hours
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionConfig.cookie.secure = true; // serve secure cookies
}

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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    path: req.path,
    method: req.method
  });
  
  if (err.name === 'OAuth2Error') {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(err.message)}`);
  }

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'Origin not allowed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors
    });
  }

  // Default error response
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
const port = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized successfully');

    // Start server
    app.listen(port, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
      console.log(`Client URL: ${process.env.CLIENT_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 