const express = require('express');
const router = express.Router();
const {Article} = require('../models'); 

// const { PhotoWall } = require('../models'); 
// 中间件
// 上传文件模块
// const multer = require('multer');
// const path = require('path');
// // 设置上传文件存储路径
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images/photoWall")
//   },
//   filename: function (req, file, cb) {
//     // 生成时间戳
//   const timestamp = Date.now();
//   // 生成随机数
//   const randomNumber = Math.floor(Math.random() * 1000000);
//   // 获取文件扩展名
//   const ext = path.extname(file.originalname);
//   // 拼接文件名
//   const fileName = `${timestamp}${randomNumber}${ext}`;
//   cb(null, fileName);
//   }
// })
// // 根据存储设置,创建upload对象
// // single("img")支持一次上传一个图片,请求体中必须有img字段,参数值为图片
// const upload = multer({ storage: storage }).single("img");

// // 上传照片到照片墙
// router.post('/postPhotoWall', upload, async (req, res) => {
//   try {
//     let file = req.file;  //图片对象
//     let imgUrl = '/' + path.join('images/photoWall', file.filename).replace(/\\/g, '/');  //图片路径

//     // 创建新的 PhotoWall 文档
//     const newPhoto = new PhotoWall({
//       imageUrl: imgUrl,
//       author: res.id // 假设您已经在请求中获取了当前登录用户的 _id
//     });

//     // 保存新的 PhotoWall 文档
//     await newPhoto.save();

//     res.json({
//       code: 0,
//       msg: '上传成功',
//       data: imgUrl,
//       filename: file.filename
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       code: 1,
//       msg: '上传失败',
//       error: err.message
//     });
//   }
// });

// 获取照片墙图片
router.get('/getPhotoWall', async (req, res) => {
  try {
    // 从请求中获取用户 ID
    const userId = req.query.userId;

    // 根据用户 ID 查找该用户发表的所有文章
    const articles = await Article.find({ author: userId }, 'imageUrl');

    // 如果没有找到任何文章,直接返回空数组
    if (articles.length === 0) {
      return res.json({
        code: 0,
        msg: '获取成功',
        data: []
      });
    }

    // 将所有文章的 imageUrl 字段扁平化成一个数组
    let imageUrls = articles.reduce((acc, article) => {
      if (article.imageUrl.length > 0) {
        return [...acc, ...article.imageUrl];
      }
      return acc;
    }, []);

    // 如果 imageUrls 长度小于 12,则打乱顺序后返回全部
    const photoWallData = imageUrls.sort(() => Math.random() - 0.5);

    res.json({
      code: 0,
      msg: '获取成功',
      data: photoWallData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 1,
      msg: '获取失败',
      error: err.message
    });
  }
});

module.exports = router;