# 自用青龙脚本

拉库

```bash

ql repo https://github.com/moxun33/ql-scripts.git "l_|s_" "" "utils"

```

docker run -dit \
  -v $PWD/ql:/ql/data \
  -p 5705:5700 \
  --name ql \
  --hostname ql \
  --restart unless-stopped \
  whyour/qinglong:latest
