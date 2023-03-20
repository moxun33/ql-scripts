/**
 * Created by wxun on 2023/3/19 16:28.
 * description: yysub 人人字幕组
 */

const { fireFetch } = require("./utils");
const cheerio = require("cheerio");
class Yysub {


  //美剧时间表
  async getScheduleHtml() {
    return fireFetch("https://www.yysub.net/tv/schedule");
  }

  //获取当天美剧列表
  async gettTodaySchedule() {
    const html = await this.getScheduleHtml(),
      $ = cheerio.load(html),
      curEle = $(".ihbg.cur");
    const list = [];
    curEle.find("dd").each(function (i, e) {
      const text = $(this)
        .text()
          .replace(/\s+/g, "_")
          .replace(/_+/g, " ")
        .trim();
      list.push(text);
    });
    console.log("yysub", list);
    return list;
  }
}
module.exports = { Yysub };
