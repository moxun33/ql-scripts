/*
 解析斗鱼 url
 cron 0 6 0/6 * * * l_douyu.js
*/
const {
  isJSONValid,
  COMM_CONF,
  fireFetch,
  encrypt,
  genUrlSearch,
  matchHtmlText,
} = require("./utils/utils.js");
const fs = require("fs");
//const { VM, VMScript } = require("vm2"); //vm2在qinglong中莫名错误
const path = require("path");
const nvm = require("node:vm");
const { Env } = require("./utils/ql");
const { sendNotify } = require("./utils/sendNotify");
const $ = new Env("斗鱼【直播】");
const DOMAINS = [
    'openflv-huos.douyucdn2.cn',
    'dyp2p-huos.douyucdn2.cn',//m3u8 only
  "hls1a-akm.douyucdn.cn", //m3u8 海外
  "hls3a-akm.douyucdn.cn", //m3u8 海外
  "hlsa-akm.douyucdn.cn", //m3u8 海外
  "hls3-akm.douyucdn.cn", //m3u8 海外
  "tc-tct1.douyucdn.cn", //m3u8 falied
  "hdltctwk.douyucdn2.cn", //flv falied
  "hw-tct.douyucdn.cn", //failed
  "hdltc1.douyucdn.cn", //failed
  "akm-tct.douyucdn.cn", //failed
];
const CUR_DOMAIN = DOMAINS[0];
const DEFAULT_MEDIA_TYPE='m3u8'
async function getDid() {
  try {
    const timeStamp = new Date().getTime();
    const url = `https://passport.douyu.com/lapi/did/api/get?client_id=25&_=${timeStamp}&callback=axiosJsonpCallback1`;

    const resp = await fireFetch(url, {
      headers: {
        referer: "https://m.douyu.com/",
      },
    });

    const re = /axiosJsonpCallback1\((.*)\)/;
    const match = re.exec(resp);
    const result = JSON.parse(match[1]);

    return result.data.did;
  } catch (e) {
    return "";
  }
}
//获取房间真实id,等初始信息
// 房间号通常为1~8位纯数字，浏览器地址栏中看到的房间号不一定是真实rid
const getRoomRealId = async (rid) => {
  try {
    const info = {},
      did = ""; //await getDid();
    info.did = "10000000000000000000000000001501";
    info.t10 = parseInt(Date.now() / 1000 + "") + "";
    info.t13 = Date.now() + "";
    const url = `https://m.douyu.com/${rid}`;
    const html = (await fireFetch(url)) || "",
      text = matchHtmlText(html, /{"rid":\d{1,8},"vipId":0/) + "}";
    if (isJSONValid(text)) {
      info.rid = JSON.parse(text)["rid"];
    }
    const ctx1 = {};
    // const vm = new VM();
    const encFuncStr = matchHtmlText(html, /(function ub98484234.*)\s(var.*)/);
    const ub9FuncRawStr = encFuncStr.replace(/eval.*;}/, "strc;}");
    const ub98Str = `${ub9FuncRawStr} ub98484234();`;
    const ub9Script1 = new nvm.Script(ub98Str);
    nvm.createContext(ctx1);
    ub9Script1.runInContext(ctx1);
    let ub9FuncStr1 = ctx1.ub98484234();

    const dyVerMatches = ub9FuncStr1.match(/v=\d{12}/);
    const v = dyVerMatches.length ? dyVerMatches[0].split("=").pop() : "";
    const rb = encrypt(info.rid + info.did + info.t10 + v);
    ub9FuncStr1 = ub9FuncStr1
      .replace("(function (", "function sign(")
      .replace("CryptoJS.MD5(cb).toString()", `"${rb}"`)
      .replace("rt;})", "rt;};");
    const signInvStr = `${ub9FuncStr1} sign("${info.rid}","${info.did}","${info.t10}");`;
    //  const signFuncStr = new VMScript(signInvStr);
    const ctx2 = {};
    const signFuncStr1 = new nvm.Script(signInvStr);
    nvm.createContext(ctx2);
    signFuncStr1.runInContext(ctx2);
    let query = ctx2.sign(info.rid + "", info.did + "", info.t10 + ""); // vm.run(signFuncStr);
    // console.log(query, "sign query");
    query += `&ver=219032101&rid=${info.rid}&rate=-1`;
    info.query = query;
    // fs.writeFileSync('./douyu.local.html', html)
    // info.html = html;
    return info;
  } catch (e) {
    console.log(e);
  }
};

