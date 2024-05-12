var express = require('express');
var router = express.Router();
const { Article } = require('../models/index');

// 获取月度文章数量和标签数据
router.get('/monthlyArticleCount', async (req, res, next) => {
  try {
    const monthlyArticleCount = await Article.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          count: '$count',
        },
      },
      { $sort: { month: 1 } },
    ]);

    const flattenedTags = await Article.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $count: {} } } },
      { $project: { _id: 0, name: '$_id', value: '$count' } },
      { $sort: { value: -1 } },
    ]);

    // 将月度文章数量数据整理成一个数组返回
    const monthlyCount = new Array(12).fill(0);
    monthlyArticleCount.forEach(item => {
      monthlyCount[item.month - 1] = item.count;
    });

    res.status(200).json({
      code: 0,
      msg: '获取月度文章数量和标签数据成功',
      data: {
        monthlyCount,
        flattenedTags,
      },
    });
  } catch (e) {
    console.error('获取月度文章数量和标签数据失败:', e);
    res.status(500).json({
      code: 1,
      msg: '获取月度文章数量和标签数据失败，服务器出错',
    });
  }
});

module.exports = router;