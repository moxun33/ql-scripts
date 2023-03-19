/*
电视剧每日更新推送
31 8 * * *  l_tv_schedule.js
*/
/**
 * Created by wxun on 2023/3/19 16:49.
 * description: l_tv_schedule
 */
const { Env } = require("./utils/ql");

const $ = new Env("电视剧播出表通知");
const notify = $.isNode() ? require("./utils/sendNotify") : "";
const {Yysub} = require("./utils/yysub");

!(async()=>{

    const yysub=new Yysub()
    const list=await yysub.gettTodaySchedule()
    if(list.length === 0) return;
    const msgs=[`${yysub.today} 今日共${list}部电视剧播出`,...list]
    await notify.sendNotify('电视剧播出表通知',msgs.join('\n'));
})()
