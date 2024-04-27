const express = require('express');
const router = express.Router();
const { User } = require('../models');

// 中间件
// 上传文件模块
const multer = require('multer');
const path = require('path');

// 设置上传文件存储路径
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/blogBackground")
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
const upload = multer({ storage: storage }).single("blogBackground");

// 上传背景路由
router.post('/', upload, async (req, res) => {
  try {
    let file = req.file;
    let imgUrl = '/' + path.join('images/blogBackground', file.filename).replace(/\\/g, '/');

    // 获取用户的 _id
    const userId = req.body._id;

    // 根据 _id 更新用户的 blogBackground 字段
    const user = await User.findByIdAndUpdate(userId, {
      blogBackground: imgUrl
    }, { new: true });

    res.status(200).json({
      code: 0,
      msg: '上传成功',
      data: {
        blogBackground: user.blogBackground
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 1,
      msg: '上传失败',
      error: err.message
    });
  }
});



module.exports = router;