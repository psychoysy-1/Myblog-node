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
router.get('/', function(req, res, next) {
  console.log(req.query);
  res.json({
    code:1,
    msg:'注册成功'
  });
});

module.exports = router;
