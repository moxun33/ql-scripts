/*
b站解析
cron 0 6 17 * * * l_bilibili.js
*/
/*
# 获取哔哩哔哩直播的真实流媒体地址，默认获取直播间提供的最高画质
# qn=150高清
# qn=250超清
# qn=400蓝光
# qn=10000原画
*/
//单个url解析
//有些地址无法在PotPlayer播放，建议换个播放器试试
const { fireFetch, genUrlSearch, parseUrlSearch } = require("./utils/utils.js");
const path = require("path");
const fs = require("fs");
const { Env } = require("./utils/ql");
const { sendNotify } = require("./utils/sendNotify");
const $ = new Env("B站【影音馆】");

//判断json是否有效
const isJSONValid = str => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 1、获取房间的真实id
 */
async function getRoomRealId(rid) {
  const url = `https://api.live.bilibili.com/room/v1/Room/room_init?id=${rid}`;
  const res = await fireFetch(url, {}, true);
  if (res.code !== 0) {
    console.log(rid, res.msg);
    return rid;
  }

  const data = res.data || {},
    { live_status, room_id } = data;
  if (live_status !== 1) {
    console.log(rid, "未开播");
    return rid;
  }

  return room_id;
}

/**
 * 2、房间的直播信息 url列表
 */
async function getRoomLiveUrl(rid, currentQn = 10000) {
  const realId = await getRoomRealId(rid);
  if (!realId) {
    return {};
  }
  const getStreamData = async maxQn => {
    const url =
        "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo",
      param = {
        room_id: realId,
        protocol: "0,1",
        format: "0,1,2",
        codec: "0,1",
        qn: maxQn,
        platform: "web",
        ptype: 8,
      };

    const res = await fireFetch(url + genUrlSearch(param), {}, true);
    if (res.code !== 0) {
      console.log(rid, res.msg, "获取房间直播信息失败");
      return {};
    }
    return res.data || {};
  };
  let data = await getStreamData(currentQn),
    qn_max = 0,
    streamInfo = data?.playurl_info?.playurl?.stream || [];
  for (let i = 0; i < streamInfo.length; i++) {
    const item = streamInfo[i],
      accept_qn = item["format"][0]["codec"][0]["accept_qn"] || [];
    /*  for (const qn in accept_qn) {
      qn_max = qn > qn_max ? qn : qn_max;
    } */
    qn_max = accept_qn.sort((a, b) => a - b).pop();
  }
  if (qn_max !== currentQn) {
    data = await getStreamData(qn_max);
    streamInfo = data?.playurl_info?.playurl?.stream || [];
  }
  const streamUrls = {};
  // flv流无法播放，暂修改成获取hls格式的流
  for (let i = 0; i < streamInfo.length; i++) {
    const matchFormat = v => v === "fmp4" || v === "ts";
    const stream = streamInfo[i],
      formats = stream.format.filter(item => matchFormat(item.format_name));
    format = formats[formats.length - 1] || {};

    if (matchFormat(format.format_name || "")) {
      // console.log( item["format"].pop());
      const codecItem = format["codec"][0] || {},
        base_url = codecItem["base_url"],
        url_info = codecItem["url_info"] || [];
      for (let j = 0; j < url_info.length; j++) {
        const info = url_info[j],
          host = info["host"],
          extra = info["extra"],
          extraObj = parseUrlSearch("?" + extra.substring(0)),
          url = host + base_url.split("?").shift();
        const signs = genUrlSearch(
          {
            sign: extraObj.sign,
            cdn: extraObj.cdn,
          },
          true
        );
        streamUrls[`url${j + 1}`] = host.includes("https://cn-")
          ? url
          : `${url}${genUrlSearch(extraObj)}`;
      }
    }
  }
  streamUrls["uid"] = data.uid || "";
  // console.log(JSON.stringify(streamUrls));
  return streamUrls;
}
//根据room id获取房间信息
async function getRoomInfo(rid) {
  const url = `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${rid}`;
  const res = await fireFetch(url);

  return isJSONValid(res) ? JSON.parse(res).data : {};
}
//根据user id获取信息
async function getUserInfo(uid) {
  const res = await fireFetch(
    `https://api.bilibili.com/x/space/acc/info?mid=${uid}`,
    {},
    true
  );

  return +res.code === 0 ? res.data || {} : {};
}
//测试单个live url，
/* getRoomLiveUrl(10375360).then((res) => {
  console.log(res);
});*/

