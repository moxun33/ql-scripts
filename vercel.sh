#!/bin/bash
echo '开始部署real-url 数据到vercel。'
cd moxun33_ql-scripts_main
node douyu.js
node huya.js
node bilibili.js
cd data
ls -la
npx vercel -t ${VERCEL_TOKEN} --prod
echo '部署real-url 数据到vercel完毕。'