/**
 * Created by wxun on 2023/3/17 18:00.
 * description: s_aliyun_auto_clear 阿里云盘自动清空指定目录, 用于xiaoya laist转存观看清空
 *
 *
 * cron "0 5 * * *" s_aliyun_auto_clear.js
*/

const { Env } = require("./ql");

const $ = new Env("阿里云盘清空转存目录");
const notify = $.isNode() ? require("./sendNotify") : "";
const { AliyunDrive } = require("./u_aliyun");

!(async () => {
  const client = new AliyunDrive();
  const refreshTokenArray = await client.getRefreshToken();

  const message = [];
  let index = 1;
  for (let info of refreshTokenArray) {
    let remarks = info.remarks || `账号${index}`;

    try {
      const { nick_name, refresh_token,   } =
          await client.updateAccesssToken(info.value, remarks);

      if (nick_name && nick_name !== remarks)
        remarks = `${nick_name}(${remarks})`;

      await client.updateQlEnv(info, refresh_token, remarks);

      const sendMessage = ''
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
