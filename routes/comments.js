const express = require('express');
const router = express.Router();
const { Comment } = require('../models/index');


// 创建新评论
router.post('/create', function (req, res) {
  req.body;
  req.auth.uid;
  Comment.create({
    reply_user_id: req.auth.uid,
    article_id: req.body.article_id,
    content: req.body.content,
  }).then((r) => {
    res.json({
      code: 1,
      msg: '创建评论成功',
    })
  }).catch((err) => {
    res.status(500).json({
      code: 0,
      msg: '创建评论失败',
      error: err.message,
    })
  });
});

// 根据文章id获取文章的评论列表
router.get('/articles/:aid', function (req, res) {
  Comment.find({ article_id: req.params.aid }).populate("reply_user_id", { password: 0 }).then((r) => {
    res.json({
      code: 1,
      msg: '获取评论成功',
      data: r
    })
  }).catch((err) => {
    res.status(500).json({
      code: 0,
      msg: '获取评论失败',
      error: err.message
    })
  })
})

// 根据评论id删除评论
router.delete('/:cid', async function (req, res) {
  // 根据评论id找到对应的评论
  let commentObj = await Comment.findById(req.params.cid).populate("article_id")
  // 获取评论对应的文章的作者id
  let author_id = commentObj.article_id._id;
  // 如果评论的作者id和当前登录的用户id相同，则可以删除评论
  if (author_id == req.auth.uid) {
    let r = await Comment.findByIdAndDelete(req.params.cid)
    if (r) {
      res.json({
        code: 1,
        msg: '删除评论成功',
      })
    } else {
      res.json({
        code: 0,
        msg: '已经被删除',
      })
    }
  }
})

module.exports = router;