var createError = require('http-errors');
const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let { expressjwt } = require('express-jwt');
const cors = require('cors');
const session = require('express-session');

const articlesRouter = require('./routes/articles');
const usersRouter = require('./routes/users');
const uploadRouter = require('./routes/upload');
const commentsRouter = require('./routes/comments');
const photoWallRouter = require('./routes/photoWall');
const userInfoRouter = require('./routes/userInfo');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 解析jwt
app.use(expressjwt(
  {
    secret: 'ysy827469',
    algorithms: ['HS256']
  }).unless({
    path: [
      '/api/users/register',
      '/api/users/login',
      {
        url: /^\/api\/articles\/\w+/,
        methods: ['GET']
      },
      '/api/userInfo/captcha', // 添加动态图片验证码的路由地址
      /^\/captcha\/\w+$/
    ],
  })
);

// 配置 session 中间件
app.use(session({
  secret: 'your-super-secret-key', // 设置一个复杂且唯一的密钥
  resave: false, // 在每次请求时,是否强制重新保存 session
  saveUninitialized: true, // 是否保存未初始化的 session
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // session 过期时间, 这里设置为 24 小时
    secure: false, // 如果是 true, 则只有在 https 协议下才会发送 cookie
    httpOnly: false, // 如果是 true, 则客户端无法通过 Document.cookie 访问 cookie
    sameSite: 'strict', // 设置 cookie 的 SameSite 属性
    domain: 'localhost' // 设置 cookie 的作用域
  }
}));

// 配置 CORS 中间件
app.use(cors({
  origin: 'http://localhost:5173', // 设置允许的前端域名
  credentials: true, // 允许携带 cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // 允许的方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的头部
}));

app.use('/api/articles', articlesRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/photoWall', photoWallRouter);
app.use('/api/userInfo', userInfoRouter);

// 配置前端直接访问图片
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ code: 0, msg: '无效的token或没有传递token,请重新登录' })
  } else {
    next(err);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(405));
});

// error handler
app.use(function (err, req, res, next) {
  // 设置本地变量,只在开发环境中提供错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});

app.listen(4000, () => {
  console.log('Server is running on port 4000');
});

module.exports = app;