//批量
const BILI_ROOM_IDS = [22621344, 23150921, 21715386, 23169468, 23285297];
const BILI_ROOM_IDS1 = [22621344];
//获取所有分区
const getAllAreas = async () => {
  const res = await fireFetch(
    "https://api.live.bilibili.com/room/v1/Area/getList",
    {},
    true
  );
  if (!(res.code === 0 && Array.isArray(res.data))) return [];
  let lists = [];
  for (let i = 0; i < res.data.length; i++) {
    const subs = Array.isArray(res.data[i].list) ? res.data[i].list : [];
    lists.push(...subs);
  }
  return lists;
};
//获取分区下的房间列表
const getAreaRooms = async (pid, id, name = "") => {
  const baseUrl =
      "https://api.live.bilibili.com/xlive/web-interface/v1/second/getList",
    genUrl = (p = 1) =>
      `${baseUrl}?platform=web&parent_area_id=${pid}&area_id=${id}&sort_type=online&page=${p}`;

  const rooms = [];
  let page = 1,
    hasMore = true;

  while (hasMore) {
    console.log(`获取分区${pid} - ${id} ${name}-分页 ${page} 的房间列表`);
    const res = await fireFetch(genUrl(page), {}, true);
    const { code } = res,
      data = res.data || {};
    if (code === 0) {
      const list = data.list || [];
      const ids = list.map(({ roomid, title, uname, uid, area_name }) => ({
        roomid,
        title,
        uname,
        uid,
        area_name,
      }));
      rooms.push(...ids);
    }
    hasMore = !!data.has_more;
    page++;
  }

  return rooms;
};
//获取直播的房间
//all=false只获取影音馆
const getAllRooms = async all => {

  const areas = all
    ? await getAllAreas()
    : [{ id: "33", parent_id: "10", name: "影音馆" },{ id: "624", parent_id: "10", name: "搞笑" }];
  const rooms = [];
  for (let i = 0; i < areas.length; i++) {
    const obj = areas[i],
      _rs = await getAreaRooms(obj.parent_id, obj.id, obj.name);

    rooms.push(..._rs);
  }
  return rooms;
};

(async () => {
  const all = process?.env?.BILIBILI_ALL,
    DEF_ROOMS = [{ roomid: 23125843 }],
    jsonList = [],
    dynamicRooms = await getAllRooms(all),
    rooms = [...DEF_ROOMS, ...dynamicRooms];
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i],
      key = room.roomid;
    console.log(`正在解析${i + 1}第个房间, ID: ${key}, 共${rooms.length}个`);

    const json = await getRoomLiveUrl(key); // JSON.parse(out.replace(/\'/g, "\""))
    if (json.url1) {
      const user =
        room.uname && room.title ? { ...room } : await getUserInfo(json.uid);

      const uname = room.uname || user.name,
        rname = room.title || user?.live_room?.title;
      json.room_id = key;
      json.name = `【${uname}】${rname}` || "未知名称";
      json.group = `B站${room.area_name ? "【" + room.area_name + "】" : ""}`;
      console.log("房间解析结果:", json);
      jsonList.push(json);
    }
  }
  fs.mkdirSync(path.resolve(__dirname, `./data`), { recursive: true });

  fs.writeFileSync(
    path.resolve(__dirname, `./data/bilibili.json`),
    JSON.stringify(jsonList)
  );
  console.log("当前总数量", jsonList.length);
  sendNotify(
    `B站${!all ? "【影音馆】" : ""}`,
    `直播url解析执行完毕，共${jsonList.length}个`
  );
  const m3u_list = ["#EXTM3U"];
  const isPersitUrl = url => url.startsWith("https://cn");
  for (const i in jsonList) {
    const obj = jsonList[i];
    url = isPersitUrl(obj["url1"]) ? obj["url1"] : obj["url2"];
    if (url) {
      m3u_list.push(
        `#EXTINF:-1 group-title="${obj.group}" tvg-id="${obj.room_id}", ${obj.name}`,
        url
      );
    }
  }
  fs.writeFileSync(
    path.resolve(__dirname, `./data/bilibili.m3u`),
    m3u_list.join("\n")
  );
})();
