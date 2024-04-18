var express = require('express');
var router = express.Router();

/* 注册请求 */
router.post('/', function(req, res, next) {
  console.log(res.body);
  res.json({
    code:1,
    msg:'注册成功'
  });
});

/* 登录请求 */
let jwt = require('jsonwebtoken');
router.get('/', function(req, res, next) {
  console.log(req.query); 
  if(req.query.username === 'admin' && req.query.password === '123456') {
  // 如果登录成功,返回jwt,在token中存入用户名
  let token = jwt.sign({username:"admin"},'ysy827469',{expiresIn:'30d',algorithm:'HS256'});
    res.json({
      code:1,
      msg:'登录成功',
      token
    });
  }else{
  res.json({
    code:0,
    msg:'登录失败'
  });
  }
});

module.exports = router;
