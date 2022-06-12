#!/usr/bin/env bash
# new Env("解析直播url列表部署vercel")
# cron 17 17 0/15 * * *	 vercel.sh
echo '开始部署real-url 数据到vercel。'
cd moxun33_ql-scripts_main
node douyu.js
node huya.js
node bilibili.js
cd data
ls -la
npx vercel -t ${VERCEL_TOKEN} --prod
echo '部署real-url 数据到vercel完毕。'