require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const memberRoutes = require('./routes/members');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    abortOnLimit: true
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const cvsDir = path.join(uploadsDir, 'cvs');
if (!require('fs').existsSync(uploadsDir)){
    require('fs').mkdirSync(uploadsDir);
}
if (!require('fs').existsSync(cvsDir)){
    require('fs').mkdirSync(cvsDir);
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Test database connection
const db = require('./config/database');
db.getConnection()
    .then(conn => {
        console.log('Database connected successfully');
        conn.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// Routes
app.use('/api', memberRoutes);

// Serve the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve the registration form
app.get('/registration', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'views', 'registration.html');
    console.log('Current directory:', __dirname);
    console.log('Attempting to serve registration form from:', filePath);
    
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
      console.error('Registration form file not found at:', filePath);
      return res.status(404).send('Registration form not found');
    }

    // Check file permissions
    try {
      require('fs').accessSync(filePath, require('fs').constants.R_OK);
      console.log('File exists and is readable');
    } catch (err) {
      console.error('File permission error:', err);
      return res.status(500).send('Error accessing registration form');
    }
    
    // Try to read file content
    try {
      const content = require('fs').readFileSync(filePath, 'utf8');
      console.log('File content length:', content.length);
      res.sendFile(filePath);
    } catch (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Error reading registration form');
    }
  } catch (error) {
    console.error('Error serving registration form:', error);
    res.status(500).send('Error loading registration form');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ 
        error: 'Something went wrong!',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
