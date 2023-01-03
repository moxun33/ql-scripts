/*
谷豆解析
0 6 17 * * * l_bilibili.js
*/
/**
 * Created by wxun on 2023/1/2 21:23.
 * description: l_gudou
 */
const { Env } = require("./ql");
const { sendNotify } = require("./sendNotify");
const $ = new Env("谷豆");
const { encrypt, fireFetch, readFileLines, parseM3uLines } = require("./utils");
const path = require("path");
const fs = require("fs");

//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);

    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);

    default:
      return 0;
  }
}

const listStr = `[{"id":"4005","name":"CCTV4K","group":"央视","tvgId":"CCTV4K","tvgName":"CCTV4K","tvgLogo":"https://epg.112114.xyz/logo/CCTV4K.png"},{"id":"4010","name":"CCTV16-4K","group":"央视","tvgId":"CCTV16","tvgName":"CCTV16","tvgLogo":"https://epg.112114.xyz/logo/CCTV16.png"},{"id":"GDZYHD4K_38000","name":"广东综艺4K","group":"广东","tvgId":"广东综艺","tvgName":"广东综艺","tvgLogo":"https://epg.112114.xyz/logo/广东综艺.png"},{"id":"GHDdaoshi_7500","name":"G导视高清","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/G导视.png"},{"id":"1350_4500","name":"翡翠台","group":"港澳台","tvgId":"翡翠台","tvgName":"翡翠台","tvgLogo":"https://epg.112114.xyz/logo/翡翠台.png"},{"id":"1351_4500","name":"明珠台","group":"港澳台","tvgId":"明珠台","tvgName":"明珠台","tvgLogo":"https://epg.112114.xyz/logo/明珠台.png"},{"id":"fhzw_1500","name":"凤凰中文","group":"香港","tvgId":"凤凰中文","tvgName":"凤凰中文","tvgLogo":"https://epg.112114.xyz/logo/凤凰中文.png"},{"id":"xingkong_1500","name":"星空卫视","group":"卫视","tvgId":"星空卫视","tvgName":"星空卫视","tvgLogo":"https://epg.112114.xyz/logo/星空卫视.png"},{"id":"aoya_1500","name":"澳亚卫视","group":"卫视","tvgId":"澳亚卫视","tvgName":"澳亚卫视","tvgLogo":"https://epg.112114.xyz/logo/澳亚卫视.png"},{"id":"CCTV1HD_7000","name":"CCTV1","group":"央视","tvgId":"CCTV1","tvgName":"CCTV1","tvgLogo":"https://epg.112114.xyz/logo/CCTV1.png"},{"id":"CCTV2HD_7000","name":"CCTV2","group":"央视","tvgId":"CCTV2","tvgName":"CCTV2","tvgLogo":"https://epg.112114.xyz/logo/CCTV2.png"},{"id":"CCTV3HD_7000","name":"CCTV3","group":"央视","tvgId":"CCTV3","tvgName":"CCTV3","tvgLogo":"https://epg.112114.xyz/logo/CCTV3.png"},{"id":"CCTV-4HD_7500","name":"CCTV4","group":"央视","tvgId":"CCTV4","tvgName":"CCTV4","tvgLogo":"https://epg.112114.xyz/logo/CCTV4.png"},{"id":"1605_4500","name":"CCTV5","group":"央视","tvgId":"CCTV5","tvgName":"CCTV5","tvgLogo":"https://epg.112114.xyz/logo/CCTV5.png"},{"id":"1403_4500","name":"CCTV5+","group":"央视","tvgId":"CCTV5+","tvgName":"CCTV5+","tvgLogo":"https://epg.112114.xyz/logo/CCTV5+.png"},{"id":"CCTV6HD_7000","name":"CCTV6","group":"央视","tvgId":"CCTV6","tvgName":"CCTV6","tvgLogo":"https://epg.112114.xyz/logo/CCTV6.png"},{"id":"CCTV7HD_7000","name":"CCTV7","group":"央视","tvgId":"CCTV7","tvgName":"CCTV7","tvgLogo":"https://epg.112114.xyz/logo/CCTV7.png"},{"id":"CCTV8HD_7000","name":"CCTV8","group":"央视","tvgId":"CCTV8","tvgName":"CCTV8","tvgLogo":"https://epg.112114.xyz/logo/CCTV8.png"},{"id":"CCTV9HD_7000","name":"CCTV9","group":"央视","tvgId":"CCTV9","tvgName":"CCTV9","tvgLogo":"https://epg.112114.xyz/logo/CCTV9.png"},{"id":"CCTV10HD_7000","name":"CCTV10","group":"央视","tvgId":"CCTV10","tvgName":"CCTV10","tvgLogo":"https://epg.112114.xyz/logo/CCTV10.png"},{"id":"CCTV-11HD_7500","name":"CCTV11","group":"央视","tvgId":"CCTV11","tvgName":"CCTV11","tvgLogo":"https://epg.112114.xyz/logo/CCTV11.png"},{"id":"CCTV12HD_7000","name":"CCTV12","group":"央视","tvgId":"CCTV12","tvgName":"CCTV12","tvgLogo":"https://epg.112114.xyz/logo/CCTV12.png"},{"id":"1613","name":"CCTV13","group":"央视","tvgId":"CCTV13","tvgName":"CCTV13","tvgLogo":"https://epg.112114.xyz/logo/CCTV13.png"},{"id":"CCTV14HD_7000","name":"CCTV14","group":"央视","tvgId":"CCTV14","tvgName":"CCTV14","tvgLogo":"https://epg.112114.xyz/logo/CCTV14.png"},{"id":"CCTV-15HD_7500","name":"CCTV15","group":"央视","tvgId":"CCTV15","tvgName":"CCTV15","tvgLogo":"https://epg.112114.xyz/logo/CCTV15.png"},{"id":"1617_4500","name":"CCTV16","group":"央视","tvgId":"CCTV16","tvgName":"CCTV16","tvgLogo":"https://epg.112114.xyz/logo/CCTV16.png"},{"id":"CCTV17HD","name":"CCTV17","group":"央视","tvgId":"CCTV17","tvgName":"CCTV17","tvgLogo":"https://epg.112114.xyz/logo/CCTV17.png"},{"id":"CCTV15news_1500","name":"CGTN","group":"央视","tvgId":"CGTN","tvgName":"CGTN","tvgLogo":"https://epg.112114.xyz/logo/CGTN.png"},{"id":"guangdongHD_7000","name":"广东卫视","group":"卫视","tvgId":"广东卫视","tvgName":"广东卫视","tvgLogo":"https://epg.112114.xyz/logo/广东卫视.png"},{"id":"shenzhenHD_7000","name":"深圳卫视","group":"卫视","tvgId":"深圳卫视","tvgName":"深圳卫视","tvgLogo":"https://epg.112114.xyz/logo/深圳卫视.png"},{"id":"dongfangHD_7000","name":"东方卫视","group":"卫视","tvgId":"东方卫视","tvgName":"东方卫视","tvgLogo":"https://epg.112114.xyz/logo/东方卫视.png"},{"id":"beijingHD_7000","name":"北京卫视","group":"卫视","tvgId":"北京卫视","tvgName":"北京卫视","tvgLogo":"https://epg.112114.xyz/logo/北京卫视.png"},{"id":"hunanHD_7000","name":"湖南卫视","group":"卫视","tvgId":"湖南卫视","tvgName":"湖南卫视","tvgLogo":"https://epg.112114.xyz/logo/湖南卫视.png"},{"id":"jiangxiHD_7000","name":"江西卫视","group":"卫视","tvgId":"江西卫视","tvgName":"江西卫视","tvgLogo":"https://epg.112114.xyz/logo/江西卫视.png"},{"id":"sichuanHD_7000","name":"四川卫视","group":"卫视","tvgId":"四川卫视","tvgName":"四川卫视","tvgLogo":"https://epg.112114.xyz/logo/四川卫视.png"},{"id":"jiangsuHD_7000","name":"江苏卫视","group":"卫视","tvgId":"江苏卫视","tvgName":"江苏卫视","tvgLogo":"https://epg.112114.xyz/logo/江苏卫视.png"},{"id":"zhejiangHD_7000","name":"浙江卫视","group":"卫视","tvgId":"浙江卫视","tvgName":"浙江卫视","tvgLogo":"https://epg.112114.xyz/logo/浙江卫视.png"},{"id":"1415_4500","name":"天津卫视","group":"卫视","tvgId":"天津卫视","tvgName":"天津卫视","tvgLogo":"https://epg.112114.xyz/logo/天津卫视.png"},{"id":"1426_4500","name":"河北卫视","group":"卫视","tvgId":"河北卫视","tvgName":"河北卫视","tvgLogo":"https://epg.112114.xyz/logo/河北卫视.png"},{"id":"chongqingHD_7000","name":"重庆卫视","group":"卫视","tvgId":"重庆卫视","tvgName":"重庆卫视","tvgLogo":"https://epg.112114.xyz/logo/重庆卫视.png"},{"id":"guizhouHD_7000","name":"贵州卫视","group":"卫视","tvgId":"贵州卫视","tvgName":"贵州卫视","tvgLogo":"https://epg.112114.xyz/logo/贵州卫视.png"},{"id":"liaoningHD_7000","name":"辽宁卫视","group":"卫视","tvgId":"辽宁卫视","tvgName":"辽宁卫视","tvgLogo":"https://epg.112114.xyz/logo/辽宁卫视.png"},{"id":"hubeiHD_7000","name":"湖北卫视","group":"卫视","tvgId":"湖北卫视","tvgName":"湖北卫视","tvgLogo":"https://epg.112114.xyz/logo/湖北卫视.png"},{"id":"anhuiHD_7000","name":"安徽卫视","group":"卫视","tvgId":"安徽卫视","tvgName":"安徽卫视","tvgLogo":"https://epg.112114.xyz/logo/安徽卫视.png"},{"id":"heilongjiangHD_7000","name":"黑龙江卫视","group":"卫视","tvgId":"黑龙江卫视","tvgName":"黑龙江卫视","tvgLogo":"https://epg.112114.xyz/logo/黑龙江卫视.png"},{"id":"1451_4500","name":"海南卫视","group":"卫视","tvgId":"海南卫视","tvgName":"海南卫视","tvgLogo":"https://epg.112114.xyz/logo/海南卫视.png"},{"id":"1452_4500","name":"陕西卫视","group":"卫视","tvgId":"陕西卫视","tvgName":"陕西卫视","tvgLogo":"https://epg.112114.xyz/logo/陕西卫视.png"},{"id":"dongnanweishiHD","name":"东南卫视","group":"卫视","tvgId":"东南卫视","tvgName":"东南卫视","tvgLogo":"https://epg.112114.xyz/logo/东南卫视.png"},{"id":"1453","name":"三沙卫视","group":"卫视","tvgId":"三沙卫视","tvgName":"三沙卫视","tvgLogo":"https://epg.112114.xyz/logo/三沙卫视.png"},{"id":"CHCHD_7000","name":"CHC高清电影","group":"其他","tvgId":"CHC高清电影","tvgName":"CHC高清电影","tvgLogo":"https://epg.112114.xyz/logo/CHC高清电影.png"},{"id":"quanjishiHD_7000","name":"乐游","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/乐游.png"},{"id":"QSJLHD_7000","name":"求索纪录","group":"其他","tvgId":"求索纪录","tvgName":"求索纪录","tvgLogo":"https://epg.112114.xyz/logo/求索纪录.png"},{"id":"qiusuokexueHD_7000","name":"求索科学","group":"其他","tvgId":"求索科学","tvgName":"求索科学","tvgLogo":"https://epg.112114.xyz/logo/求索科学.png"},{"id":"QSDWHD_7000","name":"求索动物","group":"其他","tvgId":"求索动物","tvgName":"求索动物","tvgLogo":"https://epg.112114.xyz/logo/求索动物.png"},{"id":"QSSHHD_7000","name":"求索生活","group":"其他","tvgId":"浙江求索生活","tvgName":"浙江求索生活","tvgLogo":"https://epg.112114.xyz/logo/浙江求索生活.png"},{"id":"meiliyinyueHD_7000","name":"魅力足球","group":"其他","tvgId":"魅力足球","tvgName":"魅力足球","tvgLogo":"https://epg.112114.xyz/logo/魅力足球.png"},{"id":"jinbaotiyuHD_7000","name":"劲爆体育","group":"其他","tvgId":"SITV劲爆体育","tvgName":"SITV劲爆体育","tvgLogo":"https://epg.112114.xyz/logo/SITV劲爆体育.png"},{"id":"gdzhujiangHD_7500","name":"广东珠江","group":"广东","tvgId":"广东珠江","tvgName":"广东珠江","tvgLogo":"https://epg.112114.xyz/logo/广东珠江.png"},{"id":"1413","name":"广东体育","group":"广东","tvgId":"广东体育","tvgName":"广东体育","tvgLogo":"https://epg.112114.xyz/logo/广东体育.png"},{"id":"GDjingjikejiaoHD_7000","name":"广东经济科教","group":"广东","tvgId":"广东经济科教","tvgName":"广东经济科教","tvgLogo":"https://epg.112114.xyz/logo/广东经济科教.png"},{"id":"gdnews_1500","name":"广东新闻","group":"广东","tvgId":"广东新闻","tvgName":"广东新闻","tvgLogo":"https://epg.112114.xyz/logo/广东新闻.png"},{"id":"gdpublic_1500","name":"广东公共","group":"广东","tvgId":"广东公共","tvgName":"广东公共","tvgLogo":"https://epg.112114.xyz/logo/广东公共.png"},{"id":"gdnanfang_1500","name":"大湾区卫视","group":"卫视","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/大湾区卫视.png"},{"id":"gdyingshi_1500","name":"广东影视","group":"广东","tvgId":"广东影视","tvgName":"广东影视","tvgLogo":"https://epg.112114.xyz/logo/广东影视.png"},{"id":"gdjiajiacartoon_1500","name":"嘉佳卡通","group":"其他","tvgId":"嘉佳卡通","tvgName":"嘉佳卡通","tvgLogo":"https://epg.112114.xyz/logo/嘉佳卡通.png"},{"id":"gdshaoer_1500","name":"广东少儿","group":"广东","tvgId":"广东少儿","tvgName":"广东少儿","tvgLogo":"https://epg.112114.xyz/logo/广东少儿.png"},{"id":"shantouyitaogaoqing_4500","name":"汕头综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/汕头综合.png"},{"id":"shantouertaogaoqing_4500","name":"汕头经济生活","group":"其他","tvgId":"汕头经济生活","tvgName":"汕头经济生活","tvgLogo":"https://epg.112114.xyz/logo/汕头经济生活.png"},{"id":"2508_4500","name":"汕头文旅体育","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/汕头文旅体育.png"},{"id":"3131","name":"潮州综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/潮州综合.png"},{"id":"3132","name":"潮州民生","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/潮州民生.png"},{"id":"3665","name":"中山综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/中山综合.png"},{"id":"3663","name":"中山公共","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/中山公共.png"},{"id":"3664","name":"中山教育","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/中山教育.png"},{"id":"3709","name":"鹤山综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/鹤山综合.png"},{"id":"meizhou1HD_4500","name":"梅州1","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/梅州1.png"},{"id":"meizhou2HD_4500","name":"梅州2","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/梅州2.png"},{"id":"2079","name":"增城电视台","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/增城电视台.png"},{"id":"2121","name":"东莞新闻综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/东莞新闻综合.png"},{"id":"2122","name":"东莞生活资讯","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/东莞生活资讯.png"},{"id":"foshanzongheHD_4500","name":"佛山综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/佛山综合.png"},{"id":"foshangonggongHD_4500","name":"佛山公共","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/佛山公共.png"},{"id":"foshanyingshiHD_4500","name":"佛山影视","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/佛山影视.png"},{"id":"nanhaiHD_4500","name":"南海综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/南海综合.png"},{"id":"shundeHD_4500","name":"顺德综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/顺德综合.png"},{"id":"2207","name":"斗门融媒","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/斗门融媒.png"},{"id":"2314","name":"惠州1","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/惠州1.png"},{"id":"2316","name":"惠州2","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/惠州2.png"},{"id":"2305","name":"博罗综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/博罗综合.png"},{"id":"guangzhou_1500","name":"广州综合","group":"其他","tvgId":"广州综合","tvgName":"广州综合","tvgLogo":"https://epg.112114.xyz/logo/广州综合.png"},{"id":"gznews_1500","name":"广州新闻","group":"其他","tvgId":"广州新闻","tvgName":"广州新闻","tvgLogo":"https://epg.112114.xyz/logo/广州新闻.png"},{"id":"gzeconomic_1500","name":"广州法治","group":"其他","tvgId":"广州法治","tvgName":"广州法治","tvgLogo":"https://epg.112114.xyz/logo/广州法治.png"},{"id":"gzcompetition_1500","name":"广州竞赛","group":"其他","tvgId":"广州竞赛","tvgName":"广州竞赛","tvgLogo":"https://epg.112114.xyz/logo/广州竞赛.png"},{"id":"gzfilms_1500","name":"广州影视","group":"其他","tvgId":"广州影视","tvgName":"广州影视","tvgLogo":"https://epg.112114.xyz/logo/广州影视.png"},{"id":"zhanjiangzonghe_1500","name":"湛江综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/湛江综合.png"},{"id":"zhanjianggonggong_1500","name":"湛江公共","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/湛江公共.png"},{"id":"shaoguanzonghe_1500","name":"韶关新闻综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/韶关新闻综合.png"},{"id":"shaoguangonggong_1500","name":"韶关绿色生活","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/韶关绿色生活.png"},{"id":"2641","name":"始兴综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/始兴综合.png"},{"id":"3712_1500","name":"江门综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/江门综合.png"},{"id":"jiangmenyitao_1500","name":"江门侨乡生活","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/江门侨乡生活.png"},{"id":"xinhui_1500","name":"新会综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/新会综合.png"},{"id":"2405","name":"佛冈","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/佛冈.png"},{"id":"2805","name":"怀集综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/怀集综合.png"},{"id":"yunfuyitao_1500","name":"云浮综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/云浮综合.png"},{"id":"yunfuertao_1500","name":"云浮文旅","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/云浮文旅.png"},{"id":"zhuhaiyitao_1500","name":"珠海1","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/珠海1.png"},{"id":"zhuhaiertao_1500","name":"珠海2","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/珠海2.png"},{"id":"heyuanyitao_1500","name":"河源综合","group":"其他","tvgId":"河源综合","tvgName":"河源综合","tvgLogo":"https://epg.112114.xyz/logo/河源综合.png"},{"id":"heyuanertao_1500","name":"河源公共","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/河源公共.png"},{"id":"zhaoqingyitao_1500","name":"肇庆综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/肇庆综合.png"},{"id":"zhaoqingertao_1500","name":"肇庆生活服务","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/肇庆生活服务.png"},{"id":"jieyangyitao_1500","name":"揭阳综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/揭阳综合.png"},{"id":"jieyangertao_1500","name":"揭阳生活","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/揭阳生活.png"},{"id":"qingyuanzonghe_1500","name":"清远新闻综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/清远新闻综合.png"},{"id":"qingyuangongong_1500","name":"清远文旅生活","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/清远文旅生活.png"},{"id":"shanweiyitao_1500","name":"汕尾新闻综合","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/汕尾新闻综合.png"},{"id":"shanweiertao_1500","name":"汕尾文化生活","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/汕尾文化生活.png"},{"id":"2061_1500","name":"广州共享课堂一年级","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂一年级.png"},{"id":"2062_1500","name":"广州共享课堂二年级","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂二年级.png"},{"id":"2063_1500","name":"广州共享课堂三年级","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂三年级.png"},{"id":"2064_1500","name":"广州共享课堂四年级","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂四年级.png"},{"id":"2065_1500","name":"广州共享课堂五年级","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂五年级.png"},{"id":"2066_1500","name":"广州共享课堂六年级","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂六年级.png"},{"id":"2067_1500","name":"广州共享课堂初一","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂初一.png"},{"id":"2068_1500","name":"广州共享课堂初二","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂初二.png"},{"id":"2069_1500","name":"广州共享课堂初三","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂初三.png"},{"id":"2070_1500","name":"广州共享课堂高一","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂高一.png"},{"id":"2071_1500","name":"广州共享课堂高二","group":"其他","tvgId":"","tvgName":"","tvgLogo":"https://epg.112114.xyz/logo/广州共享课堂高二.png"}]`;
//解析
async function getRealUrl(id) {
  const user = Buffer.from("MTgzMDEwNTMxODU=", "base64").toString("utf-8");
  const ptoken = "ITN8%2FMBY8rXlGJUI%2Fu7stg%3D%3D";
  const pserialnumber = "37edb2a406835fae";
  const cid = "364";
  const timestamp = Date.now().toString().substring(0, 10);
  const nonce = randomNum(1000000000, 9999999999);
  const str = "sumasalt-app-portalpVW4U*FlS" + timestamp + nonce + user;
  const hmac = encrypt(str, "sha1").substring(0, 10);
  //https://www.taobao.com/help/getip.php
  const onlineip = "58.47.55.208";
  const info =
    "ptype=1&plocation=001&puser=" +
    user +
    "&ptoken=" +
    ptoken +
    "&pversion=030107&pserverAddress=portal.gcable.cn&pserialNumber=" +
    pserialnumber +
    "&pkv=1&ptn=Y29tLnN1bWF2aXNpb24uc2FucGluZy5ndWRvdQ&DRMtoken=&epgID=&authType=0&secondAuthid=&t=" +
    ptoken +
    "&pid=&cid=" +
    cid +
    "&u=" +
    user +
    "&p=1&l=001&d=" +
    pserialnumber +
    "&n=" +
    id +
    "&v=2&ot=0&pappName=GoodTV&hmac=" +
    hmac +
    "&timestamp=" +
    timestamp +
    "&nonce=" +
    nonce;
  const url =
    "http://portal.gcable.cn:8080/PortalServer-App/new/aaa_aut_aut002";
  const res = await fireFetch(
    `${url}?${info}`,
    {
      headers: {
        "User-Agent": "Apache-HttpClient/UNAVAILABLE (java 1.4)",
        "X-FORWARDED-FOR": onlineip,
        "CLIENT-IP": onlineip,
      },
    },
    true
  );
  //console.log(res);
  const authResult = res?.data?.authResult,
    ts = new URL(authResult).searchParams || {};

  const token =
    "?t=" +
    ts.get("t") +
    "&u=" +
    ts.get("u") +
    "&p=" +
    ts.get("p") +
    "&pid=&cid=" +
    ts.get("cid") +
    "&d=" +
    ts.get("d") +
    "&sid=" +
    ts.get("sid") +
    "&r=" +
    ts.get("r") +
    "&e=" +
    ts.get("e") +
    "&nc=" +
    ts.get("nc") +
    "&a=" +
    ts.get("a") +
    "&v=" +
    ts.get("v");
  const playurl = "http://gslb.gcable.cn:8070/live/" + id + ".m3u8" + token;
  console.log(playurl);
  return playurl;
}
function m3uPReader() {
  const lines = readFileLines(path.join(__dirname, "data", "gudou-raw.local.m3u"));
  const data = parseM3uLines(lines);
  console.log(data);
  fs.writeFileSync(
    path.resolve(__dirname, `./data/gudouSrc.local.json`),
    JSON.stringify(data)
  );
}
(async () => {

  const list = JSON.parse(listStr);
  const jsonList = [];
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    console.log(`正在解析第${i + 1}个, 共${list.length}个`, n.name);
    const url = await getRealUrl(n.id);
    jsonList.push({ ...n, url, id: n.id });
  }
  fs.writeFileSync(
    path.resolve(__dirname, `./data/gudou.json`),
    JSON.stringify(jsonList)
  );
  sendNotify(`谷豆`, `直播url解析执行完毕，共${jsonList.length}个`);

  const m3u_list = ["#EXTM3U"];
  for (const i in jsonList) {
    const obj = jsonList[i],
      url = obj["url"];
    m3u_list.push(
      `#EXTINF:-1 tvg-id="${obj.tvgId}" tvg-name="${
        obj.tvgName || obj.name
      }" tvg-logo="${obj.tvgLogo}" group-title="${obj.group}", ${obj.name}`,
      url
    );
  }

  fs.writeFileSync(
    path.resolve(__dirname, `./data/gudou.m3u`),
    m3u_list.join("\n")
  );
})();
//getRealUrl('CCTV1HD_7000')
