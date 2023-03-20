/*
B站Up主视频更新通知
7 31 0/1  * * *  l_vod_bili.js
*/
/**
 * Created by wxun on 2023/3/19 16:49.
 * description: l_tv_schedule
 * https://socialsisteryi.github.io/bilibili-API-collect/docs/user/space.html#%E6%9F%A5%E8%AF%A2%E7%94%A8%E6%88%B7%E6%8A%95%E7%A8%BF%E8%A7%86%E9%A2%91%E6%98%8E%E7%BB%86
 * https://github.com/simon300000/bili-api
 */
const { Env } = require("./utils/ql");
const { fireFetch, genUrlSearch } = require("./utils/utils");

const $ = new Env("B站Up主视频更新通知");
const notify = $.isNode() ? require("./utils/sendNotify") : "";

//查询用户投稿最新的一个视频明细
async function getUserVideos(mid) {
  const params = { mid, ps: 1 };
  const res = await fireFetch(
    "https://api.bilibili.com/x/space/wbi/arc/search" + genUrlSearch(params),
    {},true
  );
  return res;
}
!(async () => {
  const userIds = (process.env.BILIBILI_USER_IDS || "").split(","),
    bvBaseUrl = "https://www.bilibili.com/video/",fsAtAll="<at user_id='all'>所有人<\/at> ";
  if (!userIds.length) return;

  const msgs = [];
  for (const userId of userIds) {
    const res = await getUserVideos(userId);
    console.log(JSON.stringify(res))
    if (
      res.code === 0 &&
      Array.isArray(res.data?.list?.vlist) &&
      res.data?.list?.vlist.length > 0
    ) {
      const video = res.data?.list?.vlist[0];
     // console.log(video)
      //只关注一小时内的投稿

      if(video.created*1000>=Date.now()-3600*1000){
        const text=`😄  【${video.author}】在${new Date(video.created*1000).toLocaleString()} 更新了视频 【${video.title}】 地址：${bvBaseUrl+video.bvid}`
        msgs.push(text)
      }
    }
  }
  if(!msgs.length) return;
  console.log(msgs);
  await notify.sendNotify(fsAtAll+"B站Up主视频更新通知", msgs.join("\n"));
})();

