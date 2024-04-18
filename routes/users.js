const express = require('express');
const router = express.Router();
const { User } = require('../models/index');
let jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');

// 生成图形验证码
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    fontSize: 50,
    width: 100,
    height: 34,
    noise: 3,
    color: true
  });
  req.session.captcha = captcha.text.toLowerCase();
  res.type('svg');
  res.status(200).send(captcha.data);
});

/* 注册请求 */
router.post('/', function(req, res, next) {
  const { username, password, nickname,captcha } = req.body;
  // 验证图形验证码
  if (captcha.toLowerCase() !== req.session.captcha) {
    return res.status(400).json({
      code: 0,
      msg: '验证码错误'
    });
  }
  // 注册逻辑
  if (username && password && nickname) {
    User.create(req.body)
      .then((user) => {
        res.json({
          code: 1,
          msg: '注册成功',
          user
        });
      })
      .catch((err) => {
        res.status(400).json({
          code: 0,
          msg: '注册失败',
          error: err.message
        });
      });
  } else {
    res.status(400).json({
      code: 0,
      msg: '注册失败, 缺少必需参数'
    });
  }
});

/* 登录请求 */
router.get('/', async function(req, res, next) {
  const { username, password } = req.query;

  // 参数判断
  if (!username || !password) {
    return res.status(400).json({
      code: 0,
      msg: '登录失败, 缺少必需参数'
    });
  }

  try {
    // 与数据库对比
    const user = await User.findOne({ username, password });

    // 账号密码校验
    if (user) {
      // 如果登录成功,返回 JWT 令牌,在 token 中存入用户名和 ID
      let token = jwt.sign({ username: user.username, userId: user._id }, 'ysy827469', { expiresIn: '30d', algorithm: 'HS256' });
      res.json({
        code: 1,
        msg: '登录成功',
        token
      });
    } else {
      res.status(401).json({
        code: 0,
        msg: '登录失败, 账号或密码错误'
      });
    }
  } catch (err) {
    console.error('登录出错:', err);
    res.status(500).json({
      code: 0,
      msg: '登录失败, 服务器出错'
    });
  }
});

module.exports = router;