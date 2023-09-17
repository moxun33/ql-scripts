/*
阿里云盘清空转存目录
cron 4 38 5 * * *  s_aliyun_auto_clear.js
*/
/**
 *
 * Created by wxun on 2023/3/17 18:00.
 * description: s_aliyun_auto_clear 阿里云盘自动清空指定目录, 用于xiaoya laist转存观看清空
 */

const { Env } = require("./utils/ql");

const $ = new Env("阿里云盘清空转存目录");
const notify = $.isNode() ? require("./utils/sendNotify") : "";
const { AliyunDrive } = require("./utils/aliyun");
const { fileSizeUnit } = require("./utils/utils");

(async () => {
  const client = new AliyunDrive();
  const refreshTokenArray = await client.getRefreshToken();
  const folderIds = await client.getQlEnvs("aliyunClearFolder");
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
      let sendMessage = remarks + "\n";
      const cc = async (id) => {
        const clearRes = await client.clearFolder(id);
        const rt = `已删除目录【${id}】的${
          clearRes.responses?.length || 0
        }个文件, 共${
          fileSizeUnit(client.sumFilesSize(clearRes.files))
        }\n`;
        sendMessage = sendMessage + rt;
      };
     await cc('6506921dba962501f65c49ffa603eb7f0975f73b')
      /* for (const o of folderIds) {
        const ids = String(o.value || o).split(",");
        for (let i = 0; i < ids.length; i++) {
          await  cc(ids[i]);
        }
      }*/

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
