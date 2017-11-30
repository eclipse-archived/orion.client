#!/bin/bash
set +x
set +e

LSP_ORION_VERSION=`curl -s https://hudson.eclipse.org/orion/job/lsp-orion-node/lastSuccessfulBuild/api/json | jq -r '.id'`

node getLastBuildId.js https://hudson.eclipse.org/ls/job/jdt-ls-master/lastSuccessfulBuild/api/json > lastBuildId.txt
if [ ! -s lastBuildId.txt ]
then
 echo \"No java lsp server build found\"
 exit 1
fi
. lastBuildId.txt
rm lastBuildId.txt

NODE_VERSION=4.4.1
echo "JAVA_LANGUAGE_SERVER=$JAVA_LANGUAGE_SERVER"
echo "LSP_ORION_VERSION=$LSP_ORION_VERSION"
docker build --build-arg JAVA_LANGUAGE_SERVER=$JAVA_LANGUAGE_SERVER --build-arg LSP_ORION_VERSION=$LSP_ORION_VERSION --build-arg NODE_VERSION=$NODE_VERSION  -t orionlsp .