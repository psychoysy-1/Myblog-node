const express = require('express');
const router = express.Router();

// 中间件
// 上传文件模块
const multer = require('multer');
const path = require('path');
// 设置上传文件存储路径
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images")
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
// single("img")支持一次上传一个图片,请求体中必须有img字段,参数值为图片
const upload = multer({ storage: storage }).single("img");


router.post('/', upload, (req, res) => {
  let file = req.file;  //图片对象
  let imgUrl = '/' + path.join('images', file.filename).replace(/\\/g, '/');  //图片路径
  res.json({
    code:1,
    msg:'上传成功',
    data:imgUrl
  })
})

module.exports = router;