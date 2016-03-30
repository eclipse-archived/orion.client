#!/bin/bash
npm config set proxy http://proxy.eclipse.org:9898
npm config set https-proxy http://proxy.eclipse.org:9898
npm install
./node_modules/.bin/grunt
rm -rf node_modules
npm install --production
rm -rf node_modules/pty.js
rm -rf target
cd ..
DATE=`date +%Y%m%d%H%M%S`
tar -czf "orionode_$DATE.tar.gz" orionode/
