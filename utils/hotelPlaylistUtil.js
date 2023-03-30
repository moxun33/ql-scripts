/**
 * Created by wxun on 2023/3/30 20:50.
 * description: playlistUtil 格式 http://113.64.147.x:808/hls/12/index.m3u8
 */
class HotelPlaylistUtil {
  //根据url提取id
  getId(url) {
    const arr = url.split("/"),
      id = arr.slice(arr.length - 2, arr.length - 1);
    return +id;
  }
  //根据已读取的m3u行文本解析播放列表
  async parseM3uLines(text) {
    const lines = text.split("\n").filter(Boolean);
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
        //  url,
          name: name.trim(),
          id: this.getId(url),
        });
      }
    }
    return list;
  }
  //根据已读取的text行文本解析播放列表
  parseTxtLines(text) {
    const lines = text.split("\n").filter(Boolean);

    return lines
      .map((line) => {
        const arr = line.split(",");
        return {
          name: arr[0],
       //   url: arr[1],
          id: this.getId(arr[1]),
        };
      })

  }
}
const hotelPlaylistUtil = new HotelPlaylistUtil();
module.exports = { hotelPlaylistUtil };
