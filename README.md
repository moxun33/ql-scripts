# 自用[青龙](https://github.com/whyour/qinglong)脚本 

## 拉库

```bash

ql repo https://github.com/moxun33/ql-scripts.git "l_|s_|u_" "" "utils" "main"

```
## 环境变量

- 获取斗鱼当前所有直播，设置环境变量``DOUYU_ALL``为``true``，解析耗时会很长
- 获取虎牙当前所有直播，设置环境变量``HUYA_ALL``为``true``，解析耗时会很长
- 获取B站当前所有直播，设置环境变量``BILIBILI_ALL``为``true``，解析耗时会很长
- 掘进签到，设置环境变量``JUEJIN_COOKIE``
- 阿里云盘签到，设置环境变量``aliyunRefreshToken``, 获取方法参考 https://github.com/mrabit/aliyundriveDailyCheck
- 阿里云盘清空指定目录，设置环境变量``aliyunRefreshToken``（refresh_token）和``aliyunClearFolder``（目录id）

## 青龙面板需要安装的依赖
```json
{
  "cheerio": "1.0.0-rc.12",
    "fast-text-encoding": "^1.0.3",
    "md5": "^2.3.0",
    "node-fetch": "^2.6.7",
    "pako": "^2.0.4",
    "to-arraybuffer": "^1.0.1",
    "vm2": "^3.9.9"
  }
```

## 声明
- 本仓库仅用于学习研究，请勿滥用。滥用造成的一切后果自行承担，与本人无关！！！
- 本仓库仅用于学习研究，请勿滥用。滥用造成的一切后果自行承担，与本人无关！！！
- 本仓库仅用于学习研究，请勿滥用。滥用造成的一切后果自行承担，与本人无关！！！
