const mongoose = require('mongoose'); 

mongoose.connect('mongodb://localhost/myBlog') 
.then((res) => {
  console.log('连接成功') 
}).catch((err) => { 
  console.log('连接失败', err) 
}) 