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

// Routes
app.use('/api', memberRoutes);

// Serve the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve the registration form
app.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'registration.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
