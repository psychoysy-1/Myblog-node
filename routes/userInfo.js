const express = require('express');
const router = express.Router();
const { User, Follower,Article } = require('../models');
const canvas = require('canvas');

// 中间件
// 上传文件模块
const multer = require('multer');
const path = require('path');

// 设置上传文件存储路径
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/userAvatar")
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
// single("avatar")支持一次上传一个图片,请求体中必须有avatar字段,参数值为图片
const upload = multer({ storage: storage }).single("avatar");

/* 更新用户信息 */
router.put('/', upload, async (req, res) => {
  try {
    const { _id, signature } = req.body;
    const updateData = {};

    // 更新头像
    if (req.file) {
      updateData.avatar = path.join('images', 'userAvatar', req.file.filename).replace(/\\/g, '/');
    }

    // 更新其他信息
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.country !== undefined) updateData.country = req.body.country;
    if (req.body.nickname !== undefined) updateData.nickname = req.body.nickname;
    if (signature !== undefined) updateData.signature = signature; // 更新签名

    // 检查 _id 是否存在于数据库
    const user = await User.findById(_id);
    if (!user) {
      return res.status(403).json({
        code: 1,
        msg: '更新失败, 用户不存在'
      });
    }

    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(_id, updateData, { new: true });

    res.json({
      code: 0,
      msg: '更新成功',
      user: updatedUser
    });
  } catch (err) {
    console.error('更新用户信息出错:', err);
    res.status(500).json({
      code: 1,
      msg: '更新失败, 服务器出错',
      error: err.message
    });
  }
});

// 返回用户信息
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId, '-password');

    if (!user) {
      return res.status(404).json({
        code: 1,
        msg: '用户不存在'
      });
    }

    res.json({
      code: 0,
      msg: '获取用户信息成功',
      data: {
        _id: user._id,
        email: user.email,
        country: user.country,
        nickname: user.nickname,
        avatar: user.avatar,
        signature: user.signature
      }
    });
  } catch (err) {
    console.error('获取用户信息出错:', err);
    res.status(500).json({
      code: 1,
      msg: '获取用户信息失败, 服务器出错',
      error: err.message
    });
  }
});

// 生成验证码
router.get('/captcha', (req, res) => {
  const width = 100, height = 40;
  const captcha = canvas.createCanvas(width, height);
  const ctx = captcha.getContext('2d');

  // 生成随机验证码
  const text = Math.random().toString(36).substring(2, 6).toUpperCase();
  req.session.captcha = text; // 设置 captcha 字段到 req.session 上

  // 在画布上绘制验证码
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, 0, width, height);
  ctx.font = '30px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText(text, 10, 30);

  // 将 canvas 转换为 Base64 编码的图片数据
  const base64 = captcha.toDataURL('image/png');
  res.status(200).json({
    code: 0,
    msg: '获取验证码成功',
    data: {
      base64,
    }
  });
});

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const { _id, newPassword, captcha } = req.body;

    // 检查验证码是否正确
    console.log(req.session.captcha);
    if (captcha !== req.session.captcha) {
      return res.status(409).json({
        code: 1,
        msg: '验证码不正确'
      });
    }

    // 查找用户
    const user = await User.findById(_id);

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      code: 0,
      msg: '密码修改成功'
    });
  } catch (err) {
    console.error('修改密码出错:', err);
    res.status(500).json({
      code: 1,
      msg: '修改密码失败, 服务器出错',
      error: err.message
    });
  }
});

