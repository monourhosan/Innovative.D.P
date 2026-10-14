const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/v1/auth/login
 * Public login endpoint for Admin, Supervisor, and Team Member
 */
router.post('/login', (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both User ID and Password.'
      });
    }

    const trimmedUserId = String(user_id).trim();

    // Query user by user_id (case-insensitive)
    const user = db.queryOne('SELECT * FROM users WHERE LOWER(user_id) = LOWER(?)', trimmedUserId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid User ID or Password. Please try again.'
      });
    }

    if (user.is_active === 0) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Please contact your Administrator.'
      });
    }

    // Verify password
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid User ID or Password. Please try again.'
      });
    }

    // Determine supervisor_id if team member
    let supervisor_id = null;
    if (user.role === 'TEAM_MEMBER') {
      supervisor_id = user.created_by;
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
      role: user.role,
      supervisor_id
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '30d' });

    // Set cookie for web dashboard convenience
    res.cookie('token', token, {
      httpOnly: false, // Accessible to front-end JS for seamless API requests
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        full_name: user.full_name,
        role: user.role,
        supervisor_id
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user
 */
router.get('/me', requireAuth, (req, res) => {
  const user = db.queryOne(
    'SELECT id, user_id, full_name, role, is_active, created_by, created_at FROM users WHERE id = ?',
    req.user.id
  );

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  res.json({
    success: true,
    user: {
      ...user,
      supervisor_id: user.role === 'TEAM_MEMBER' ? user.created_by : null
    }
  });
});

/**
 * POST /api/v1/auth/change-password
 * Changes the current user's password
 */
router.post('/change-password', requireAuth, (req, res) => {
  try {
    const { current_password, new_password, new_user_id, new_full_name } = req.body;

    if (!new_password || new_password.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 4 characters long.'
      });
    }

    const user = db.queryOne('SELECT * FROM users WHERE id = ?', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // If current_password provided, verify it (unless admin updating their profile)
    if (current_password) {
      const isMatch = bcrypt.compareSync(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Current password does not match.' });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(new_password, salt);

    const updatedUserId = new_user_id ? String(new_user_id).trim() : user.user_id;
    const updatedFullName = new_full_name ? String(new_full_name).trim() : user.full_name;

    db.execute(
      'UPDATE users SET password_hash = ?, plain_password = ?, user_id = ?, full_name = ? WHERE id = ?',
      newHash,
      new_password,
      updatedUserId,
      updatedFullName,
      user.id
    );

    // Issue updated token
    const token = jwt.sign({
      id: user.id,
      user_id: updatedUserId,
      full_name: updatedFullName,
      role: user.role,
      supervisor_id: user.created_by
    }, config.jwtSecret, { expiresIn: '30d' });

    res.cookie('token', token, {
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Account details and password updated successfully.',
      token,
      user: {
        id: user.id,
        user_id: updatedUserId,
        full_name: updatedFullName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
