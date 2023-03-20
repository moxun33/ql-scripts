/**
 * Created by wxun on 2023/3/19 16:28.
 * description:   subhd字幕组
 */

const { fireFetch } = require("./utils");
const cheerio = require("cheerio");
class Subhd {

  get _monthDate() {
    const d = new Date();
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  //美剧时间表
  async getScheduleHtml() {
    return fireFetch("https://huo720.com/calendar/thisweek");
  }

  //获取当天美剧\电影列表
  async gettTodaySchedule() {
    const html = await this.getScheduleHtml(),
      $ = cheerio.load(html),
      md = this._monthDate;
    const list = [];
    $("div.bg-white.rounded-3.shadow-sm.border.mb-3").each(function (i, e) {
      const text = $(this).find(".f16.link-dark").text(),
        date = $(this)
          .find(".float-end > .ms-2.py-1.px-2.rounded-pill.border")
          .text()
          .trim(),
        type = $(this)
          .find(".float-end > .bg-primary.py-1.px-2.rounded-pill.text-white")
          .text()
          .trim();
      if (md === date) {
        list.push(text + ` 【${type || "电视剧"}】`);
      }
    });
    console.log("subhd", list);
    return list;
  }
}
module.exports = { Subhd };
