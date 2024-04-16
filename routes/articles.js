var express = require('express');
var router = express.Router();

/* 发布文章 */
router.post('/', function(req, res, next) {
  console.log(req.body);
  res.json({
    code:1,
    msg: '发布文章成功'
  })
});

/* 根据用户id获取文章列表 */
router.get('/users/:uid', function(req, res, next) {
  console.log(req.params);
  res.json({
    code:1,
    msg: '根据用户id获取文章列表成功'
  })
});

/* 根据文章id获取文章详情 */
router.get('/:aid', function(req, res, next) {
  console.log(req.params);
  res.json({
    code:1,
    msg: '根据文章id获取文章详情成功'
  })
});

/* 根据文章id删除对应文章 */
router.delete('/:aid', function(req, res, next) {
  console.log(req.params);
  res.json({
    code:1,
    msg: '根据文章id删除对应文章成功'
  })
});

/* 根据文章id编辑对应文章 */
router.patch('/:aid', function(req, res, next) {
  console.log(req.params);
  console.log(req.body)
  res.json({
    code:1,
    msg: '根据文章id编辑对应文章成功'
  })
});



module.exports = router;
