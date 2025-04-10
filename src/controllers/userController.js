const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/server');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const signToken = id => jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Please provide email and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new AppError('You are not logged in!', 401));
  const decoded = await promisify(jwt.verify)(token, config.jwtSecret);
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User no longer exists', 401));
  req.user = user;
  next();
});