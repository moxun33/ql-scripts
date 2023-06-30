/**
 * Created by wxun on 2023/6/27 14:35.
 * description: yunpan_one https://yunpan1.cc/
 */
const { fireFetch, genUrlSearch } = require("./utils");

class YunpanOne {
  constructor(user) {
    this.user = user;
  }
  user;
  origin = "https://yunpan1.cc";

  //获取回复列表
  async getComments(offset = 0, limit = 20) {
    try {
      const params = {
        "filter[author]": this.user,
        "filter[type]": "comment",
        "page[offset]": offset ?? 0,
        "page[limit]": limit ?? 20,
        sort: "-createdAt",
      };
       return fireFetch(this.origin + "/api/posts" + genUrlSearch(params),{}, true);
    } catch (e) {
      console.error(e);
      return {};
    }
  }
  //提取最新的合集分享链接
  async getLatestAliShareLink() {
    const posts = await this.getComments();
    const { data } = posts;
     const filtered = data?.filter(
      (e) =>
        e.type === "posts" &&

        e.attributes?.contentHtml?.includes("总合集【更新中的】和完结的")
    );
   // console.log(JSON.stringify(data))
    const target = filtered?.length ? filtered[0] : {};
     if (!target) return "";
    //第一个阿里云盘分享链接就是总链接
    const html = target.attributes?.contentHtml ?? "",
      matches = html.match(/https:\/\/www.aliyundrive.com\/s\/\w+/i);
    return matches?.length?matches[0]:''
  }
}
module.exports = { YunpanOne };
