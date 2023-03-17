/**
 * Created by wxun on 2023/3/17 18:01.
 * description: ql_api
 */
/*
 * @Author: chenghao
 * @Date: 2022-02-14 10:19:21
 * @Last Modified by: chenghao
 * @Last Modified time: 2022-03-20 13:57:10
 * @Desc: 青龙依赖
 * @From: https://github.com/whyour/qinglong/issues/1369
 */

const fetch = require("node-fetch");
const { genUrlSearch, fireFetch } = require("./utils");

class QlApi {
   QL_URL = "http://127.0.0.1:5700";
  //QL_URL = "http://pi.mo:5700";
  CLIENT_ID = process.env.CLIENT_ID;
  CLIENT_SECRET = process.env.CLIENT_SECRET;

  //token
  token = null;

  //初始化,必须先调用
  async init() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET)
      return Promise.reject("未获取到 CLIENT_ID 或 CLIENT_SECRET");
    this.token = await this.getQLToken();
    return this.token;
  }
  /**
   *获取青龙token
   */
  async getQLToken() {
    const res = await fetch(
      this.QL_URL +
        `/open/auth/token?client_id=${this.CLIENT_ID}&client_secret=${this.CLIENT_SECRET}`
    ).then((r) => r.json());
    return res.code === 200 ? res.data.token : "";
  }

  //统一请求
  async _fetch(url, opts = {}, isJson = true) {
    let token = this.token;

    const heads = opts?.headers || {};
    return fireFetch(
      this.QL_URL + url,
      {
        ...opts,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4577.63 Safari/537.36",
          "Content-Type": "application/json;charset=UTF-8",
          "Accept-Encoding": "gzip, deflate",
          "Accept-Language": "zh-CN,zh;q=0.9",
          ...heads,
          Authorization: "Bearer " + token,
        },
      },
      isJson
    );
  }
  // 获取环境变量
  async getQlEnvsByKey(key = "aliyunRefreshToken", defEnvs = []) {
    let envs = defEnvs || [];
    try {
      envs = (await this.getQLEnvs(key)) || defEnvs || [];
    } catch (e) {}

    let envArray = [];

    if (Array.isArray(envs)) envArray = envs;
    else if (envs.indexOf("&") > -1) envArray = envs.split("&");
    else if (envs.indexOf("\n") > -1) envArray = envs.split("\n");
    else envArray = [envs];

    return envArray;
  }
  /**
   *
   *获取青龙环境变量
   * @returns {string} searchValue
   */
  async getQLEnvs(searchValue = "JD_COOKIE") {
    const res = await this._fetch(
      "/open/envs" + genUrlSearch({ searchValue, t: +new Date() }),
      {}
    );
    return res.data;
  }
  /**
   *创建ck环境变量

   * @param {*} ck [{value:'',name:''}]
   * @returns
   */
  async createCkEnv(ck = []) {
    try {
      const res = await this._fetch(`/open/envs?t=${+new Date()}`, {
        method: "post",
        body: JSON.stringify(ck),
      });
      return res;
    } catch (e) {
      console.log(e.toString());
    }
  }
  /**
   * 更新环境变量
   * @param {*} ck
   * @returns
   */
  async updateCkEnv(ck = {}) {
    try {
      const res = await this._fetch(`/open/envs?t=${+new Date()}`, {
        method: "put",
        body: JSON.stringify(ck),
      });
      return res;
    } catch (e) {
      console.log(e.toString());
    }
  }
  /**
   * 删除环境变量
   * @param {*} ckIds
   * @returns
   */
  async deleteCkEnv(ckIds = []) {
    try {
      const res = await this._fetch(`/open/envs?t=${+new Date()}`, {
        method: "delete",
        body: JSON.stringify(ckIds),
      });
      return res;
    } catch (e) {
      console.log(e.toString());
    }
  }
  /**
   *切换ck状态
   * @param {*} path
   * @param {*} id
   * @returns
   */
  async toggleCKEnv(id, path = "enable") {
    try {
      const res = await this._fetch(`/open/envs/${path}?t=${+new Date()}`, {
        method: "put",
        body: JSON.stringify([id]),
      });
      return res;
    } catch (e) {
      console.log(e.toString());
    }
  }
}
module.exports = { QlApi };
