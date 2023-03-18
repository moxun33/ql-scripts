/*
阿里云盘自动清空指定目录
38 5 * * *  s_aliyun_auto_clear.js
*/
/**
 * 阿里云盘自动清空指定目录
 * 38 5 * * *  s_aliyun_auto_clear.js
 * Created by wxun on 2023/3/17 18:00.
 * description: s_aliyun_auto_clear 阿里云盘自动清空指定目录, 用于xiaoya laist转存观看清空
 */

const { Env } = require("./utils/ql");

const $ = new Env("阿里云盘清空转存目录");
const notify = $.isNode() ? require("./utils/sendNotify") : "";
const { AliyunDrive } = require("./utils/aliyun");
const {fileSizeUnit} = require("./utils/utils");

!(async () => {
  const client = new AliyunDrive();
  const refreshTokenArray =  await client.getRefreshToken();
  const folderIds = await client.getQlEnvs("aliyunClearFolder")
  const message = [];
  let index = 1;
  for (const info of refreshTokenArray) {
    let remarks = info.remarks || `账号${index}`;

    try {
      const { nick_name, refresh_token } = await client.updateAccesssToken(
        info.value || info,
        remarks
      );

      if (nick_name && nick_name !== remarks)
        remarks = `${nick_name}(${remarks})`;

      await client.updateQlEnv(info, refresh_token, remarks);
      let sendMessage = remarks+'\n';
      for (const id of folderIds) {
        const clearRes = await client.clearFolder(id.value||id);
        const rt = `已删除目录【${id.value||id}】的${
          clearRes.responses?.length || 0
        }个文件, 共${fileSizeUnit(client.sumFilesSize(clearRes.files))}\n`;
        sendMessage = sendMessage + rt;
      }

      console.log(sendMessage);
      console.log("\n");
      message.push(sendMessage);
    } catch (e) {
      console.log(e);
      console.log("\n");
      message.push(e);
    }
    index++;
  }
  await notify.sendNotify(`阿里云盘alist转存目录清空`, message.join("\n"));
})();
