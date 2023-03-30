/*
酒店源扫描
cron 0 31 5 * * *  l_hotel_tv.js
*/
/**
 * Created by wxun on 2023/3/19 16:49.
 * description: l_tv_schedule
 */
const { Env } = require("./ql");

const $ = new Env("酒店源扫描");
const notify = $.isNode() ? require("./sendNotify") : "";


!(async () => {
  const msgs=[]

  //await notify.sendNotify("🎭酒店源扫描", msgs.join("\n"));
})();
