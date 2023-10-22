$(function() {
    // io-client
    // 连接成功会触发服务器端的connection事件
    var socket = io(); 

    // 点击输入昵称，回车登录
    $('#name').keyup((ev)=> {
      if(ev.which == 13) {
        inputName();
      }
    });
    $('#nameBtn').click(inputName);
    // 登录成功，隐藏登录层
    socket.on('loginSuc', ()=> { 
      $('.name').hide(); 
    })
    socket.on('loginError', ()=> {
      alert('用户名已存在，请重新输入！');
      $('#name').val('');
    }); 

    function inputName() {
      var imgN = Math.floor(Math.random()*18)+1; // 随机分配头像
      if($('#name').val().trim()!=='')
          socket.emit('login', { 
            name: $('#name').val(),
            img: 'image/user' + imgN + '.jpg'
          });  // 触发登录事件
      return false; 
    }

    // 系统提示消息
    socket.on('system', (user)=> { 
      var data = new Date().toTimeString().substr(0, 8);
      $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${user.name}  ${user.status}了聊天室<span></p>`);
      var player = $('#audio')[0];  // 获取原生的HTML5音频播放器对象
      player.load();
      player.play();
      // 滚动条总是在最底部
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    // 监听抖动事件
    socket.on('shake', (user)=> { 
      var data = new Date().toTimeString().substr(0, 8);
      $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${user.name}发送了一个窗口抖M</span></p>`);
      shake();
      // 滚动条总是在最底部
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    // 显示在线人员
    socket.on('disUser', (usersInfo)=> {
      displayUser(usersInfo);
    });

    // 发送消息
    $('#sub').click(sendMsg);
    $('#m').keyup((ev)=> {
      if(ev.which == 13) {
        sendMsg();
      }
    });

    // 接收消息
    socket.on('receiveMsg', (obj)=> {  
      // 发送为图片
      if(obj.type == 'img') {
        $('#messages').append(`
          <li class='${obj.side}'>
            <img src="${obj.img}">
            <div>
              <span>${obj.name}</span>
              <p style="padding: 0;">${obj.msg}</p>
            </div>
          </li>
        `); 
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
        return;
      }

      // 发送为文件
      if(obj.type == 'file') {
        $('#messages').append(`
          <li class='${obj.side}'>
            <img src="${obj.img}">
            <div>
              <span>${obj.name}</span>
                <p style="padding: 0;">
                  <i class="fa fa-file-o" style="font-size:50px;margin:5px;"></i><br/>
                  <a href="/download/${obj.msg}">${obj.msg}</a>
               </p>
            </div>
          </li>
        `); 
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
        return;
      }

      // 发送为在线音乐
      if(obj.type == 'music') {
        var data = JSON.parse(obj.msg);
        var songUrl = data.songUrl;
        var songName = data.songName;
        var musicImg = data.musicImg;
        var songId = data.songId;
        $('#musicImg')[0].src = musicImg;
        $('#result').css({
           'background': "url('" + musicImg + "')",
           'backgroundAttachment': 'fixed',
           'backgroundRepeat': 'no-repeat',
           'backgroundSize': 'cover'
        });
        $('#messages').append(`
          <li class='${obj.side}'>
            <img src="${obj.img}">
            <div>
              <span>${obj.name}</span>
                <p style="padding: 0;">
                  <i class="fa fa-music" style="font-size:50px;margin:5px;"></i>${songName}<br>
               </p>
            </div>
          </li>
        `); 
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
        var audio = document.getElementById('musicaudio');

        //音乐播放器
        $(document).ready(function() {
          var currentTime = document.getElementById('currentTime');
          var totalTime = document.getElementById('totalTime');
          var seekBar = document.getElementById('seekBar');
          var volumeBar = document.getElementById('volume');
          var playPauseBtn = document.getElementById('playPauseBtn');

          audio.addEventListener('timeupdate', function() {
            var duration = audio.duration;
            var current = audio.currentTime;

            seekBar.value = (current / duration) * 100;
                currentTime.textContent = formatTime(current);
              });

              audio.addEventListener('loadedmetadata', function() {
                var duration = audio.duration;
                totalTime.textContent = formatTime(duration);
              });

              seekBar.addEventListener('input', function() {
                var seekTime = (seekBar.value / 100) * audio.duration;
                audio.currentTime = seekTime;
              });

              volumeBar.addEventListener('input', function() {
                audio.volume = volumeBar.value;
              });

              playPauseBtn.addEventListener('click', function() {
                if (audio.paused) {
                  audio.play();
                  playPauseBtn.textContent = '暂停';
                } else {
                  audio.pause();
                  playPauseBtn.textContent = '播放';
                }
              });

              // 自动播放音频
              audio.src =  songUrl;
              audio.load();
              audio.play();
              $('.audioPlayer').css('display','block');

              function formatTime(time) {
                var minutes = Math.floor(time / 60);
                var seconds = Math.floor(time % 60);
                return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
              }
            });

                // 添加歌词功能
                var lyric = $("#lyric");
                var index = $(this).parent().parent().index();

                // 拼接请求的URL
                var url = "https://moeyy.cn/music/api/lyric?id=" + songId + "&realIP=211.161.244.70";

                // 发送GET请求
                $.get(url, function(data) {
                    // 获取歌词
                    var lrc = data.lrc.lyric;

                    // 将歌词分割成每一行
                    var lines = lrc.split("\n");

                    // 创建一个div，用于显示歌词
                    var div = $("<div></div>");

                    // 遍历每一行歌词
                    for (var i = 0; i < lines.length; i++) {
                        // 获取当前行的歌词
                        var line = lines[i];

                        // 如果当前行的歌词为空，则跳过
                        if (line == "") {
                            continue;
                        }

                        // 获取当前行的时间戳（秒）
                        var timestamp = line.match(/\[(\d+):(\d+\.\d+)\]/);
                        if (timestamp) {
                            timestamp = parseInt(timestamp[1]) * 60 + parseFloat(timestamp[2]);
                        } else {
                            timestamp = 0;
                        }

                        // 获取当前行的歌词内容
                        var content = line.replace(/\[\d+:\d+\.\d+\]/, "");

                        // 创建一个span，用于显示当前行的歌词，并添加时间戳属性
                        var span = $("<span></span>").text(content).attr("data-timestamp", timestamp);

                        // 将span添加到div中
                        div.append(span);

                        // 将div添加到歌词元素中
                        lyric.html(div);
                    }
                });

                // 定义一个变量，用于记录当前突出的歌词行索引
                var currentIndex = -1;

                audio.addEventListener("timeupdate", function() {
                    // 获取当前播放时间
                    var currentTime = audio.currentTime;
                    // 获取所有歌词行
                    var lines = $("#lyric span");

                    // 遍历所有歌词行，找到当前播放时间所对应的歌词行
                    for (var i = 0; i < lines.length; i++) {
                        // 获取当前歌词行的时间戳（秒）
                        var timestamp = parseFloat(lines.eq(i).attr("data-timestamp"));

                        // 如果当前播放时间小于当前歌词行的时间戳，则说明当前歌词行还未到达
                        if (currentTime < timestamp) {
                            // 记录当前歌词行的索引
                            var index = i - 1;

                            // 如果当前歌词行的索引与记录的索引不同，则说明当前歌词行发生了变化
                            if (index != currentIndex) {
                                // 将记录的索引对应的歌词行取消突出样式
                                lines.eq(currentIndex).removeClass("active");

                                // 将当前歌词行添加突出样式
                                lines.eq(index).addClass("active");

                                // 更新记录的索引
                                currentIndex = index;

                                // 将当前突出的歌词滚动到歌词模块的中间位置（如果存在）
                                if (lines.eq(index).length > 0) {
                                  var top = lines.eq(index).position().top;
                                  var middle = $("#lyric").height() / 2;
                                  var scrollTop = top - middle + $("#lyric").scrollTop();
  
                                  $("#lyric").animate({
                                    scrollTop: scrollTop
                                  }, 300);
                                }

                            }

                            // 结束循环
                            break;
                        }
                    }
                });

        return;
      }


  // 提取文字中的表情加以渲染
  var msg = obj.msg;
  var content = '';
  while(msg.indexOf('[') > -1) {  // 其实更建议用正则将[]中的内容提取出来
    var start = msg.indexOf('[');
    var end = msg.indexOf(']');

    content += '<span>'+msg.substr(0, start)+'</span>';
    content += '<img src="image/emoji/emoji%20('+msg.substr(start+6, end-start-6)+').png">';
    msg = msg.substr(end+1, msg.length);
  }

  content += '<span>'+msg+'</span>';
  
  $('#messages').append(`
    <li class='${obj.side}'>
      <img src="${obj.img}">
      <div>
        <span>${obj.name}</span>
        <p style="color: ${obj.color};">${content}</p>
      </div>
    </li>
  `);
      // 滚动条总是在最底部
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    }); 


    // 发送消息
    var color = '#000000'; 
    function sendMsg() { 
      if($('#m').val() == '') {
        alert('请输入内容！');
        return false;
      }
      color = $('#color').val(); 
      socket.emit('sendMsg', {
        msg: $('#m').val(),
        color: color,
        type: 'text'
      });
      $('#m').val(''); 
      return false; 
    }

    var timer;
    function shake() {
      $('.main').addClass('shaking');
      clearTimeout(timer);
      timer = setTimeout(()=> {
        $('.main').removeClass('shaking');
      }, 500);
    }

    // 显示在线人员
    function displayUser(users) {
      $('#users').text(''); // 每次都要重新渲染
      if(!users.length) {
        $('.contacts p').show();
      } else {
        $('.contacts p').hide();
      }
      $('#num').text(users.length);
      for(var i = 0; i < users.length; i++) {
        var $html = `<li>
          <img src="${users[i].img}">
          <span>${users[i].name}</span>
        </li>`;
        $('#users').append($html);
      }
    }

    // 清空历史消息
    $('#clear').click(()=> {
      $('#messages').text('');
      socket.emit('disconnect');
    });
 
// 渲染表情
init();
function init() {
  for(var i = 1; i < 345; i++) {
    $('.emoji').append('<li id='+i+'><img src="image/emoji/emoji ('+(i)+').png" id='+i+'></li>');
  }
}

// 显示表情
$('#smile').click(()=> {
  $('.selectBox').css('display', "block");
});
$('#smile').dblclick((ev)=> { 
  $('.selectBox').css('display', "none");
});  
$('#m').click(()=> {
  $('.selectBox').css('display', "none");
}); 

    // 用户发送音乐
    $(document).ready(function() {
      // 给 input 类型绑定回车搜索事件
      $(document).keyup(function(event){
        if(event.keyCode ==13){
          $("#searchBtn").trigger("click");
        }
      });

      $('#searchBtn').click(function() {
        var keywords = $('#keywords').val();
        var searchUrl = 'https://moeyy.cn/music/api/search?keywords=' + keywords + '&realIP=211.161.244.70';

        $.get(searchUrl, function search(data) {
          var resultDiv = $('#result');
          resultDiv.empty();

          if (data.code == 200) {
            $.each(data.result.songs, function(index, song) {
              var name = song.name;
              var id = song.id;

              var listItem = $('<div id="listItem">');
              var nameText = $('<span>').text(name);
              var playButton = $('<button id="playButton">').text('播放').attr('data-play', id);

              listItem.append(nameText).append(playButton);
              resultDiv.append(listItem);
            });
          } else {
            resultDiv.text('搜索失败');
          }
        });
      });


      $(document).on('click', '[data-play]', function() {
        var songId = $(this).data('play');
        var getImgUrl = 'https://moeyy.cn/music/api/song/detail?ids=' + songId + '&realIP=211.161.244.70';
        var musicImg = $('#musicImg')[0];

        $.get(getImgUrl, function(data) {
          if (data.code == 200) {
            var imgUrl = data.songs[0].al.picUrl;
            var songName = data.songs[0].name;
            musicImg.src = imgUrl;
            $('#result').css({
               'background': "url('" + imgUrl + "')",
               'backgroundAttachment': 'fixed',
               'backgroundRepeat': 'no-repeat',
               'backgroundSize': 'cover'
                    });
            console.log('音乐封面: ' + imgUrl);
            console.log(songName);
        var playUrl = 'https://moeyy.cn/music/api/song/url?id=' + songId + '&realIP=211.161.244.70';
        var musicaudio = $('#musicaudio')[0];
        $.get(playUrl, function(data) {
          if (data.code == 200 && data.data.length > 0) {
            var songUrl = data.data[0].url;
            var json = '{"songUrl":"' + songUrl + '","songName":"' + songName + '","musicImg":"' + imgUrl + '","songId":"' + songId + '"}'
            console.log(JSON.stringify(json));

            socket.emit('sendMsg', {
              msg: json,
              color: color,
              type: 'music',
             });
          };
      });
          } else {
            console.log('获取音乐封面失败');
          }
        });

    });
 });

// 用户点击发送表情
$('.emoji li img').click((ev)=> {
    ev = ev || window.event;
    var src = ev.target.id;
    $('#m').val('[emoji'+src+']');
    $('.selectBox').css('display', "none");
});
    // 用户发送抖动
    $('.edit #shake').click(function() {
        socket.emit('shake');
    });

    // 用户上传图片
    $('#file').change(function() {
      var file = this.files[0];  // 上传单张图片

      var formData = new FormData();
      formData.append('file', file);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload');

      xhr.onload = function() {
        if (xhr.status === 200) {
          var imgUrl = file.name; // 获取服务器返回的图片路径

          var img = '<img class="sendImg" src="/download/' + imgUrl + '">';
            socket.emit('sendMsg', {  // 发送
            msg: img,
            color: color,
            type: 'img'
          });
       }
       else {
         console.log('图片上传失败！');
      }
    };

    xhr.send(formData);
   });

    // 用户上传文件
    $('#allfile').change(function() {
      var file = this.files[0];  // 上传一个文件

      var formData = new FormData();
      formData.append('file', file);

     var xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload');

      xhr.onload = function() {
        if (xhr.status === 200) {
          var fileName = file.name;
          console.log(fileName);

          socket.emit('sendMsg', {  // 发送
            msg: fileName,
            color: color,
            type: 'file'
          });
       }
       else {
         console.log('文件上传失败！');
      }
    };

    xhr.send(formData);
   });



// 显示播放音乐页面
$('#changeMusic').click(function() {
     $('#page').css('display','block');
});

$('#closePage').click(function() {
     $('#page').css('display','none');
});
});


        function sshowTime() {
            var date = new Date();

            // 年月日
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();

            // 时分秒
            var hour = date.getHours();
            var minute = date.getMinutes();
            var second = date.getSeconds();

            // 实时显示
            var element = document.getElementById('dateTime');
            element.innerHTML =  + year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + 's' +' ';
        }
        setInterval('sshowTime()');





const zh = `本站非常自豪的采用[More_Music]音乐播放器`
console.log(`%c${zh}`, 'background-image: linear-gradient(120deg, #fccb90 0%, #d57eeb 100%);color: #9370DB')
const biAscii = `
███╗   ███╗ ██████╗ ██████╗ ███████╗     ██████╗██╗  ██╗ █████╗ ████████╗     ██████╗ ██╗     ████████╗ ██╗
████╗ ████║██╔═══██╗██╔══██╗██╔════╝    ██╔════╝██║  ██║██╔══██╗╚══██╔══╝    ██╔═══██╗██║     ╚══██╔══╝███║
██╔████╔██║██║   ██║██████╔╝█████╗      ██║     ███████║███████║   ██║       ██║   ██║██║        ██║   ╚██║
██║╚██╔╝██║██║   ██║██╔══██╗██╔══╝      ██║     ██╔══██║██╔══██║   ██║       ██║   ██║██║        ██║    ██║
██║ ╚═╝ ██║╚██████╔╝██║  ██║███████╗    ╚██████╗██║  ██║██║  ██║   ██║       ╚██████╔╝███████╗██╗██║    ██║
╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝        ╚═════╝ ╚══════╝╚═╝╚═╝    ╚═╝                                                                                                      
`
console.log(`%c${biAscii}\n`, 'color: #00a1d6')

var styleTitle1 = `
font-size: 20px;
font-weight: 600;
font-family: JXZK;
color: #00a1d6;
text-shadow: 5px 5px 6px rgba(-55,-38,4,.3);
background-image: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
`
 
/* 内容代码 */
var title1 = 'This is More Chat OL.T1.   It Can Chat online. 版本:T1(Test 1)'

console.log(`%c${title1}`, styleTitle1)


        function buttonClick(){  
document.getElementById("data").style.visibility="hidden";
    }

window.setTimeout(function() {
  document.getElementById("data").style.visibility = "hidden";
}, 7000);

        function showTime() {
            var date = new Date();
            var ssecon = date.getMilliseconds();
            // 实时显示
            var element = document.getElementById('dateTime11');
            element.innerHTML =  + ssecon + 'ms';
        }
        setInterval('showTime()');



    function doHide(){
          var oDiv = document.getElementById("divTest");
          if (oDiv.style.display == "block"){
            oDiv.style.display = "none";
          }else {
            oDiv.style.display = "block";
          }
        }