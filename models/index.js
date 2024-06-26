const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/myBlog')
  .then((res) => {
    console.log('连接成功');
  }).catch((err) => {
    console.log('连接失败', err);
  });
let Schema = mongoose.Schema;

// 定义文章表的结构
let ArticleSchema = new Schema(
  {
    title: String,
    content: String,
    // 文章表作者id关联用户表中id
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: [String], // 修改为数组类型
    imageUrl: [String], // 新增图片 URL 字段
    views: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// 创建文章模型
let Article = mongoose.model('Article', ArticleSchema);


// 定义评论表的结构
let CommentSchema = new Schema({
  content: String,
  article: { type: Schema.Types.ObjectId, ref: 'Article' },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 创建评论模型
let Comment = mongoose.model('Comment', CommentSchema);


// 定义用户表的结构
let UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  nickname: String,
  avatar: String, // 头像地址
  email: String, // 邮箱
  country: String, // 国家
  blogBackground: String, // 博客背景图
  signature: String, // 个性签名
}, {
  timestamps: true
});
UserSchema.index({ username: 1 }, { unique: true }); // 为 username 字段创建唯一索引
// 创建用户模型
let User = mongoose.model('User', UserSchema);

// // 定义照片墙表的结构
// let PhotoWallSchema = new Schema({
//   imageUrl: String, // 图片地址
//   author: { type: Schema.Types.ObjectId, ref: 'User' }, // 图片上传者
//   createdAt: { type: Date, default: Date.now }, // 上传时间
//   updatedAt: { type: Date, default: Date.now } // 更新时间
// });
// // 创建照片墙模型
// let PhotoWall = mongoose.model('PhotoWall', PhotoWallSchema);

// 关注表结构
let FollowerSchema = new Schema({
  follower: { type: Schema.Types.ObjectId, ref: 'User' }, // 关注者
  followee: { type: Schema.Types.ObjectId, ref: 'User' }, // 被关注者
  createdAt: { type: Date, default: Date.now } // 关注时间
});

let Follower = mongoose.model('Follower', FollowerSchema);

module.exports = {
  Article,
  Comment,
  User,
  Follower
};