#!/bin/bash
echo '开始部署real-url 数据到vercel。'
cd moxun33_ql-scripts_main
node live_douyu.js
node live_huya.js
node live_bilibili.js
cd data
pnpm exec vercel -t ${VERCEL_TOKEN}
echo '部署real-url 数据到vercel完毕。'