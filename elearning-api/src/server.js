require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ 
        message: 'E-Learning API', 
        version: '1.0.0',
        endpoints: [
            '/api/health',
            '/api/users',
            '/api/categories',
            '/api/courses',
            '/api/lessons',
            '/api/enrollments',
            '/api/reviews'
        ]
    });
});

app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'E-Learning API is running' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
