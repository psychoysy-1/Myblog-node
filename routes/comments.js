const express = require('express');
const router = express.Router();
const { Comment, Article } = require('../models/index');
const { body, validationResult } = require('express-validator');

/* 创建新评论 */
router.post('/create',
  [
    body('article_id').notEmpty().withMessage('文章ID不能为空'),
    body('content').notEmpty().withMessage('评论内容不能为空')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 1, msg: errors.array()[0].msg });
    }

    try {
      const newComment = await Comment.create({
        author: req.query.uid,
        article: req.body.article_id,
        content: req.body.content
      });

      // 更新文章的评论数量
      const updatedArticle = await Article.findByIdAndUpdate(
        req.body.article_id,
        { $inc: { commentCount: 1 } },
        { new: true }
      );

      res.json({
        code: 0,
        msg: '创建评论成功',
        data: {
          comment: newComment,
          article: updatedArticle
        }
      });
    } catch (e) {
      console.error('创建评论失败:', e);
      res.status(500).json({
        code: 1,
        msg: '创建评论失败, 服务器出错',
        error: e.message
      });
    }
  }
);

/* 根据文章id获取文章的评论列表 */
router.get('/', async (req, res, next) => {
  const { aid } = req.query;

  if (!aid) {
    return res.status(400).json({ code: 1, msg: '请提供文章 ID' });
  }

  try {
    const comments = await Comment.find({ article: aid })
      .populate("author", { password: 0 });

    res.status(200).json({
      code: 0,
      msg: '获取评论成功',
      data: comments
    });
  } catch (e) {
    console.error('获取评论失败:', e);
    res.status(500).json({
      code: 1,
      msg: '获取评论失败, 服务器出错',
      error: e.message
    });
  }
});

/* 根据评论id删除评论 */
router.delete('/', async (req, res, next) => {
  const { cid } = req.query;
  const uid = req.auth.userId; // 从 token 中获取当前登录用户的 ID

  try {
    // 查找评论并检查是否由当前用户发表
    const comment = await Comment.findById(cid);
    if (!comment) {
      return res.status(404).json({ code: 1, msg: '评论不存在' });
    }

    if (comment.author.toString() !== uid) {
      return res.status(403).json({ code: 1, msg: '无权删除该评论' });
    }

    // 删除评论
    await Comment.findByIdAndDelete(cid);

    // 更新文章的评论数量
    await Article.findByIdAndUpdate(comment.article, {
      $inc: { commentCount: -1 }
    });

    res.json({
      code: 0,
      msg: '删除评论成功'
    });
  } catch (e) {
    console.error('删除评论失败:', e);
    res.status(500).json({
      code: 1,
      msg: '删除评论失败, 服务器出错',
      error: e.message
    });
  }
});

module.exports = router;