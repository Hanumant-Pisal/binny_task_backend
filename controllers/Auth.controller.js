const User = require("../models/User.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QueueService = require("../services/QueueService");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  // Input validation
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long' });
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const job = await QueueService.addJob('user_insert', {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      role: 'user',
      joinDate: new Date(),
      profilePicture: ''
    }, 2);

    res.status(202).json({ 
      message: 'User registration queued successfully',
      jobId: job._id
    });
  } catch (error) {
    console.error('Error queuing user registration:', error);
    res.status(500).json({ message: 'Failed to queue user registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  // Input validation
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};
