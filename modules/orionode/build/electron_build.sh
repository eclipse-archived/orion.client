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

# Need node 6.11.1
if [ "v6.11.1" != `node --version` ]; then
	echo -----------------------------------
	echo Warning: node version is not v6.11.1
	echo -----------------------------------
	exit 1
fi

cd ..

# Minify client code if necessary
if [ ! -d "lib/orion.client" ]; then
	rm -rf node_modules
	npm install
	./node_modules/.bin/grunt --skipTest
fi

# update orion.conf and package.json
update_config_files() {
	# determine build versions
	name=$(jsawk -i package.json 'return this.name')
	electron_version=$(jsawk -i package.json 'return this.build.electronVersion')
	nodegit_version=$(jsawk -i package.json 'return this.dependencies.nodegit')
	pkg_version=$(jsawk -i package.json 'return this.version')
	
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

# target electron runtime when nodegit pre-compiled binary is not available. assume only nodegit has native code
if [ ! -d "$NODEGIT_DIR" ]; then
	# Electron's version.
	export npm_config_target=$electron_version
	export npm_config_arch=x64
	export npm_config_target_arch=x64
	export npm_config_disturl=https://atom.io/download/electron
	export npm_config_runtime=electron
fi

# Install production modules and clean up some unecessary files to reduce size
npm prune --production
rm -rf node_modules/node-pty
rm -rf node_modules/nodegit/vendor
find node_modules/nodegit/build/Release/ -mindepth 1 ! -name '*.node' -exec rm -rf {} \;
rm -rf target

# Install electron builder and electron-builder-squirrel-windows for Squirrel.Window app
npm install -g electron-builder@19.16.0
npm install -g electron-builder-squirrel-windows@19.16.0

# Build mac dmg, etc
nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/mac/nodegit.node
if [ -f "$nodegit_lib" ]; then
	cp $nodegit_lib ./node_modules/nodegit/build/Release
fi
# Capitalize name in package.json
sed -i .bak "s/\"name\": \"${name}\",/\"name\": \"Orion\",/" package.json
sed -i .bak "s/\"productName\": \"${name}\",/\"productName\": \"Orion\",/" package.json
npm run dist:osx
sed -i .bak "s/\"name\": \"Orion\",/\"name\": \"${name}\",/" package.json
sed -i .bak "s/\"productName\": \"Orion\",/\"productName\": \"${name}\",/" package.json

# Build windows setup, etc
nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/windows/nodegit.node
if [ -f "$nodegit_lib" ]; then
	cp $nodegit_lib ./node_modules/nodegit/build/Release
fi
npm run dist:win
#mv "dist/${name} Setup ${pkg_version}.exe" "dist/${name}-${pkg_version}-nsis-setup.exe" /this is for nsis package
mv "dist/win/${name} Setup ${pkg_version}.exe" "dist/win/${name}-${pkg_version}-setup.exe"

# Build linux packages, etc
nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/linux/nodegit.node
if [ -f "$nodegit_lib" ]; then
	cp $nodegit_lib ./node_modules/nodegit/build/Release
fi
npm run dist:linux