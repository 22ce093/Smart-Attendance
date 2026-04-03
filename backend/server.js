const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const College = require('./models/College');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const parseBoolean = (value = '') => String(value).trim().toLowerCase() === 'true';
const parseAllowedOrigins = (rawOrigins = '') =>
  String(rawOrigins)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

const allowedOrigins = parseAllowedOrigins(
  process.env.CORS_ORIGIN || process.env.APP_ORIGIN || ''
);

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (!isProduction && allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(requestOrigin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

// Seed Super Admin
const seedSuperAdmin = async () => {
  try {
    const shouldSeed = parseBoolean(process.env.SEED_SUPERADMIN);
    if (!shouldSeed) {
      return;
    }

    const superAdminEmail = String(process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
    const superAdminPassword = String(process.env.SUPERADMIN_PASSWORD || '');
    const superAdminName = String(process.env.SUPERADMIN_NAME || 'Super Admin').trim();

    if (!superAdminEmail || !superAdminPassword) {
      console.warn(
        'SEED_SUPERADMIN is true but SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD is missing. Skipping seed.'
      );
      return;
    }

    const existingAdmin = await User.findOne({ email: superAdminEmail });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(superAdminPassword, salt);
      
      await User.create({
        name: superAdminName,
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

const exposeDebugDbEndpoint =
  !isProduction || parseBoolean(process.env.ENABLE_DEBUG_ENDPOINTS);

if (exposeDebugDbEndpoint) {
  // Debug endpoint to inspect DB connection and collections.
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
}

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

app.use((error, req, res, next) => {
  if (error?.message === 'CORS origin is not allowed') {
    return res.status(403).json({ message: 'CORS origin is not allowed' });
  }

  return next(error);
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));

