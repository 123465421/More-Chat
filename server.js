const express = require('express');
const app = express();
const http = require('http').Server(app);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 思考：socket.io作为一个函数，当前http作为参数传入生成一个io对象？
// io-server
var io = require("socket.io")(http);

var users = []; // 储存登录用户
var usersInfo = [];  // 存储用户姓名和头像

// 路由为/默认www静态文件夹
app.use('/', express.static(__dirname + '/www'));
 
// 每个连接的用户都有专有的socket
/* 
   io.emit(foo); //会触发所有用户的foo事件
   socket.emit(foo); //只触发当前用户的foo事件
   socket.broadcast.emit(foo); //触发除了当前用户的其他用户的foo事件
*/
io.on('connection', (socket)=> {
    // 渲染在线人员
    io.emit('disUser', usersInfo);

    // 登录，检测用户名
    socket.on('login', (user)=> {
        if(users.indexOf(user.name) > -1) { 
            socket.emit('loginError');
        } else {
            users.push(user.name);
            usersInfo.push(user);

            socket.emit('loginSuc');
            socket.nickname = user.name;
            io.emit('system', {
                name: user.name,
                status: '进入'
            });

   var dat = new Date();
   var year = dat.getFullYear();
   var month = dat.getMonth() + 1;
   var day = dat.getDate();
   var week= dat.getDay();
   var hour = dat.getHours();
   var minute = dat.getMinutes();
   var second = dat.getSeconds();
   var ms = dat.getMilliseconds();

            io.emit('disUser', usersInfo);
            console.log(users.length + ' user connect.');
            console.log('Time:'+ year + '-' + month + '-' + day + ' ' + week + ' ' + hour + ':' + minute + ':' + second + 's' + ' ' + ms +'ms');
        }
    });

// 检查在线用户数量
if (users.length === 0) {
  deleteAllUploadedFiles(); // 删除所有上传的文件
}

function deleteAllUploadedFiles() {
  fs.readdir('uploads/', (err, files) => {
    if (err) {
      console.error('无法读取文件列表！', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(__dirname, 'uploads', file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`无法删除文件 ${file}！`, err);
        } else {
          console.log(`成功删除缓存上传文件 ${file}`);
        }
      });
    });
  });
}

    // 发送窗口抖动
    socket.on('shake', ()=> {
        socket.emit('shake', {
            name: '您'
        });
        socket.broadcast.emit('shake', {
            name: socket.nickname
        });
    });

    // 发送消息事件
    socket.on('sendMsg', (data)=> {
        var img = '';
        for(var i = 0; i < usersInfo.length; i++) {
            if(usersInfo[i].name == socket.nickname) {
                img = usersInfo[i].img;
            }
        }
        socket.broadcast.emit('receiveMsg', {
            name: socket.nickname,
            img: img,
            msg: data.msg,
            color: data.color,
            type: data.type,
            side: 'left'
        });
        socket.emit('receiveMsg', {
            name: socket.nickname,
            img: img,
            msg: data.msg,
            color: data.color,
            type: data.type,
            side: 'right'
        });
    });  


    // 断开连接时
    socket.on('disconnect', ()=> {
        var index = users.indexOf(socket.nickname); 
        if(index > -1 ) {  // 避免是undefined
            users.splice(index, 1);  // 删除用户信息
            usersInfo.splice(index, 1);  // 删除用户信息

            io.emit('system', {  // 系统通知
                name: socket.nickname,
                status: '害羞的跑出'
            });



            io.emit('disUser', usersInfo);  // 重新渲染
            console.log('a user left.');
        }
    });
});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).send('未选择文件！');
  } else {
    res.send('文件上传成功！');
  }
});

// 获取已上传的文件列表
app.get('/filelist', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) {
      res.status(500).send('无法读取文件列表！');
    } else {
      res.json(files);
    }
  });
});

// 下载文件
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('文件未找到！');
    }
  });
});

// 删除文件
app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(500).send('无法删除文件！');
    } else {
      res.send('文件删除成功！');
    }
  });
});

http.listen(3000, function() {
    console.log('listen 3000 port.');
});
