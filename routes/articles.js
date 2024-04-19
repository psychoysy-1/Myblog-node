var express = require('express');
var router = express.Router();
const { Article } = require('../models/index');
const { body, validationResult } = require('express-validator');

/* 发布文章 */
router.post('/',
  [
    body('title').notEmpty().withMessage('文章标题不能为空'),
    body('content').notEmpty().withMessage('文章内容不能为空'),
    body('tag').optional().isString().withMessage('标签必须是字符串')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 0, msg: errors.array()[0].msg });
    }

    try {
      // 将 author 直接添加到 req.body 中
      const article = await Article.create({
        ...req.body,
        author: req.body.uid
      });
      res.json({
        code: 1,
        msg: '发布文章成功',
        article
      });
    } catch (e) {
      console.error('发布文章失败:', e);
      res.status(500).json({
        code: 0,
        msg: '发布文章失败，服务器出错'
      });
    }
  }
);

/* 根据用户id获取文章列表 */
router.get('/articles', function (req, res, next) {
  const { uid } = req.query;

  Article.find({ author: uid })
    .populate('author', { password: 0 })
    .populate('comments')
    .then((articles) => {
      res.json({
        code: 1,
        msg: '根据用户id获取文章列表成功',
        data: articles
      });
    })
    .catch((e) => {
      console.error('根据用户id获取文章列表失败:', e);
      res.status(500).json({
        code: 0,
        msg: '根据用户id获取文章列表失败, 服务器出错'
      });
    });
});

/* 根据文章id获取文章详情 */
router.get('/', function (req, res, next) {
  const { aid } = req.query;

  Article.findById(aid)
    .populate('author', { password: 0 })
    .populate('comments')
    .then((article) => {
      if (!article) {
        return res.status(404).json({
          code: 0,
          msg: '未找到该文章'
        });
      }

      res.json({
        code: 1,
        msg: '根据文章id获取文章详情成功',
        data: article
      });
    })
    .catch((e) => {
      console.error('根据文章id获取文章详情失败:', e);
      res.status(500).json({
        code: 0,
        msg: '根据文章id获取文章详情失败, 服务器出错'
      });
    });
});


/* 根据文章id删除对应文章 */
router.delete('/', async (req, res, next) => {
  const { aid } = req.query;

  try {
    const article = await Article.findByIdAndDelete(aid);

    if (!article) {
      return res.status(404).json({
        code: 0,
        msg: '未找到该文章'
      });
    }

    res.json({
      code: 1,
      msg: '根据文章id删除对应文章成功'
    });
  } catch (e) {
    console.error('根据文章id删除对应文章失败:', e);
    
    // 判断错误类型,如果是 CastError 说明 aid 格式不正确
    if (e.name === 'CastError') {
      return res.status(400).json({
        code: 0,
        msg: '无效的文章 ID'
      });
    }

    res.status(500).json({
      code: 0,
      msg: '根据文章id删除对应文章失败, 服务器出错'
    });
  }
});

/* 根据文章id编辑对应文章 */
router.patch('/', async (req, res, next) => {
  const { aid } = req.query;
  const { title, content } = req.body;

  try {
    // 先验证 aid 是否是一个合法的文章 ID
    const article = await Article.findById(aid);
    if (!article) {
      return res.status(400).json({
        code: 0,
        msg: '无效的文章 ID'
      });
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      aid,
      { title, content },
      { new: true, runValidators: true }
    );

    res.json({
      code: 1,
      msg: '根据文章id编辑对应文章成功',
      data: updatedArticle
    });
  } catch (e) {
    console.error('根据文章id编辑对应文章失败:', e);
    res.status(500).json({
      code: 0,
      msg: '根据文章id编辑对应文章失败, 服务器出错'
    });
  }
});

module.exports = router;