// 关注区域
// 关注路由
router.post('/follow', async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    // 检查关注者和被关注者是否存在
    const [follower, followee] = await Promise.all([
      User.findById(followerId),
      User.findById(followeeId)
    ]);

    if (!follower) {
      return res.status(404).json({
        code: 1,
        msg: '关注者不存在'
      });
    }

    if (!followee) {
      return res.status(404).json({
        code: 1,
        msg: '被关注者不存在'
      });
    }

    // 检查是否已经关注
    const existingFollow = await Follower.findOne({
      follower: followerId,
      followee: followeeId
    });

    if (existingFollow) {
      return res.status(400).json({
        code: 1,
        msg: '您已经关注了该用户'
      });
    }

    // 创建新的关注记录
    const newFollow = new Follower({
      follower: followerId,
      followee: followeeId
    });

    await newFollow.save();

    res.status(201).json({
      code: 0,
      msg: '关注成功',
      data: newFollow
    });
  } catch (err) {
    console.error('关注出错:', err);
    res.status(500).json({
      code: 1,
      msg: '关注失败, 服务器出错',
      error: err.message
    });
  }
});

// 查询关注状态
router.get('/follow', async (req, res) => {
  try {
    const { followerId, followeeId } = req.query;

    // 检查关注者和被关注者是否存在
    const [follower, followee] = await Promise.all([
      User.findById(followerId),
      User.findById(followeeId)
    ]);

    if (!follower) {
      return res.status(404).json({
        code: 1,
        msg: '关注者不存在'
      });
    }

    if (!followee) {
      return res.status(404).json({
        code: 1,
        msg: '被关注者不存在'
      });
    }

    // 检查是否已经关注
    const existingFollow = await Follower.findOne({
      follower: followerId,
      followee: followeeId
    });

    if (existingFollow) {
      return res.status(200).json({
        code: 0,
        msg: '已关注',
        data: true
      });
    } else {
      return res.status(200).json({
        code: 0,
        msg: '未关注',
        data: false
      });
    }
  } catch (err) {
    console.error('查询关注状态出错:', err);
    res.status(500).json({
      code: 1,
      msg: '查询关注状态失败, 服务器出错',
      error: err.message
    });
  }
});

// 取消关注
router.delete('/follow', async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    // 检查关注者和被关注者是否存在
    const [follower, followee] = await Promise.all([
      User.findById(followerId),
      User.findById(followeeId)
    ]);

    if (!follower) {
      return res.status(404).json({
        code: 1,
        msg: '关注者不存在'
      });
    }

    if (!followee) {
      return res.status(404).json({
        code: 1,
        msg: '被关注者不存在'
      });
    }

    // 检查是否已经关注
    const existingFollow = await Follower.findOneAndDelete({
      follower: followerId,
      followee: followeeId
    });

    if (!existingFollow) {
      return res.status(400).json({
        code: 1,
        msg: '您尚未关注该用户'
      });
    }

    res.status(200).json({
      code: 0,
      msg: '取消关注成功'
    });
  } catch (err) {
    console.error('取消关注出错:', err);
    res.status(500).json({
      code: 1,
      msg: '取消关注失败, 服务器出错',
      error: err.message
    });
  }
});

// 通知 返回关注人的所有文章
router.get('/followed-articles', async (req, res) => {
  try {
    const followerId = req.query.followerId;

    // 获取当前用户关注的所有用户 ID
    const followedUserIds = await Follower.find({ follower: followerId })
      .select('followee')
      .then(follows => follows.map(follow => follow.followee));

    // 聚合查询每个被关注用户的文章
    const articles = await Article.aggregate([
      {
        $match: {
          author: { $in: followedUserIds },
          isPrivate: false // 添加此条件,排除 isPrivate 为 true 的文章
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          createdAt: 1,
          'authorInfo._id': 1, // 返回用户 ID
          'authorInfo.nickname': 1,
          'authorInfo.avatar': 1
        }
      },
      {
        $sort: {
          createdAt: -1 // 按创建时间降序排列
        }
      }
    ]);

    res.status(200).json({
      code: 0,
      data: articles
    });
  } catch (err) {
    console.error('获取关注者文章出错:', err);
    res.status(500).json({
      code: 1,
      msg: '获取关注者文章失败, 服务器出错',
      error: err.message
    });
  }
});

module.exports = router;