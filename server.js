require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const memberRoutes = require('./routes/members');
const reportsRouter = require('./routes/reports');

const app = express();

// Middleware
app.use(cors());

// File upload middleware
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    createParentPath: true,
    parseNested: true // Enable nested object parsing
}));

// Body parsing middleware - after fileUpload middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const cvsDir = path.join(uploadsDir, 'cvs');
if (!require('fs').existsSync(uploadsDir)){
    require('fs').mkdirSync(uploadsDir);
}
if (!require('fs').existsSync(cvsDir)){
    require('fs').mkdirSync(cvsDir);
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!require('fs').existsSync(publicDir)){
    require('fs').mkdirSync(publicDir);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Routes
app.use('/api/members', memberRoutes);
app.use('/reports', reportsRouter);

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve the registration form
app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'registration.html'));
});

// Serve report page
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'report.html'));
});

// Handle 404 errors
app.use((req, res) => {
    console.log('404 Error for:', req.url);
    res.status(404).send('404: Page not found');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('500: Internal Server Error');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
