#!/bin/bash
LSP_ORION_VERSION=`curl -s https://hudson.eclipse.org/orion/job/lsp-orion-node/lastSuccessfulBuild/api/json | jq -r '.id'`
JAVA_LANGUAGE_SERVER=latest
NODE_VERSION=4.4.1
docker build --build-arg JAVA_LANGUAGE_SERVER=$JAVA_LANGUAGE_SERVER --build-arg LSP_ORION_VERSION=$LSP_ORION_VERSION --build-arg NODE_VERSION=$NODE_VERSION  -t orionlsp .