//房间预览信息
async function getRoomPreviewInfo(rid) {
  const initInfo = (await getRoomRealId(rid)) || {};

  if (!initInfo.rid) {
    return {};
  }
  const realId = initInfo.rid + "",
    url = "https://playweb.douyucdn.cn/lapi/live/hlsH5Preview/" + realId,
    body = {
      rid: realId,
      did: initInfo.did,
    },
    auth = encrypt(realId + initInfo.t13),
    headers = {
      rid: realId,
      time: initInfo.t13,
      auth,
      "Content-Type": COMM_CONF.URLENCODED_FORM_TYPE,
    };
  initInfo.realId = realId;
  const res = await fireFetch(
    url,
    { method: "post", headers, body: genUrlSearch(body, true) },
    true
  );
  let error = res["error"],
    data = res["data"] || {},
    key = "";
  if (data) {
    const rtmp_live = data.rtmp_live || "";
    key = getRKey(rtmp_live);
  }
  return {
    error,
    key,
    initInfo,
    rtmp_url: data.rtmp_url,
    rtmp_live: data.rtmp_live,
  };
}

//获取stream信息
async function getRateStream(initInfo) {
  try {
    const query = initInfo?.query + "";
    if (!query) return {};
    // console.log(query);
    const url = "https://m.douyu.com/api/room/ratestream";
    const res = await fireFetch(
      `${url}?${query}`,
      {
        method: "post",
      },
      true
    );

    if (res.code !== 0) {
      console.log(res);
      return {};
    }

    return res?.data || {};
  } catch (e) {
    console.log(e, "get getRateStream error");
    return {};
  }
}
function getRKey(url = "") {
  const pUrl = url || "";
  return pUrl.split("?").shift().split("/").pop().split(".").shift();
}

//解析url
const getRoomLiveUrls = async (rid) => {
  const prevInfo = await getRoomPreviewInfo(rid);
   if (prevInfo.error !== 0) {
    if (prevInfo.error === 102) {
      console.log("房间不存在");
    } else if (prevInfo.error === 104) {
      console.log("房间未开播");
    } else {
      console.log("重新获取 url key");

      let data = await getRateStream(prevInfo.initInfo);

      prevInfo.key = getRKey(data.url);
    }
  }
 // prevInfo.key = getRKey(data.url);
  let real_url = { room_id: rid };

  // console.log(data);
  if (prevInfo.key) {
    const liveUrlObj = new URL(`http://${CUR_DOMAIN}`/*data.url || `http://${CUR_DOMAIN}`*/);
    const key = prevInfo.key?.replace("_900", ""),
      dir = liveUrlObj.pathname.split("/").filter(Boolean).shift() || "live",
      query = liveUrlObj.search||'?uuid=';
    //暂时使用临时url，2小时失效，配合定时器2小时运行一次
    real_url["m3u8"] = `${liveUrlObj.origin}/${dir}/${key}.m3u8${query}`;
    real_url["flv"] = `${liveUrlObj.origin}/${dir}/${key}.flv${query}`;
    real_url["xs"] = `${liveUrlObj.origin}/${dir}/${key}.xs${query}`;
  }
  return real_url;
};

