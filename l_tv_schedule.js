/*
cron 31 8 * * *  l_tv_schedule.js
︎电视剧播出表通知
*/
/**
 * Created by wxun on 2023/3/19 16:49.
 * description: l_tv_schedule
 */
const { Env } = require("./utils/ql");

const $ = new Env("电视剧播出表通知");
const notify = $.isNode() ? require("./utils/sendNotify") : "";
const { Yysub } = require("./utils/yysub");
const { Subhd } = require("./utils/subhd");
const { Assrt } = require("./utils/assrt");

!(async () => {
  const yysub = new Yysub(),
    subhd = new Subhd(),
    assrt = new Assrt();
  const subhdList = await subhd.gettTodaySchedule(),
    assList = await assrt.gettTodaySchedule(),
    yylist = (await yysub.gettTodaySchedule()).filter((s) =>
      assList.filter((a) => a.includes(s.split(' ').shift())).length<1
    ),
    list = [...yylist, ...subhdList, ...assList].map(e=>`✅  ${e}`);

  if (list.length === 0) return;
  const msgs = [`📅${yysub.today} 共${list.length}部影视播出\n\n`, ...list];
  console.log(msgs)
  await notify.sendNotify("📺︎电视剧播出表通知", msgs.join("\n"));
})();
