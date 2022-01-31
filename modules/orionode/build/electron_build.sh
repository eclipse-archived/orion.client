#!/bin/bash
#
#  Env vars:
#
#   BUILD_ID - the build id (optional)
#   BUILD_NUMBER - the micro version number to update package.json (optional)
#   UPDATE_SERVER - site running the nuts update server (optional)
#   NODEGIT_DIR - directory with nodegit binaries. Used when building all platforms in one machine. (optional)
#   CSC_LINK - used to sign the app bundle (optional)
#   CSC_KEY_PASSWORD - used to sign the app bundle (optional)
#
#  For multi platform build: https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build
#

# Need node v14.17.5
if [ "v14.17.5" != `node --version` ]; then
	echo -----------------------------------
	echo Error: node version is not v14.17.5
	echo -----------------------------------
	exit 1
fi

cd ..

# Minify client code if necessary
if [ ! -d "lib/orion.client" ]; then
	rm -rf node_modules
	npm install
	npm install nodegit@v0.28.0-alpha.10 @electron/remote node-pty
	./node_modules/.bin/grunt --skipTest
fi

# update orion.conf and package.json
update_config_files() {
	# determine build versions
	name=$(jq -r '.name' package.json)
	electron_version=$(jq -r '.build.electronVersion' package.json)
	nodegit_version=$(jq '.dependencies.nodegit' package.json)
	pkg_version=$(jq -r '.version' package.json)
	
	# remove multi-user dependencies from package.json
	sed -i.bak -E '/(passport\-github2|passport\-google\-oauth20|passport\-local\-mongoose|passport\-local\-mongoose-email|mongoose|mongodb|connect-mongo)/d' package.json
	
	# update build id
	if [ ! -z "$BUILD_ID" ]; then
		sed -i.bak "s/orion\.buildId\=.*/orion\.buildId\=${BUILD_ID}/" orion.conf
		sed -i.bak "s/var BUILD_ID \= \"unknown\"\;/var BUILD_ID \= \"${BUILD_ID}\"\;/" lib/version.js
	fi
	
	# update build version
	if [ ! -z "$BUILD_NUMBER" ]; then
		old_version=${pkg_version}
		pkg_version=`echo ${pkg_version} | sed 's/.0$/.'"${BUILD_NUMBER}"'/'`
		sed -i .bak 's/\"version\": \"'"${old_version}"'\"/\"version\"\:\ \"'"${pkg_version}"'\"/' package.json
	fi

	# update plugins
	PREFS="lib/orion.client/defaults.pref"
	JSON=$(jq -c '.["/plugins"] += {"plugins/consolePlugin.html": true}' $PREFS)
	echo "$JSON" | jq > $PREFS

	# set udpate server
	if [ ! -z "$UPDATE_SERVER" ]; then
		update_url=$(echo ${UPDATE_SERVER} | sed -e 's/[\/&.-]/\\&/g') # for autoUpdater
		sed -i .bak 's/orion\.autoUpdater\.url\=.*/orion\.autoUpdater\.url\='"${update_url}"'/' orion.conf
		latest_build=$(curl -s ${UPDATE_SERVER}"/api/version/latest" | jsawk 'return this.tag')
		if [ ! -z "$latest_build" ]; then
			download_url=$(echo ${UPDATE_SERVER}"/download" | sed -e 's/[\/&.-]/\\&/g') # for remoteReleases
			sed -i .bak "s/.*remoteReleases.*/\"remoteReleases\": \"${download_url}\/v${latest_build}\"/" package.json
		fi
	fi
}

update_config_files

if [ -z "$NODEGIT_DIR" ]; then
	NODEGIT_DIR=~/downloads/orion/orionode/nodegit
fi

# Install electron builder and electron-builder-squirrel-windows for Squirrel.Window app
npm install -g electron-builder
npm install -g electron-builder-squirrel-windows

if [ ! -d "$NODEGIT_DIR" ]; then
  npm install -g electron-rebuild
  electron-rebuild
fi

# Install production modules and clean up some unecessary files to reduce size
npm prune --production
rm -rf node_modules/nodegit/vendor
find node_modules/nodegit/build/Release/ -mindepth 1 ! -name '*.node' -exec rm -rf {} \;
rm -rf target

# Build mac dmg, etc
if [ "$BUILD_MAC" == "true" ]; then
  nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/mac/nodegit.node
  if [ -f "$nodegit_lib" ]; then
  	cp $nodegit_lib ./node_modules/nodegit/build/Release
  fi
  npm run dist:osx
fi

# Build windows setup, etc
if [ "$BUILD_WIN" == "true" ]; then
  nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/windows/nodegit.node
  if [ -f "$nodegit_lib" ]; then
  	cp $nodegit_lib ./node_modules/nodegit/build/Release
  fi
  npm run dist:win
  #mv "dist/${name} Setup ${pkg_version}.exe" "dist/${name}-${pkg_version}-nsis-setup.exe" /this is for nsis package
  mv "dist/win/${name} Setup ${pkg_version}.exe" "dist/win/${name}-${pkg_version}-setup.exe"
fi

# Build linux packages, etc
if [ "$BUILD_LINUX" == "true" ]; then
  nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/linux/nodegit.node
  if [ -f "$nodegit_lib" ]; then
  	cp $nodegit_lib ./node_modules/nodegit/build/Release
  fi
  npm run dist:linux
fi