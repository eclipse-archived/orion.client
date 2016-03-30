#!/bin/bash
npm config set proxy http://proxy.eclipse.org:9898
npm config set https-proxy http://proxy.eclipse.org:9898
npm install
./node_modules/.bin/grunt
rm -rf node_modules
npm install --production
rm -rf node_modules/pty.js
rm -rf node_modules/nodegit/vendor
rm -rf node_modules/nodegit/build/Release/obj.target
rm -rf target
cd ..
tar -czf "orionode_$1.tar.gz" orionode/
