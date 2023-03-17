# 自用青龙脚本

拉库

```bash

ql repo https://github.com/moxun33/ql-scripts.git "l_|s_|u_" "" "utils|ql" "main"

```

- 获取斗鱼当前所有直播，设置环境变量``DOUYU_ALL``为``true``，解析耗时会很长
- 获取虎牙当前所有直播，设置环境变量``HUYA_ALL``为``true``，解析耗时会很长
- 获取B站当前所有直播，设置环境变量``BILIBILI_ALL``为``true``，解析耗时会很长
- 掘进签到，设置环境变量``JUEJIN_COOKIE``
- 阿里云签到，设置环境变量``aliyunRefreshToken``, 获取方法参考 https://github.com/mrabit/aliyundriveDailyCheck
