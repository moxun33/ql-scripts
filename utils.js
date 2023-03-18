const { createHash } = require("crypto");
const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const fs = require("fs");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const COMM_CONF = {
  PROXY_URL: "http://127.0.0.1:18888",
  URLENCODED_FORM_TYPE: "application/x-www-form-urlencoded;charset=utf-8;",
  MOBILE_USER_AGENT:
    "Mozilla/5.0 (Linux; U; Android 4.0.3; zh-CN; vivo X9i Build/N2G47H) AppleWebKit/537.36 (KHTML,like Gecko) Version/4.0 Chrome/40.0.2214.89 UCBrowser/11.9.3.973 Mobile Safari/537.36",
};

//统一请求发送
const fireFetch = async (url, opts = {}, isJson = false) => {
  try {
    const heads = opts.headers || opts.Headers || {};
    const res = await fetch(url, {
      agent: HttpsProxyAgent(COMM_CONF.PROXY_URL),
      timeout: 30000,
      ...opts,
      mode: "same-origin",
      credentials: "same-origin",
      headers: {
        "User-Agent": COMM_CONF.MOBILE_USER_AGENT,
        "Content-Type": COMM_CONF.URLENCODED_FORM_TYPE,
        ...heads,
      },
    }).then(async (res) => {
      const text = await res.text();
      // console.log(res.status, "fetch status");
      return isJson && isJSONValid(text) ? JSON.parse(text) : text;
    });

    return res;
  } catch (e) {
    console.error(e, "fetch error");
    return isJson ? {} : "";
  }
};

//随机整数
function getRandomInt(min = 1, max = 100000000) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //不含最大值，含最小值
}

//判断json是否有效
const isJSONValid = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

//提取html文本的目标字符串
const matchHtmlText = (html, reg, defData = "") => {
  if (!reg) {
    return defData;
  }
  const matches = html.match(reg) || [];

  if (matches.length < 1) {
    return defData;
  }
  return matches[0];
};

/**
 * @desc: 加密
 * @param {string} algorithm
 * @param {any} content
 *  @return {string}
 */
const encrypt = (content, algorithm = "md5") => {
  let hash = createHash(algorithm);
  hash.update(content);
  return hash.digest("hex");
};

/**
 * 解析 url 的 search 参数
 * @param qs {string} url search
 * @return object
 * {key:value}
 * */
const parseUrlSearch = (qs) => {
  if (qs && qs.indexOf("?") > -1) {
    const newQS = qs.substring(qs.indexOf("?")).replace("?", "");
    const tmpArr = newQS.split("&");
    let finalObj = {};
    tmpArr.forEach((item) => {
      const itemSplit = item.split("=");
      if (itemSplit.length === 2) {
        finalObj[decodeURIComponent(itemSplit[0])] = decodeURIComponent(
          decodeURIComponent(itemSplit[1])
        );
      }
    });
    return finalObj;
  }
  return {};
};

/**
 * 把对象拼接成 url search 参数
 * @param obj {Object}
 * @param noPrefix {boolean} 第一位不需要 问号
 * @return string
 *
 * */
const genUrlSearch = (obj, noPrefix = false) => {
  let urlQs = "";
  const keys = Object.keys(obj);
  if (obj instanceof Object && keys.length > 0) {
    keys.forEach((s, i) => {
      if (s && obj[s]) {
        const value = encodeURIComponent(obj[s]);
        const key = encodeURIComponent(s);
        urlQs += `${
          urlQs.length === 0 ? (noPrefix ? "" : "?") : "&"
        }${key}=${value}`;
      }
    });
  }

  return urlQs;
};

//逐行读取文件
function readFileLines(filename) {
  try {
    const content = fs.readFileSync(filename, { encoding: "utf8", flag: "r" });
    //console.log(content)
    const lines = content.split(/\r?\n/).filter(Boolean);
    return lines;
  } catch (e) {
    console.error(e);
    return [];
  }
}

//提取 m3u tvg属性值
function getM3uTvgAttr(line, attr = "group-title", def = "") {
  const reg = new RegExp(`${attr}="(.*?)"`),
    matches = line.match(reg) || [],
    str = matches && matches[0] ? matches[0] : def,
    arr = str.split("=");
  return arr.length > 1 ? arr[1].replace(/"/g, "").trim() : def;
}
//根据已读取的m3u行文本解析播放列表
function parseM3uLines(lines) {
  if (!(lines.length > 0 && lines[0].includes("#EXTM3U"))) {
    return [];
  }

  const list = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i].startsWith("#EXTINF:-1")) {
      const info = lines[i],
        url = lines[i + 1],
        name = info.split(",").pop() || url;
      list.push({
        url,
        name: name.trim(),
        group: getM3uTvgAttr(info, "group-title", "未分组"),
        tvgId: getM3uTvgAttr(info, "tvg-id"),
        tvgName: getM3uTvgAttr(info, "tvg-name"),
        tvgLogo: getM3uTvgAttr(info, "tvg-logo"),
      });
    }
  }
  return list;
}
// 求次幂
function pow1024(num) {
  return Math.pow(1024, num)
}
/**
 * 文件大小 字节转换单位
 * @param size
 * @returns {string|*}
 */
 const fileSizeUnit = (size) => {
  if (!size) return '';
  return size < 1024 ? size + ' B' :
      size < pow1024(2) ? (size / 1024).toFixed(2) + ' KB' :
          size < pow1024(3) ? (size / pow1024(2)).toFixed(2) + ' MB' :
              size < pow1024(4) ? (size / pow1024(3)).toFixed(2) + ' GB' :
                  (size / pow1024(4)).toFixed(2) + ' TB'
}




module.exports = {
  COMM_CONF,
  getRandomInt,
  encrypt,
  isJSONValid,
  parseUrlSearch,
  genUrlSearch,
  fireFetch,
  matchHtmlText,
  readFileLines,
  getM3uTvgAttr,
  parseM3uLines,fileSizeUnit
};
