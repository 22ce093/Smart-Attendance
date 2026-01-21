const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Seed Super Admin
const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = 'pneel5684@gmail.com';
    const existingAdmin = await User.findOne({ email: superAdminEmail });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Neel@7504', salt);
      
      await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'superadmin',
        status: 'APPROVED'
      });
      console.log('Super Admin seeded successfully');
    } else {
      console.log('Super Admin already exists');
    }
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

// Connect to DB and seed
connectDB().then(() => {
  seedSuperAdmin();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: Date.now() }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '127.0.0.1', () => console.log(`Server running on http://127.0.0.1:${PORT}`));

