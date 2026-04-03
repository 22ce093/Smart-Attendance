const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const College = require('./models/College');

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
  console.log('Connected DB name:', mongoose.connection.name);
  seedSuperAdmin();
});

// Debug endpoint to inspect DB connection and collections
app.get('/api/debug-db', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(500).json({ message: 'No DB connection available' });

    const collections = await db.listCollections().toArray();
    const results = {};
    for (const col of collections) {
      try {
        const count = await db.collection(col.name).countDocuments();
        results[col.name] = count;
      } catch (err) {
        results[col.name] = `error: ${err.message}`;
      }
    }

    res.json({ database: mongoose.connection.name, collections: results });
  } catch (error) {
    console.error('Debug DB error:', error);
    res.status(500).json({ message: error.message || 'Failed to inspect DB' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: Date.now() }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// Public endpoint: list approved & active colleges for registration dropdown
app.get('/api/colleges-public', async (req, res) => {
  try {
    const colleges = await College.find({ status: 'APPROVED', isActive: true })
      .select('name _id departments')
      .lean()
      .sort({ createdAt: -1 });

    const collegeIds = colleges.map((college) => college._id);
    const userDepartmentRows = collegeIds.length
      ? await User.aggregate([
          {
            $match: {
              collegeId: { $in: collegeIds },
              role: { $in: ['teacher', 'student'] },
              department: { $exists: true, $ne: '' }
            }
          },
          {
            $group: {
              _id: '$collegeId',
              departments: { $addToSet: '$department' }
            }
          }
        ])
      : [];

    const departmentMap = new Map(
      userDepartmentRows.map((entry) => [String(entry._id), entry.departments || []])
    );

    const dedupeDepartments = (departments = []) => {
      const unique = [];
      for (const department of departments) {
        const normalized = String(department || '').trim().replace(/\s+/g, ' ');
        if (!normalized) {
          continue;
        }

        if (!unique.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
          unique.push(normalized);
        }
      }

      return unique.sort((left, right) => left.localeCompare(right));
    };

    const payload = colleges.map((college) => ({
      ...college,
      departments: dedupeDepartments([
        ...(college.departments || []),
        ...(departmentMap.get(String(college._id)) || [])
      ])
    }));

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '127.0.0.1', () => console.log(`Server running on http://127.0.0.1:${PORT}`));

