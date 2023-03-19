/**
 * Created by wxun on 2023/3/19 16:28.
 * description: 射手字幕组
 */

const { fireFetch } = require("./utils");
const cheerio = require("cheerio");
class Assrt {
  get today() {
    const d = new Date();
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  }

  //美剧时间表
  async getScheduleHtml() {
    return fireFetch("http://assrt.net/calendar#today");
  }

  //获取当天美剧列表
  async gettTodaySchedule() {
    const html = await this.getScheduleHtml(),
      $ = cheerio.load(html),
      curEle = $("#today");
    const list = [];
    curEle.find(".info").each(function (i, e) {
      const text = $(this)
        .text()
        .replace(/\s+/g, "_")
        .replace(/_+/g, " ")
        .trim();
      list.push(text);
    });
    console.log('assrt',list);
    return list;
  }
}
module.exports = { Assrt };

