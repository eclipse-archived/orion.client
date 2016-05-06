#!/bin/bash

function die () {
    echo "Error:" "$1" >&2
    exit 1
}

(npm install --no-optional) || die "Failed to install dependencies, consult the npm log to find out why."
../node_modules/.bin/grunt
rm -rf ../node_modules
(npm install --production --no-optional) || die "Failed to install dependencies, consult the npm log to find out why."
rm -rf ../node_modules/pty.js
rm -rf ../node_modules/nodegit/vendor
rm -rf ../node_modules/nodegit/build/Release/obj.target
rm -rf ../target
cd ../..
tar -czf "orionode_$1.tar.gz" orionode/
cp "orionode_$1.tar.gz" /home/data/httpd/download.eclipse.org/orion/orionode/ 
ssh gheorghe@build.eclipse.org ./deploy.sh -archive /home/data/httpd/download.eclipse.org/orion/orionode/"orionode_$1.tar.gz"