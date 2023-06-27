/*
B站Up主视频更新通知
cron 7 31 0/1 * * *  l_vod_bili.js
*/
/**
 * Created by wxun on 2023/3/19 16:49.
 * description: l_tv_schedule
 * https://socialsisteryi.github.io/bilibili-API-collect/docs/user/space.html#%E6%9F%A5%E8%AF%A2%E7%94%A8%E6%88%B7%E6%8A%95%E7%A8%BF%E8%A7%86%E9%A2%91%E6%98%8E%E7%BB%86
 * https://github.com/simon300000/bili-api
 */
const { Env } = require("./utils/ql");
const { fireFetch, genUrlSearch } = require("./utils/utils");
const { createHash } = require("crypto");

const $ = new Env("B站Up主视频更新通知");
const notify = $.isNode() ? require("./utils/sendNotify") : "";
function getMixinKey(ae) {
  const oe = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52,
  ];
  const le = oe.reduce((s, i) => s + ae[i], "");
  return le.slice(0, 32);
}

// 获取 w_rid wts
// https://github.com/SocialSisterYi/bilibili-API-collect/issues/664
async function encWbi(params_in) {
  const params = { ...params_in };
  const { data } = await fireFetch(
    "https://api.bilibili.com/x/web-interface/nav",
    {},
    true
  );
  //  console.log(data);
  const wbi_img = data.wbi_img;
  const me = getMixinKey(
    wbi_img.img_url.split("/").pop().split(".").shift() +
      wbi_img.sub_url.split("/").pop().split(".").shift()
  );
  const wts = Date.now() / 1000;
  params.wts = wts;
  const sortedParams = Object.fromEntries(Object.entries(params).sort());
  const Ae = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const w_rid = createHash("md5")
    .update(Ae + me)
    .digest("hex");
  return { w_rid, wts };
}
//查询用户投稿最新的一个视频明细
async function getUserVideos(mid) {
  const _params = {
      mid,
      ps: 1,
      pn: 1,
      order: "pubdate",
      index: 1,
      platform: "web",
      web_location: 1550101,
    },
    params = {
      ..._params,
      ...(await encWbi(_params)),
    };

  const res = await fireFetch(
    "https://api.bilibili.com/x/space/wbi/arc/search" + genUrlSearch(params),
    {},
    true
  );
  return res;
}
(async () => {
  let userIds = (process.env.BILIBILI_USER_IDS || "")
      .split(",")
      .filter(Boolean),
    bvBaseUrl = "https://www.bilibili.com/video/",
    fsAtAll = "<at user_id='all'>所有人</at> ";
  if (!userIds.length) {
    throw new Error("没有Up的Id");
  }
  userIds = [...new Set(userIds)];
  const msgs = [];
  for (const userId of userIds) {
    const res = await getUserVideos(userId);
    console.log(JSON.stringify(res));
    if (
      res.code === 0 &&
      Array.isArray(res.data?.list?.vlist) &&
      res.data?.list?.vlist.length > 0
    ) {
      const video = res.data?.list?.vlist[0];
      // console.log(video)
      //只关注一小时内的投稿

      if (video.created * 1000 >= Date.now() - 3600 * 1000) {
        const text = `😄  【${video.author}】在${new Date(
          video.created * 1000
        ).toLocaleString()} 更新了视频 【${video.title}】 地址：${
          bvBaseUrl + video.bvid
        }`;
        console.log(text, userId);
        msgs.push(text);
      }
    }
  }
  if (!msgs.length) return;
  console.log(msgs);
  await notify.sendNotify("B站Up主视频更新通知 " + fsAtAll, msgs.join("\n"));
})();
