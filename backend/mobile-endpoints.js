// mobile-endpoints.js - Mobile-specific API endpoints
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Mobile authentication middleware
const authenticateMobile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    // Check if session is still active
    const [sessions] = await req.db.execute(
      'SELECT * FROM mobile_sessions WHERE sessionToken = ? AND isActive = TRUE AND expiresAt > NOW()',
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    req.user = decoded;
    req.session = sessions[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Mobile login with device registration
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, deviceId, deviceType, deviceName, pushToken } = req.body;
    
    if (!email || !password || !deviceId || !deviceType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, deviceId, and deviceType are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Authenticate user
    const [users] = await req.db.execute(
      'SELECT * FROM students WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, deviceId },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    // Register/update device
    await req.db.execute(
      `INSERT INTO user_devices (userId, deviceId, deviceType, deviceName, pushToken, appVersion, osVersion) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       deviceName = VALUES(deviceName), 
       pushToken = VALUES(pushToken), 
       appVersion = VALUES(appVersion), 
       osVersion = VALUES(osVersion), 
       isActive = TRUE, 
       lastActive = CURRENT_TIMESTAMP`,
      [user.id, deviceId, deviceType, deviceName, pushToken, req.body.appVersion, req.body.osVersion]
    );

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await req.db.execute(
      'INSERT INTO mobile_sessions (userId, deviceId, sessionToken, refreshToken, expiresAt, refreshExpiresAt) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, deviceId, sessionToken, refreshToken, expiresAt, refreshExpiresAt]
    );

    // Update last login
    await req.db.execute(
      'UPDATE students SET lastLoginMobile = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture
        },
        tokens: {
          sessionToken,
          refreshToken,
          expiresAt: expiresAt.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Refresh token endpoint
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    // Check if refresh token is valid
    const [sessions] = await req.db.execute(
      'SELECT * FROM mobile_sessions WHERE refreshToken = ? AND isActive = TRUE AND refreshExpiresAt > NOW()',
      [refreshToken]
    );

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const session = sessions[0];

    // Generate new session token
    const newSessionToken = jwt.sign(
      { userId: session.userId, deviceId: session.deviceId },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update session
    await req.db.execute(
      'UPDATE mobile_sessions SET sessionToken = ?, expiresAt = ? WHERE id = ?',
      [newSessionToken, newExpiresAt, session.id]
    );

    res.json({
      success: true,
      data: {
        sessionToken: newSessionToken,
        expiresAt: newExpiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
});

// Mobile dashboard endpoint
router.get('/dashboard', authenticateMobile, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user courses with progress
    const [userCourses] = await req.db.execute(`
      SELECT 
        c.id, c.title, c.description, c.thumbnail,
        uc.accessGranted,
        COUNT(cm.id) as totalModules,
        COUNT(vp.id) as completedModules,
        COALESCE(AVG(vp.watchedPercentage), 0) as overallProgress
      FROM user_courses uc
      JOIN courses c ON uc.courseId = c.id
      LEFT JOIN course_modules cm ON c.id = cm.courseId
      LEFT JOIN video_progress vp ON cm.id = vp.moduleId AND vp.userId = ? AND vp.completed = TRUE
      WHERE uc.userId = ?
      GROUP BY c.id, c.title, c.description, c.thumbnail, uc.accessGranted
    `, [userId, userId]);

    // Get recent activity
    const [recentActivity] = await req.db.execute(`
      SELECT 
        cm.title as moduleTitle,
        c.title as courseTitle,
        vp.lastWatched,
        vp.watchedPercentage
      FROM video_progress vp
      JOIN course_modules cm ON vp.moduleId = cm.id
      JOIN courses c ON vp.courseId = c.id
      WHERE vp.userId = ?
      ORDER BY vp.lastWatched DESC
      LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      data: {
        courses: userCourses,
        recentActivity,
        stats: {
          totalCourses: userCourses.length,
          completedCourses: userCourses.filter(c => c.overallProgress >= 90).length,
          totalWatchTime: 0 // Calculate from video_progress
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard',
      code: 'DASHBOARD_ERROR'
    });
  }
});

// Video progress tracking
router.post('/video/progress', authenticateMobile, async (req, res) => {
  try {
    const { moduleId, courseId, watchedDuration, totalDuration, currentPosition } = req.body;
    const userId = req.user.userId;

    if (!moduleId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'moduleId and courseId are required',
        code: 'MISSING_FIELDS'
      });
    }

    const watchedPercentage = totalDuration > 0 ? (watchedDuration / totalDuration) * 100 : 0;
    const completed = watchedPercentage >= 90;

    await req.db.execute(`
      INSERT INTO video_progress 
      (userId, moduleId, courseId, watchedDuration, totalDuration, watchedPercentage, completed, lastWatchedPosition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      watchedDuration = GREATEST(watchedDuration, VALUES(watchedDuration)),
      totalDuration = VALUES(totalDuration),
      watchedPercentage = GREATEST(watchedPercentage, VALUES(watchedPercentage)),
      completed = completed OR VALUES(completed),
      lastWatchedPosition = VALUES(lastWatchedPosition),
      lastWatched = CURRENT_TIMESTAMP
    `, [userId, moduleId, courseId, watchedDuration, totalDuration, watchedPercentage, completed, currentPosition]);

    res.json({
      success: true,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      code: 'PROGRESS_ERROR'
    });
  }
});

// Sync offline data
router.post('/sync', authenticateMobile, async (req, res) => {
  try {
    const { syncData } = req.body;
    const userId = req.user.userId;
    const deviceId = req.user.deviceId;

    if (!Array.isArray(syncData)) {
      return res.status(400).json({
        success: false,
        message: 'syncData must be an array',
        code: 'INVALID_SYNC_DATA'
      });
    }

    const results = [];

    for (const item of syncData) {
      try {
        switch (item.action) {
          case 'video_progress':
            await req.db.execute(`
              INSERT INTO video_progress 
              (userId, moduleId, courseId, watchedDuration, totalDuration, watchedPercentage, completed, lastWatchedPosition)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
              watchedDuration = GREATEST(watchedDuration, VALUES(watchedDuration)),
              watchedPercentage = GREATEST(watchedPercentage, VALUES(watchedPercentage)),
              completed = completed OR VALUES(completed),
              lastWatchedPosition = VALUES(lastWatchedPosition)
            `, [userId, item.data.moduleId, item.data.courseId, item.data.watchedDuration, 
                item.data.totalDuration, item.data.watchedPercentage, item.data.completed, item.data.lastWatchedPosition]);
            break;

          default:
            throw new Error(`Unknown sync action: ${item.action}`);
        }

        results.push({ id: item.id, success: true });
      } catch (error) {
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      data: { results }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      code: 'SYNC_ERROR'
    });
  }
});

module.exports = router;