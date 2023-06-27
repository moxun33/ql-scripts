/**
 * Created by wxun on 2023/3/17 19:16.
 * description: s_aliyun
 */
const { fireFetch, fileSizeUnit } = require("./utils");
const { QlApi } = require("./qlApi");
class AliyunDrive {
  constructor() {
    this.qlApi = new QlApi();
  }
  tokenURL = "https://auth.aliyundrive.com/v2/account/token";
  signinURL = "https://member.aliyundrive.com/v1/activity/sign_in_list";
  baseApi = "https://api.aliyundrive.com";
  //用户信息
  userInfo = {};

  //qinglong 接口
  qlApi;
  //统一请求, 更新token和signin除外
  async _fetch(url, opts = {}, isJson = true) {
    let token = this.userInfo?.access_token;
    if (!token && !opts.ignoreToken) {
      const info = await this.updateAccesssToken();
      token = info.access_token;
    }

    const heads = opts?.headers || {};
    return fireFetch(
      this.baseApi + url,
      {
        ...opts,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          ...heads,
          Authorization: `${this.userInfo?.token_type} ${token}`,
        },
      },
      isJson
    );
  }

  // 获取qinglong环境变量
  async getQlEnvs(key) {
    try {
      await this.qlApi.init();
    } catch (e) {}
    let envs = process.env[key] || [];
    const envArray = await this.qlApi.getQlEnvsByKey(key, envs);

    if (!envArray.filter(Boolean).length) {
      console.log(`未获取到 环境变量 ${key}, 程序终止`);
      process.exit(1);
    }
    return envArray;
  }
  // 获取aliyun refresh token
  async getRefreshToken() {
    return await this.getQlEnvs("aliyunRefreshToken");
  }

  //更新qinglong变量
  async updateQlEnv(info = {}, refresh_token, remark = "") {
    if (!info.name) return;
    // 更新环境变量

    let params = {
      name: info.name,
      value: refresh_token,
      remarks: info.remarks || remark, // 优先存储原有备注信息
    };
    // 新版青龙api
    if (info.id) {
      params.id = info.id;
    }
    // 旧版青龙api
    if (info._id) {
      params._id = info._id;
    }
    return this.qlApi.updateCkEnv(params);
  }
  // 使用 refresh_token 更新 access_token
  // login, 需要初始化调用
  async updateAccesssToken(refreshToken, remarks) {
    const queryBody = {
      grant_type: "refresh_token",
      refresh_token: refreshToken.value || refreshToken,
    };
    const errorMessage = [remarks, "更新 access_token 失败"];
    return fireFetch(
      this.tokenURL,
      {
        method: "POST",
        body: JSON.stringify(queryBody),
        headers: { "Content-Type": "application/json" },
      },
      true
    )
      .then((d) => {
        this.userInfo = d;
        const { code, message } = d;
        if (code) {
          if (
            code === "RefreshTokenExpired" ||
            code === "InvalidParameter.RefreshToken"
          )
            errorMessage.push("refresh_token 已过期或无效");
          else errorMessage.push(message);
          return Promise.reject(errorMessage.join(", "));
        }
        return d;
      })
      .catch((e) => {
        errorMessage.push(e.message);
        return Promise.reject(errorMessage.join(", "));
      });
  }
  //签到
  async sign_in(refreshToken, remarks) {
    const queryBody = {
      grant_type: "refresh_token",
      refresh_token: refreshToken.value || refreshToken,
    };
    const sendMessage = [remarks];
    return fireFetch(
      this.signinURL,
      {
        method: "POST",
        body: JSON.stringify(queryBody),
        headers: {
          Authorization: `${this.userInfo?.token_type} ${this.userInfo?.access_token}`,
          "Content-Type": "application/json",
        },
      },
      true
    )
      .then((json) => {
        if (!json.success) {
          sendMessage.push("签到失败");
          return Promise.reject(sendMessage.join(", "));
        }

        sendMessage.push("签到成功");

        const { signInLogs, signInCount } = json.result;
        const currentSignInfo = signInLogs[signInCount - 1]; // 当天签到信息

        sendMessage.push(`本月累计签到 ${signInCount} 天`);

        // 当天签到是否有奖励
        if (
          currentSignInfo.reward &&
          (currentSignInfo.reward.name || currentSignInfo.reward.description)
        )
          sendMessage.push(
            `本次签到获得${currentSignInfo.reward.name || ""}${
              currentSignInfo.reward.description || ""
            }`
          );

        return sendMessage.join(", ");
      })
      .catch((e) => {
        sendMessage.push("签到失败");
        sendMessage.push(e.message);
        return Promise.reject(sendMessage.join(", "));
      });
  }
  //获取目录文件
  async listFiles(folderId) {
    if (!folderId) return [];
    const body = {
      drive_id: this.userInfo?.default_drive_id,
      parent_file_id: folderId,
      limit: 100,
      all: false,
      url_expire_sec: 14400,
      fields: "*",
      order_by: "updated_at",
      order_direction: "ASC",
    };
    const res = await this._fetch("/adrive/v3/file/list", {
      method: "post",
      body: JSON.stringify(body),
    });
    return Array.isArray(res.items) ? res.items : [];
  }
  //清空指定目录
  //toTrash 0: 直接彻底删除 1: 移除到回收站
  async clearFolder(id, toTrash = false) {
    const files = await this.listFiles(id);

    if (!files.length) return { files, responses: [] };
    const filesReq = files.map((f) => {
      return {
        body: {
          drive_id: f.drive_id,
          file_id: f.file_id,
        },
        headers: {
          "Content-Type": "application/json",
        },
        id: f.file_id,
        method: "POST",
        url: toTrash ? "/recyclebin/trash" : "/file/delete",
      };
    });
    const body = {
      requests: filesReq,
      resource: "file",
    };
    const res = await this._fetch(
      "/v2/batch",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      true
    );
    res.files = files;
    return res;
  }
  //计算文件列表的总大小
  sumFilesSize(files = []) {
    return files.reduce((total, cur) => cur.size + total, 0);
  }
  //根据阿里云盘分享id获取文件目录
  async getFilesByShareId(share_id) {
    if (!share_id) return {};
    return this._fetch(
      `/adrive/v3/share_link/get_share_by_anonymous?share_id=${share_id}`,
      { ignoreToken: true, method: "POST", body: JSON.stringify({ share_id }) }
    );
  }
}

module.exports = { AliyunDrive };
