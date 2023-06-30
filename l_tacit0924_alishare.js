/*
更新Xiaoya的Tacit0924的阿里分享合集链接
cron  0 31 23,0,1 * * *  l_tacit0924_alishare.js
*/
/**
 * Created by wxun on 2023/6/27 16:49.
 * description: l_tacit0924_alishare
 */
const { Env } = require("./utils/ql");
const { YunpanOne } = require("./utils/yunpan_one");
const { AliyunDrive } = require("./utils/aliyun");
const { TinyFileMgt } = require("./utils/tinyFileMgt");

const $ = new Env("更新Xiaoya的Tacit0924的阿里分享合集链接");
const notify = $.isNode() ? require("./utils/sendNotify") : "";
//提取指定分享名称的分享信息
//每行信息与xiaoya的alishare_list.txt相同
const extractShareLine = (name, content) => {
  if (!content) return "";
  const filtered = content.split("\n").filter((l) => l && l.includes(name));
  return filtered.length ? filtered[0] : "";
};
!(async () => {
  const user = "Tacit0924";
  const ypo = new YunpanOne(user.replace("0", ""));
  const shareLink = await ypo.getLatestAliShareLink();
  if (!shareLink) throw new Error(`没有提取到${user}的阿里云盘分享合集链接`);
  const ali = new AliyunDrive(),
    shareId = shareLink.split("/").pop();
  const shareRes = await ali.getFilesByShareId(shareId);
  console.log(shareRes, shareLink);
  const isMatch =
    shareRes.creator_name === "Tac***924" &&
    shareRes.share_name?.includes("更新中");
  //根据tiny file manager 自动更新 分享链接
  const tfm = new TinyFileMgt(process.env.TINY_FILE_MANAGER_HOST || "http://192.168.3.7:5555"),
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
  if (shareId === oldShareId) {
    console.log(
      `${user}的阿里云盘分享合集链接没有变化，无需编辑${alishareListFile}`
    );
    return;
  }
  console.log(myLineRes);
  const newContent = content.replace(oldShareId, shareId);
  const edited = await tfm.editFile(alishareListFile, newContent);
  //console.log(edited,787)
  if (edited !== 1) throw new Error(`编辑${alishareListFile}失败`);
  const msgs = [`编辑${alishareListFile}成功`];
  console.log(msgs);
  await notify.sendNotify("更新Xiaoya的Tacit0924的阿里分享合集链接", msgs.join("\n"));
})();
