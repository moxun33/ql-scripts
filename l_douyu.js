/*
 解析斗鱼 url
 cron 0 6 18 * * * l_douyu.js
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
const { parseUrlSearch } = require("./utils/utils");
const $ = new Env("斗鱼【直播】");
const DOMAINS = [
  "tc-tct1.douyucdn.cn",
  "hw-tct.douyucdn.cn",
  "hdltc1.douyucdn.cn",
  //"hdltctwk.douyucdn2.cn",
  "akm-tct.douyucdn.cn",

  "vplay1a.douyucdn.cn",
];
//获取房间真实id,等初始信息
// 房间号通常为1~8位纯数字，浏览器地址栏中看到的房间号不一定是真实rid
const getRoomRealId = async (rid) => {
  try {
    const info = {};
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
    console.log(query, "sign query");
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
    data = res["data"],
    key = "";
  if (data) {
     const rtmp_live = data.rtmp_live || "";
    key = getRKey(rtmp_live);
  }
  return { error, key, initInfo ,rtmp_url:data.rtmp_url,rtmp_live:data.rtmp_live};
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
//根据html文件提取func_ub9,并运行
function getRKey(url = {}) {
  const pUrl = url || "";
  return pUrl.split("?").shift().split("/").pop().split(".").shift();
}

//解析url
const getRoomLiveUrls = async (rid) => {
  const prevInfo = await getRoomPreviewInfo(rid);
  let data = {};
  if (prevInfo.error !== 0) {
    if (prevInfo.error === 102) {
      console.log("房间不存在");
    } else if (prevInfo.error === 104) {
      console.log("房间未开播");
    } else {
      console.log("重新获取 url key");
      data = await getRateStream(prevInfo.initInfo);

      prevInfo.key = getRKey(data);
    }
  }
   const plQuery = parseUrlSearch(prevInfo.rtmp_live || data["url"]),
    { txSecret, txTime, ...rPlQuery } = plQuery;
  let real_url = { room_id: rid };
  if (prevInfo.key) {
    const domain = DOMAINS[0],
      //默认最高码率
      key = prevInfo.key?.replace("_900", ""),
      query = genUrlSearch(rPlQuery);

    real_url["m3u8"] = `http://${domain}/live/${key}.m3u8${query}`;
    real_url["flv"] = `http://${domain}/live/${key}.flv${query}`;
    // real_url["x-p2p"] = `http://${domain}/live/${key}.xs?uuid=`;
  }
  return real_url;
};

//批量解析房间

const DOUYU_ROOM_IDS = [
  9249162, 218859, 5581257, 9275635, 6655271, 122402, 252802, 20415, 248753,
  5033502, 5581257, 5423, 2793084, 1226741, 7882691, 562225, 6763930, 2436390,
  4290711, 5522351, 5127679, 7412199, 4246519, 2935323, 310926, 2337939, 4332,
  434971, 6566671, 85894, 2793084, 7494871, 8722254, 3637765, 223521, 7305938,
  431460, 2436390, 7270927, 7116591, 6079455, 4360438, 454867, 1339207, 4549169,
  9292503, 7701735, 6537888, 323876, 263824, 5423, 9611578, 9292499, 248753,
  20415, 3637778, 252802, 96577, 3637726, 315457, 10011042, 6140589, 8986148,
  2516864, 9650887, 8770422, 7356023, 413573, 36337, 8814650, 74374, 9826611,
  315131, 5129261, 4282654, 1165374, 3928, 1504768, 9292492, 6763930, 9683979,
];
const DOUYU_ROOM_IDS1 = [6566671, 5581257, 6079455];

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
    DEF_ROOMS = [
      /*{ room_id: "9249162", mediaType: "flv" }*/
    ],
    dynamicRooms = await (all ? getAllLiveRooms() : getYqkLiveRooms()),
    rooms = [...DEF_ROOMS, ...dynamicRooms];

  for (let i = 0; i < rooms.length; i++) {
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
    json.mediaType = room.mediaType || "m3u8";
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

  const m3u_list = ["#EXTM3U"];
  for (const i in jsonList) {
    const obj = jsonList[i],
      url = pickUrl(obj);
    if (url) {
      m3u_list.push(
        `#EXTINF:-1 group-title="${obj.group}" tvg-id="${obj.room_id}", ${obj.name}`,
        url
      );
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, `./data/douyu.m3u`),
    m3u_list.join("\n")
  );
})();
