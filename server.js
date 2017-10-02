//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var hoge = null;

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

// router.use(express.static(path.resolve(__dirname, 'client')));
var users = {demo: {state:'Free!', color: 'ffffff', username:'demo'}, nogaken: {state: 'Free!', color: 'ffffff', username: 'nogaken'}, kurosawa: {state:'Free!', color: 'ffffff', username: 'kurosawa'}, momose: {state: 'Free!', color: 'ffffff', username: 'momose'}};
var timers = {};
var sockets = [];

router.get('/', function(req, res) {
    var stream = fs.createReadStream('home.html');
    res.writeHead(200, {'Content-Type': 'text/html'});
    stream.pipe(res);
});

router.get('/demo/', function(req, res) {
    var stream = fs.createReadStream('demo.html');
    res.writeHead(200, {'Content-Type': 'text/html'});
    stream.pipe(res);
});

router.get(/\/user\/(.*?)\//, function(req, res){
  if(req.method=='GET') {
    // ユーザ名の取得
    var result = req.url.split("/").filter(e => Boolean(e));
    var username = result[1];
    
    // url_parameterの取得
    var url_parts = url.parse(req.url,true);
    var params = url_parts.query;
    
    // 初期値
    var state = params.state || 'free';
    var after_state = params.after_state || 'Free!';
    var color = params.color || 'ffffff';
    var s_time = new Date().getTime();
    var time = Number(params.expired) || 0;
    
    // 決めたやつ
    switch (state){
      case "free":
        state = "Free!";
        color = "ffffff";
        time = undefined;
        break;
      case "busy":
        state = "Busy...";
        color = "ff0000";
        
        if(time == ''){
          time = 3000000; // 初期値は５０分
        }
        
        break;
    }
    state = state.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    if (state.length > 10) {
      // stateが10文字より大きい場合
      state = state.substr(0, 10);
    }

    var data = { state: state, color: color, username: username, start_time: s_time, expired: time};
    
    // タイマー中にデータが送られてきたらリセット
    if(timers[username]){
       clearTimeout(timers[username]);
    }
    
    if(time > 0){
      timers[username] = setTimeout((_state, _username, _s_time) => {
        var _data = { state: _state, color: 'ffffff', username: _username, start_time: _s_time };
        users[_username] = _data;
        broadcast('update', _data);
      }, time, after_state, username, s_time + time);
    }
    
    // パラメータが設定されている時，更新
    // パラメータが設定されていない場合は，現状態の表示
    var size = 0;
    for (var prop in params) { size++; }
    if(size != 0){
      // データの送信(ユーザに)
      broadcast('update', data);
      
      // データの更新
      users[username] = data;
      
      res.writeHead(200, {
          "Content-Type": "text/plain"
      });
      res.write("OK!");
      res.end();
    } else {
      // 初期化
      var stream = fs.createReadStream('index.html');
      res.writeHead(200, {'Content-Type': 'text/html'});
      stream.pipe(res);
      
      // すでにデータがあればそれを表示
      // なければ初期化
      if(!users[username]){
        users[username] = data;
      }
    }
 }
});

io.on('connection', function (socket) {
    sockets.push(socket);
    
    for (var key in users) {
      socket.emit('update', users[key]);
    }

    socket.on('getList', function () {
      socket.emit('showList', users);
    });

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
    });
    
  });

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Hackathon server listening at", addr.address + ":" + addr.port);
});


