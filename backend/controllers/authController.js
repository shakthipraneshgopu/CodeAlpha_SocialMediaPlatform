const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, USERS_FILE } = require('../config/db');

// ── Colour palette cycling for user avatars ──────────────────────────────────
const AVATAR_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6',
  '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4',
];

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    process.env.JWT_SECRET || 'fallback_secret_dev_only',
    { expiresIn: '7d' }
  );

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, name, bio, password } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ message: 'Username, name, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username may only contain letters, numbers, and underscores.' });
    }

    const users = readData(USERS_FILE);
    const exists = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (exists) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

    const newUser = {
      id: uuidv4(),
      username: username.toLowerCase(),
      name,
      bio: bio || '',
      avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
      initials,
      password: hashed,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeData(USERS_FILE, users);

    const token = generateToken(newUser);
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = readData(USERS_FILE);
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET /api/auth/me  (protected)
const getMe = (req, res) => {
  const users = readData(USERS_FILE);
  const user = users.find((u) => u.id === req.user.id);

  if (!user) return res.status(404).json({ message: 'User not found.' });

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
};

// GET /api/auth/profile/:username
const getProfile = (req, res) => {
  const users = readData(USERS_FILE);
  const user = users.find((u) => u.username === req.params.username.toLowerCase());

  if (!user) return res.status(404).json({ message: 'User not found.' });

  const { password: _, ...safeUser } = user;
  res.json(safeUser);
};

// PUT /api/auth/profile  (protected)
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const users = readData(USERS_FILE);
    const idx = users.findIndex((u) => u.id === req.user.id);

    if (idx === -1) return res.status(404).json({ message: 'User not found.' });

    if (name) {
      users[idx].name = name;
      users[idx].initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
    }
    if (bio !== undefined) users[idx].bio = bio;

    writeData(USERS_FILE, users);
    const { password: _, ...safeUser } = users[idx];
    res.json(safeUser);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};

module.exports = { register, login, getMe, getProfile, updateProfile };
