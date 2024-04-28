var express = require('express');
var router = express.Router();
const { Article } = require('../models/index');

// 中间件
// 上传文件模块
const multer = require('multer');
const path = require('path');

// 设置上传文件存储路径
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/blogImages")
  },
  filename: function (req, file, cb) {
    // 生成时间戳
    const timestamp = Date.now();
    // 生成随机数
    const randomNumber = Math.floor(Math.random() * 1000000);
    // 获取文件扩展名
    const ext = path.extname(file.originalname);
    // 拼接文件名
    const fileName = `${timestamp}${randomNumber}${ext}`;
    cb(null, fileName);
  }
})
// 根据存储设置,创建upload对象
const upload = multer({ storage: storage }).array("blogImages", 9);

/* 发布文章 */
router.post('/',upload, async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ code: 1, msg: '未上传任何文件' });
  }
  try {
    // 遍历上传的文件,生成图片 URL
    const imageUrls = req.files.map(file => {
      const imgUrl = '/' + path.join('images/blogImages', file.filename).replace(/\\/g, '/');
      return imgUrl;
    });

    const article = await Article.create({
      ...req.body,
      author: req.body.uid,
      tags: req.body.tags,
      imageUrl: imageUrls // 将图片 URL 存储到 imageUrl 字段
    });

    res.status(200).json({
      code: 0,
      msg: '发布文章成功',
      article
    });
  } catch (e) {
    console.error('发布文章失败:', e);
    res.status(500).json({
      code: 1,
      msg: '发布文章失败，服务器出错'
    });
  }
});

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
