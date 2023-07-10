/**
 * Created by wxun on 2023/6/27 16:36.
 * description: tiny File Manager
 */
const { fireFetch } = require("./utils");

class TinyFileMgt {
  constructor(origin) {
    this.origin = origin;
  }
  origin;
  cookie = "";
  /**
   *  查看文件、获取文件文本内容
   *  @pathname {String} 文件路径， 如 /data/list.txt
   */

  async getFileText(pathname) {
    try {
      return fireFetch(this.origin + pathname);
    } catch (e) {
      console.log(e);
      return "";
    }
  }
  //提取csrf token的值
  async getCsrfToken() {
    const resp = await fireFetch(`${this.origin}/index.php?p=`, { raw: true });
    const ck = resp.headers.get("set-cookie");
    this.cookie = ck;
    const html = await resp.text();
    const matches = html.match(/window.csrf = '(\w+)';/);
    return matches[1] || "";
  }
  /**
   * 编辑文件
   */
  async editFile(pathname, content) {
    try {
      if (!pathname) return false;
      const plist = pathname.split("/").filter(Boolean);
      const p = plist.slice(0, Math.max(plist.length - 1, 0)).join("/"),
        url = `${this.origin}/index.php?p=${p}&edit=${plist[plist.length - 1]}`,
        token = await this.getCsrfToken(),
        data = {
          ajax: true,
          content,
          type: "save",
          token,
        };

      const resp = await fireFetch(url, {
        raw: true,
        method: "POST",
        headers: {
          cookie: this.cookie,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify(data),
      });
      console.log(`Tiny File Manager 编辑文件${pathname}响应：${resp.status}`);
      const res = await resp.text();

      return +res === 1;
    } catch (e) {
      console.log("Tiny File Manager 编辑异常：", e);
      return false;
    }
  }
}

module.exports = { TinyFileMgt };
