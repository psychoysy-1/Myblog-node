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
    tag: String,
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// 创建文章模型
let Article = mongoose.model('Article', ArticleSchema);

// 定义评论表的结构
let CommentSchema = new Schema({
  content: String,
  article: { type: Schema.Types.ObjectId, ref: 'Article' },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 创建评论模型
let Comment = mongoose.model('Comment', CommentSchema);

// 定义用户表的结构
let UserSchema = new Schema({
  username: String,
  password: String,
  nickname: String,
}, {
  timestamps: true
});

// 创建用户模型
let User = mongoose.model('User', UserSchema);

// 添加虚拟属性
ArticleSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'article',
  justOne: false
});

// 设置 toObject 和 toJSON 选项以包含虚拟属性
ArticleSchema.set('toObject', { virtuals: true });
ArticleSchema.set('toJSON', { virtuals: true });

module.exports = {
  Article,
  Comment,
  User
};