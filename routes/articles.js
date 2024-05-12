var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const { Article } = require('../models/index');
const fs = require('fs');

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
router.post('/', upload, async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ code: 1, msg: '未上传任何文件' });
  }
  try {
    // 遍历上传的文件,生成图片 URL
    const imageUrls = req.files.map(file => {
      const imgUrl = '/' + path.join('images/blogImages', file.filename).replace(/\\/g, '/');
      return imgUrl;
    });

    // 将 tags 字段从字符串改为数组格式
    let tags = [];
    if (typeof req.body.tags === 'string') {
      tags = req.body.tags.split(',').map(tag => tag.trim());
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    }

    const article = await Article.create({
      ...req.body,
      author: req.body.uid,
      tags: tags,
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
router.post('/uid', async (req, res, next) => {
  try {
    const { author, tag, year, order = 0, search } = req.body;

    // 构建查询条件
    const query = { author: author };

    // 如果传入了 tag 参数,则添加 tag 查询条件
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // 如果传入了 year 参数,则添加年份查询条件
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // 如果传入了 search 参数,则添加搜索查询条件
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // 根据 order 参数进行排序
    const sortOrder = order === '1' ? '-createdAt' : 'createdAt';

    // 查询数据库,返回结果
    let articles = await Article.find(query)
      .sort(sortOrder)
      .populate('author', 'nickname avatar');

    // 如果传入了 tag 参数,则过滤出包含该 tag 的文章
    if (tag) {
      articles = articles.filter(article => article.tags.includes(tag));
    }

    res.status(200).json({
      code: 0,
      msg: '获取文章列表成功',
      articles
    });
  } catch (e) {
    console.error('获取文章列表失败:', e);
    res.status(500).json({
      code: 1,
      msg: '获取文章列表失败,服务器出错'
    });
  }
});

/* 根据用户id获取年份和标签列表 */
router.get('/tagsAndYears/:authorId', async (req, res, next) => {
  try {
    const { authorId } = req.params;

    const result = await Article.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(authorId), createdAt: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
          },
          count: { $count: {} },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          count: '$count',
        },
      },
      { $sort: { year: -1 } },
    ]);

    // 获取标签列表
    const tags = await Article.distinct('tags', { author: new mongoose.Types.ObjectId(authorId) });

    // 将年份和文章数量转换为数组
    const years = result.map(item => `${item.year}(${item.count})`);

    res.status(200).json({
      code: 0,
      msg: '获取标签和年份数据成功',
      data: {
        tags,
        years,
      },
    });
  } catch (e) {
    console.error('获取标签和年份数据失败:', e);
    res.status(500).json({
      code: 1,
      msg: '获取标签和年份数据失败，服务器出错',
    });
  }
});

/* 增加文章浏览量 */
router.patch('/views/:id', async (req, res, next) => {
  try {
    const articleId = req.params.id;
    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ code: 1, msg: '文章不存在' });
    }

    article.views += 1;
    await article.save();

    res.status(200).json({
      code: 0,
      msg: '文章浏览量增加成功',
      article
    });
  } catch (e) {
    console.error('增加文章浏览量失败:', e);
    res.status(500).json({
      code: 1,
      msg: '增加文章浏览量失败，服务器出错'
    });
  }
});

/* 根据文章id删除对应文章 */
router.delete('/:id', async (req, res, next) => {
  try {
    const articleId = req.params.id;
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ code: 1, msg: '文章不存在' });
    }

    // 首先删除文章对应的图片
    await Promise.all(article.imageUrl.map(async (url) => {
      const filePath = path.join(__dirname, '../public', url.slice(1));
      await fs.promises.unlink(filePath);
    }));

    // 然后删除文章记录
    await Article.findByIdAndDelete(articleId);

    res.status(200).json({ code: 0, msg: '删除文章成功' });
  } catch (e) {
    console.error('删除文章失败:', e);
    res.status(500).json({ code: 1, msg: '删除文章失败,服务器出错' });
  }
});

// 社交大厅所有用户的文章列表
router.get('/allArticles', async (req, res, next) => {
  try {
    // 查询数据库,返回所有文章
    const articles = await Article.find({})
      .sort('-createdAt')
      .populate('author', 'nickname avatar');

    res.status(200).json({
      code: 0,
      msg: '获取文章列表成功',
      articles
    });
  } catch (e) {
    console.error('获取文章列表失败:', e);
    res.status(500).json({
      code: 1,
      msg: '获取文章列表失败,服务器出错'
    });
  }
});

module.exports = router;