//获取【一起看】的直播房间列表
const getYqkLiveRooms = async () => {
  //const cates = [290], rooms = [];
  const cates = [
      290, 2827, 2828, 2829, 2930, 2831, 2832, 2833, 2834, 2026, 2422, 2423,
      2424, 2025,
    ],
    rooms = [];
  for (const cateId of cates) {
    console.log(`获取一起看分类 ${cateId} 的房间列表`);
    const url = `https://capi.douyucdn.cn/api/v1/getThreeList?cate_id=${cateId}&offset=0&limit=100&client_sys=android`,
      res = await fireFetch(url, {}, true);
    if (res.error === 0 && Array.isArray(res.data)) {
      const list = res.data.map(
        ({ nickname, room_id, room_name, game_name }) => ({
          nickname,
          room_id,
          room_name,
          game_name,
        })
      );
      rooms.push(...list);
    }
  }
  return rooms;
};
//获取当前所有直播间
const getAllLiveRooms = async () => {
  const genUrl = (o = 0) => `http://capi.douyucdn.cn/api/v1/live?offset=${o}`;
  let offset = 0,
    page = 1,
    hasMore = true;
  const rooms = [];
  while (hasMore) {
    console.log(`正在获取第${page}页房间列表`);
    res = await fireFetch(genUrl(offset), {}, true);
    if (res.error === 0 && Array.isArray(res.data)) {
      const list = res.data.map(
        ({ nickname, room_id, room_name, game_name }) => ({
          nickname,
          room_id,
          room_name,
          game_name,
        })
      );
      rooms.push(...list);
    }
    hasMore = res.data?.length > 0;
    offset = page * 30;
    page++;
  }
  return rooms;
};
const pickUrl = (urlInfo) => {
  return urlInfo[urlInfo.mediaType] || urlInfo["m3u8"] || urlInfo["flv"];
};
/*getRoomLiveUrls(431460).then((res) => {
  console.log(res);
});*/
(async () => {
  const all = process?.env?.DOUYU_ALL,
    jsonList = [],
    DEF_ROOMS = [{ room_id: "9249162", mediaType: "flv" }],
    dynamicRooms = await (all ? getAllLiveRooms() : getYqkLiveRooms()),
    rooms = [...DEF_ROOMS, ...dynamicRooms];

  for (let i = 0; i <rooms.length; i++) {
    const room = rooms[i],
      key = room.room_id;

    console.log(`正在解析${i + 1}第个房间, ID: ${key}, 共${rooms.length}个`);

    //`http://zzy789.xyz/douyu1.php?id=${key}`
    const json = await getRoomLiveUrls(key); // JSON.parse(out.replace(/\'/g, "\""))

    const roomInfo = room.title
      ? room
      : await fireFetch(`https://www.douyu.com/betard/${key}`, {}, true);
    if (!(roomInfo && roomInfo.room)) {
      continue;
    }
    const name = room.title
      ? `【${room.nickname}】${room.room_name}`
      : "【" +
        roomInfo["room"]["owner_name"] +
        "】" +
        roomInfo["room"]["room_name"];
    // console.log(name);
    json.name = name || "未知名称";
    json.mediaType = room.mediaType || DEFAULT_MEDIA_TYPE;
    json.group = `斗鱼${room.game_name ? "【" + room.game_name + "】" : ""}`;
    console.log("房间解析结果:", json);
    jsonList.push(json);
  }
  fs.mkdirSync(path.resolve(__dirname, `./data`), { recursive: true });

  fs.writeFileSync(
    path.resolve(__dirname, `./data/douyu.json`),
    JSON.stringify(jsonList)
  );
  console.log("当前总数量", jsonList.length);
  sendNotify(
    `斗鱼${!all ? "【一起看】" : ""}`,
    `直播url解析执行完毕，共${jsonList.length}个`
  );
  const genTitle = (obj,groupSuffix='') =>
    `#EXTINF:-1 group-title="${obj.group}${groupSuffix}" tvg-id="${obj.room_id}", ${obj.name}`;
  const m3u_list = ["#EXTM3U"],
    m3uPrList = ["#EXTM3U"];
  for (const i in jsonList) {
    const obj = jsonList[i],
      url = pickUrl(obj);
    m3uPrList.push(
      genTitle(obj,'-pr'),
      `${
        process.env.LIVE_PROXY
          ? process.env.LIVE_PROXY
          : "http://192.168.3.7:35455"
      }/douyu/${obj.room_id}`
    );
    if (url) {
      m3u_list.push(genTitle(obj), url);
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, `./data/douyu.m3u`),
    m3u_list.join("\n")
  );
  fs.writeFileSync(
    path.resolve(__dirname, `./data/douyuPr.m3u`),
    m3uPrList.join("\n")
  );
})();
