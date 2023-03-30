/**
 * Created by wxun on 2023/3/30 18:13.
 * description: hotelTv
 * 默认端口808, 只扫描最后一位IP
 * playurl = 'http://113.64.147.x:808/hls/id/index.m3u8';
 */
const fetch = require("node-fetch");
const {  GDJY_HOTEL_TMPL, HOTEL_IPS,  } = require("./hotelTvTmpl");
const fs = require("fs");
const path = require("path");

class HotelTv {
  constructor(opts = {}) {
    this.opts = opts;
  }
  opts = { port: 808, ip: "", name: "", idKey: "id", tmpl: [] };

  _genCheckUrl(ip, id) {
    return `http://${ip}:${this.opts.port || 808}/hls/${id || 1}/index.m3u8`;
  }

  async _fetch(ip, opts = {}) {
    try {
      const res = await fetch(this._genCheckUrl(ip), {
        timeout: 1000,
        method: "head",
        ...opts,
      });
      console.log(ip, res.status);
      return res.status === 200 ? 200 : 500;
    } catch (err) {
      //console.log(err.message)
      return 500;
    }
  }
  _genIpList() {
    const list = [];
    if (!this.opts.ip) return [];
    for (let i = 1; i < 256; i++) {
      const ip = this.opts.ip.replace("x", i.toString());
      list.push(ip);
    }
    return list;
  }
  _genCheckUrls(ips) {
    const _ips = ips || this._genIpList();
    return _ips.map((ip) => this._genCheckUrl(ip));
  }
  async checkIps() {
    const ips = this._genIpList();
    const res = [];
    for (let i = 0; i < ips.length; i++) {
      if (res.length < 1) {
        const status = await this._fetch(ips[i]);
        if (status === 200) {
          res.push(ips[i]);
        }
      }
    }
    return res;
  }
  async checkAndGenM3u() {
    const tmpl = this.opts.tmpl;
    if (!(Array.isArray(tmpl)&&tmpl.length)) return;

    const ips = await this.checkIps();
    if (ips.length < 1 || tmpl.length < 1) return;
    const ip = ips[0],
      m3uList = ["#EXTM3U"];

    tmpl.forEach((obj) => {
      const id = obj[this.opts.idKey || "id"];
      if (id > 0) {
        m3uList.push(
          `#EXTINF:-1 group-title="${this.opts.name}" , ${obj.name}`,
          this._genCheckUrl(ip, id)
        );
      }
    });
    console.log(this.opts.name, "m3u动态IP解析完毕", ip);
    fs.writeFileSync(
      path.resolve(__dirname, `../data/${this.opts.name}.m3u`),
      m3uList.join("\n")
    );
  }
}
const ht = new HotelTv(HOTEL_IPS[5]);
ht.checkAndGenM3u();
