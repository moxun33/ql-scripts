/**
 * Created by wxun on 2023/3/19 18:56.
 * description: xinfan 动漫、动画新番更新时间
 */
const { fireFetch } = require("./utils");

class Xinfan {
  SiteType = {
    INFO: "info",
    ONAIR: "onair",
    RESOURCE: "resource",
  };
  BangumiType = {
    TV: "tv",
    WEB: "web",
    MOVIE: "movie",
    OVA: "ova",
  };
  broadcastToTimeString(broadcast, begin) {
    let time = "";
    if (broadcast) {
      time = broadcast.split("/")[1];
    } else if (begin) {
      time = begin;
    }
    if (!time) return "";
    return ""; /*format(new Date(time), 'eee HH:mm', {
    locale: zhCN,*/
  }

  getBroadcastTimeString(item, siteMeta) {
    const { sites } = item;
    const jpString = this.broadcastToTimeString(item.broadcast, item.begin);
    let cnString = "";
    for (const site of sites) {
      const { site: siteKey } = site;
      if (!siteMeta[siteKey]) continue;
      const { type, regions = [] } = siteMeta[siteKey];
      if (type === this.SiteType.ONAIR && regions.includes("CN")) {
        cnString = this.broadcastToTimeString(site.broadcast, item.begin);
        if (cnString) {
          break;
        }
      }
    }
    return { jpString, cnString };
  }
  //bgmlist sites
  async getBangumiSites() {
    const res = await fireFetch(
      "https://bgmlist.com/api/v1/bangumi/site",
      {},
      true
    );
    return res||{}
  }
  //日本动漫
  async getBangumiJpSchedules() {
      const siteMeta=await this.getBangumiSites()
    const res = await fireFetch(
        "https://bgmlist.com/api/v1/bangumi/onair",
        {},
        true
      ),
      items = res.items || [];
    console.log(res);
  }
}

//const x = new Xinfan();
//console.log(x.getBangumiJpSchedules());
