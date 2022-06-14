/*
  cron 11 9 * * * s_juejin.js
  掘金社区
  更新时间:2022-66-14
  活动入口：https://juejin.cn/user/center/signin
  只支持Node.js
  脚本兼容: Node.js
  脚本二创 moxun33 https://github.com/moxun33/ql-scripts/s_juejin.js
  增加cookie失效通知
  ***********************************************************
  感谢原作者 harry27 https://github.com/HarrylXue/public_actions

 */
const { Env } = require("./ql");
const $ = new Env("掘金社区");
const notify = $.isNode() ? require("./sendNotify") : "";
const fetch = require("node-fetch");
// const sendMail = require('./sendMail');
const cookie = process.env.JUEJIN_COOKIE || "--";

let score = 0;

const headers = {
  "content-type": "application/json; charset=utf-8",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
  "sec-ch-ua":
    '"Chromium";v="88", "Google Chrome";v="88", ";Not A Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  referer: "https://juejin.cn/",
  accept: "*/*",
  cookie,
};

// 抽奖
const drawFn = async () => {
  // 查询今日是否有免费抽奖机会
  const today = await fetch(
    "https://api.juejin.cn/growth_api/v1/lottery_config/get",
    {
      headers,
      method: "GET",
      credentials: "include",
    }
  ).then((res) => res.json());

  if (today.err_no !== 0) return Promise.reject("已经签到！免费抽奖失败！");
  if (today.data.free_count === 0)
    return Promise.resolve("签到成功！今日已经免费抽奖！");

  // 免费抽奖
  const draw = await fetch("https://api.juejin.cn/growth_api/v1/lottery/draw", {
    headers,
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());

  if (draw.err_no !== 0) return Promise.reject("已经签到！免费抽奖异常！");
  console.log(JSON.stringify(draw, null, 2));
  if (draw.data.lottery_type === 1) score += 66;
  return Promise.resolve(`签到成功！恭喜抽到：${draw.data.lottery_name}`);
};

// 签到
(async () => {
  // 检查cookie是否存在
  if (!cookie) return Promise.reject("cookie不能为空！");
  // 查询今日是否已经签到
  const today_status = await fetch(
    "https://api.juejin.cn/growth_api/v1/get_today_status",
    {
      headers,
      method: "GET",
      credentials: "include",
    }
  ).then((res) => res.json());

  if (today_status.err_no !== 0)
    return Promise.reject(
      `签到失败！${today_status.err_msg}。 ${
        today_status.err_no === 403 ? "cookie失效啦" : ""
      }`
    );
  if (today_status.data) return Promise.resolve("今日已经签到！");

  // 签到
  const check_in = await fetch("https://api.juejin.cn/growth_api/v1/check_in", {
    headers,
    method: "POST",
    credentials: "include",
  }).then((res) => res.json());

  if (check_in.err_no !== 0) return Promise.reject("签到异常！");
  return Promise.resolve(`签到成功！当前积分；${check_in.data.sum_point}`);
})()
  .then((msg) => {
    console.log(msg);
    return fetch("https://api.juejin.cn/growth_api/v1/get_cur_point", {
      headers,
      method: "GET",
      credentials: "include",
    }).then((res) => res.json());
  })
  .then((res) => {
    console.log(res);
    score = res.data;
    return drawFn();
  })
  .then((msg) => {
    console.log(msg);
    notify.sendNotify(
      `掘金签到通知`,
      `签到结果：${msg}\n当前积分：${score}\n`
    );
  })
  .then(() => {
    // console.log('邮件发送成功！');
  })
  .catch((err) => {
    console.log(err);
    notify.sendNotify(
      `掘金签到通知`,
      `签到结果：${err}\n
      当前积分：${score}\n`
    );
  });
