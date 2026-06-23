const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const verifyToken = require('./middleware/auth');
const requireRole = require('./middleware/rbac');
const tenantRoutes = require('./routes/tenantRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const dbRoutes = require('./routes/dbRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.get('/api/me', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/admin-only', verifyToken, requireRole('SUPER_ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome, Super Admin!' });
});

app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai/chat', aiChatRoutes);
app.use('/api/db', dbRoutes);

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Unable to connect to database:', err.message);
  });
