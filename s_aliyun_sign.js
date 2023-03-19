/*
cron 33 11 * * * s_aliyun_sign.js, tag:阿里云盘签到
*/
/**
 *
 * Created by wxun on 2023/3/17 18:00.
 * description: s_aliyun_sign
 *
 *
*/
const { Env } = require("./utils/ql");

const $ = new Env("阿里云盘签到");
const notify = $.isNode() ? require("./utils/sendNotify") : "";

const { AliyunDrive } = require("./utils/aliyun");

!(async () => {
  const client = new AliyunDrive();
  const refreshTokenArray = await client.getRefreshToken();

  const message = [];
  let index = 1;
  for (let info of refreshTokenArray) {
    let remarks = info.remarks || `账号${index}`;

    try {
      const { nick_name, refresh_token,   } =
        await client.updateAccesssToken(info.value||info, remarks);

      if (nick_name && nick_name !== remarks)
        remarks = `${nick_name}(${remarks})`;

      await client.updateQlEnv(info, refresh_token, remarks);

      const sendMessage = await client.sign_in(
        refresh_token,

        remarks
      );
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
  await notify.sendNotify(`阿里云盘签到`, message.join("\n"));
})();
