/**
 * Created by xun on  2022/5/6 15:23.
 * description: bilibli
 * https://api.live.bilibili.com/room/v1/Danmu/getConf?room_id=21144080&platform=pc&player=web
 */

const NodeWebSocket = require("ws")
const pako = require('pako')

// 文本解码器
const textDecoder = new TextDecoder('utf-8');
const textEncoder = new TextEncoder('utf-8');
let timer = null;
let ws;


const encode = function (str, op) {
    let data = textEncoder.encode(str);
    let packetLen = 16 + data.byteLength;
    let header = [0, 0, 0, 0, 0, 16, 0, 1, 0, 0, 0, op, 0, 0, 0, 1]
    writeInt(header, 0, 4, packetLen)
    return (new Uint8Array(header.concat(...data))).buffer
}
// 从buffer中读取int
const readInt = function (buffer, start, len) {
    let result = 0
    for (let i = len - 1; i >= 0; i--) {
        result += Math.pow(256, len - i - 1) * buffer[start + i]
    }
    return result
}
const writeInt = function (buffer, start, len, value) {
    let i = 0
    while (i < len) {
        buffer[start + i] = value / Math.pow(256, len - i - 1)
        i++
    }
}
/**
 * blob blob数据
 * call 回调 解析数据会通过回调返回数据
 */
const decoder = function (blob) {
    let buffer = new Uint8Array(blob)
    let result = {}
    result.packetLen = readInt(buffer, 0, 4)
    result.headerLen = readInt(buffer, 4, 2)
    result.ver = readInt(buffer, 6, 2)
    result.op = readInt(buffer, 8, 4)
    result.seq = readInt(buffer, 12, 4)
    if (result.op === 5) {
        result.body = []
        let offset = 0;
        while (offset < buffer.length) {
            let packetLen = readInt(buffer, offset + 0, 4)
            let headerLen = 16// readInt(buffer,offset + 4,4)
            let data = buffer.slice(offset + headerLen, offset + packetLen);

            let body = "{}"
            if (result.ver == 2) {
                //协议版本为 2 时  数据有进行压缩 通过pako.js 进行解压
                body = textDecoder.decode(pako.inflate(data));
            } else {
                //协议版本为 0 时  数据没有进行压缩
                body = textDecoder.decode(data);
            }
            if (body) {
                // 同一条消息中可能存在多条信息，用正则筛出来
                const group = body.split(/[\x00-\x1f]+/);
                group.forEach(item => {
                    try {
                        result.body.push(JSON.parse(item));
                    } catch (e) {
                        // 忽略非JSON字符串，通常情况下为分隔符
                    }
                });
            }
            offset += packetLen;
        }
    } else if (result.op === 3) {
        result.body = {
            count: readInt(buffer, 16, 4)
        };
    }
    return result;
}

const decode = function (blob) {
    return new Promise(function (resolve, reject) {
        const result = decoder(blob);
        resolve(result)
    });
}


//组合认证数据包
function getCertification(json) {
    var bytes = str2bytes(json);  //字符串转bytes
    var n1 = new ArrayBuffer(bytes.length + 16)
    var i = new DataView(n1);
    i.setUint32(0, bytes.length + 16), //封包总大小
        i.setUint16(4, 16), //头部长度
        i.setUint16(6, 1), //协议版本
        i.setUint32(8, 7),  //操作码 7表示认证并加入房间
        i.setUint32(12, 1); //就1
    for (var r = 0; r < bytes.length; r++) {
        i.setUint8(16 + r, bytes[r]); //把要认证的数据添加进去
    }
    return i; //返回
}

//字符串转bytes //这个方法是从网上找的QAQ
function str2bytes(str) {
    const bytes = []
    let c
    const len = str.length
    for (let i = 0; i < len; i++) {
        c = str.charCodeAt(i)
        if (c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0)
            bytes.push(((c >> 12) & 0x3F) | 0x80)
            bytes.push(((c >> 6) & 0x3F) | 0x80)
            bytes.push((c & 0x3F) | 0x80)
        } else if (c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0)
            bytes.push(((c >> 6) & 0x3F) | 0x80)
            bytes.push((c & 0x3F) | 0x80)
        } else if (c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0)
            bytes.push((c & 0x3F) | 0x80)
        } else {
            bytes.push(c & 0xFF)
        }
    }
    return bytes
}


function initBiliWs(roomId, opts={
    onDanmaku:()=>{},
    onMessage:()=>{}
}) {

    const roomid = roomId
    const url = 'wss://broadcastlv.chat.bilibili.com/sub';
    // var key = document.getElementById("key").value;


    const json = {
        "uid": 0,
        "roomid": parseInt(roomid), //注意roomid是数字
        "protover": 1,
        "platform": "web",
        "clientver": "1.4.0",
        // "key": key
    }
   // console.log(JSON.stringify(json));

    if (ws) //防止重复连接
        ws.close()
    // 打开一个 web socket
    ws = new NodeWebSocket(url);

    // WebSocket连接成功回调
    ws.onopen = function () {
        console.log("WebSocket 已连接上");
        //组合认证数据包 并发送
        ws.send(getCertification(JSON.stringify(json)).buffer);
        //心跳包的定时器
        timer = setInterval(function () { //定时器 注意声明timer变量
            ws.send(encode('', 2));
        }, 30000)   //30秒
    };

    // WebSocket连接关闭回调
    ws.onclose = function () {
        console.log("连接已关闭");
        //要在连接关闭的时候停止 心跳包的 定时器
        if (timer != null)
            clearInterval(timer);
    };

    //WebSocket接收数据回调
    ws.onmessage = async function (msgEvent) {
        try {
            const packet = await decode(msgEvent.data);

            opts.onMessage&&opts.onMessage(packet)
            switch (packet.op) {
                case 8:
                    console.log('加入房间');
                    break;
                case 3:
                    const count = packet.body.count
                    console.log(`人气：${count}`);
                    break;
                case 5:
                    packet.body.forEach((body) => {
                        switch (body.cmd) {
                            case 'DANMU_MSG':

                               // console.log(`${body.info[2][1]}: ${body.info[1]}`, '收到弹幕');
                                opts.onDanmaku&&opts.onDanmaku(body.info)
                                break;
                            case 'SEND_GIFT':
                                console.log(`${body.data.uname} ${body.data.action} ${body.data.num} 个 ${body.data.giftName}`);
                                break;
                            case 'WELCOME':
                                console.log(`欢迎 ${body.data.uname}`);
                                break;
                            // 此处省略很多其他通知类型
                            default:
                            //console.log(body);
                        }
                    })
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.log(e, '解析msg异常')
        }
    };


}

module.exports={initBiliWs}
/*initBiliWs(10375360,{onDanmaku:(info)=>{
        console.log("uid: " + info[2][0]
            + "; 用户: " + info[2][1]
            + " ; 内容: " + info[1]);
    }})*/
