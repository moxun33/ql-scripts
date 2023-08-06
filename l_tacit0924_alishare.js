/*
更新Xiaoya的Tacit0924的阿里分享合集链接
cron  0 13 0/1 * * *  l_tacit0924_alishare.js
*/
/**
 * Created by wxun on 2023/6/27 16:49.
 * description: l_tacit0924_alishare
 */
const { Env } = require("./utils/ql");
const { YunpanOne } = require("./utils/yunpan_one");
const { AliyunDrive } = require("./utils/aliyun");
const { TinyFileMgt } = require("./utils/tinyFileMgt");
const { fireFetch, delHtmlTag, COMM_CONF } = require("./utils/utils");
//const fs = require("fs");
const fetch = require("node-fetch");

const qlEnv = new Env("更新Xiaoya的Tacit0924的阿里分享链接");
const notify = qlEnv.isNode() ? require("./utils/sendNotify") : "";
//提取指定分享名称的分享信息
//每行信息与xiaoya的alishare_list.txt相同
const extractShareLine = (name, content) => {
  if (!content) return "";
  const filtered = content.split("\n").filter((l) => l && l.includes(name));
  return filtered.length ? filtered[0] : "";
};
const DOCS_URL = "http://t.cn/A698TLWZ";
//获取阿里云盘文档入口
const getAliDocsEntry = async () => {
  const html = await fireFetch(DOCS_URL, {
    headers: {
      "User-Agent": COMM_CONF.USER_AGENT,
    },
  });
  const text = delHtmlTag(html),
    matches = text.match(/https:\/\/docs.qq.com\/d\/doc\/\w+/i) || [""],
    url = matches[0];
  console.log("阿里云分享文档入口：", url);
  return url;
};
//从文档获取分享合集链接
const getHubShareLink = async () => {
  const html = await fireFetch("https://docs.qq.com/doc/DQmx1WEdTRXpGeEZ6", {
    headers: {
      "User-Agent": COMM_CONF.USER_AGENT,
    },
  });
  const text = delHtmlTag(html),
    matches = text.match(/https:\/\/www.aliyundrive.com\/s\/\w+/i) || [""];
  //fs.writeFileSync('./t-alishare-qq-docs.loca.html',html)
  //第一个链接就是合集分享链接
  console.log("阿里云盘合集分享链接：", matches[0]);
  return matches[0];
};
!(async () => {
  const user = "Tacit0924";
  let shareLink = "",
    shareId = "";
  shareLink = await getHubShareLink();
  if (!shareLink) {
    const ypo = new YunpanOne(user.replace("0", ""));
    shareLink = await ypo.getLatestAliShareLink();
  }

  if (!shareLink) throw new Error(`没有提取到${user}的阿里云盘分享链接`);
  const ali = new AliyunDrive();
  shareId = shareLink.split("/").pop();
  const shareRes = await ali.getFilesByShareId(shareId);
  const isMatch =
    shareRes.creator_name === "Tac***924" &&
    shareRes.share_name?.includes("更新中");
  if (!isMatch) throw new Error(` 阿里云盘分享链接${shareLink}不匹配`);
  //根据tiny file manager 自动更新 分享链接
  const tfm = new TinyFileMgt(
      process.env.TINY_FILE_MANAGER_HOST || "http://192.168.3.7:5555"
    ),
    alishareListFile = "alishare_list.txt";
  const content = await tfm.getFileText("/data/" + alishareListFile);
  const myLine = extractShareLine(user, content),
    myLineRes = myLine.split(" ").filter(Boolean);
  if (myLineRes.length < 3)
    throw new Error(
      `解析【我的阿里分享】alishare_list.txt中${user}的配置失败 `
    );
  const oldShareId = myLineRes[1] || "",
    oldFolderId = myLineRes[2];
  console.log(`旧的分享ID ${oldShareId}， 新的分享ID ${shareId}`);
  if (!shareId || shareId === oldShareId) {
    console.log(
      `${user}的阿里云盘分享链接没有变化，无需编辑${alishareListFile}`
    );
    return;
  }

  const newContent = content.replace(oldShareId, shareId);
  const edited = await tfm.editFile("/data/" + alishareListFile, newContent);
  //console.log(edited,787)
  if (!edited) throw new Error(`编辑${alishareListFile}失败`);
  const msgs = [`编辑${alishareListFile}成功`],
    fsAtAll = "<at user_id='all'>所有人</at> ";
  console.log(msgs.join(";"));
  await notify.sendNotify(
    "更新Xiaoya的Tacit0924的阿里分享链接" + fsAtAll,
    msgs.join("\n")
  );
})();
