/**
 * Created by xun on  2022/5/7 9:33.
 * description: index
 */
const client = require('./client');

client.STT = require('./stt');
client.Packet = require('./packet');



//设置房间号，初始化
const roomId = 4549169
const opts = {
    debug: true,  // 默认关闭 false
}
const room = new client(roomId, opts)

//系统事件
room.on('connect', function () {
    console.log('[connect] roomId=%s', this.roomId)
})
room.on('disconnect', function () {
    console.log('[disconnect] roomId=%s', this.roomId)
})
room.on('error', function(err) {
    console.log('[error] roomId=%s', this.roomId)
})

//消息事件
room.on('chatmsg', function(res) {
    console.log('[chatmsg]', ` [${res.nn}] ${res.txt}`)
})
room.on('loginres', function(res) {
    console.log('[loginres]', '登录成功')
})
room.on('uenter', function(res) {
   // console.log('[uenter]', `${res.nn}进入房间`)
})

//开始监听
room.run()