#!/bin/bash
#
#  Env vars:
#
#   BUILD_NUMBER - the micro version number to update package.json (optional)
#   UPDATE_SERVER - site running the nuts update server (optional)
#   NODEGIT_DIR - directory with nodegit binaries. Use when building all platforms in one machine. (optional)
#   CSC_LINK - used to sign the app bundle (optional)
#   CSC_KEY_PASSWORD - used to sign the app bundle (optional)
#

# Need node 4.4.1
if [ "v4.4.1" != `node --version` ]; then
	echo -----------------------------------
	echo Warning: node version is not v4.4.1
	echo -----------------------------------
	exit 1
fi

cd ..

# Minify client code if necessary
if [ ! -d "lib/orion.client" ]; then
	rm -rf node_modules
	npm install
	./node_modules/.bin/grunt notest
fi

# update orion.conf and package.json
update_config_files() {
	# determine build versions
	electron_version=$(jsawk -i package.json 'return this.build.electronVersion')
	nodegit_version=$(jsawk -i package.json 'return this.dependencies.nodegit')
	pkg_version=$(jsawk -i package.json 'return this.version')
	
	# remove multi-user dependencies from package.json
	sed -i.bak -E '/(passport*|mongoose|mongodb|nodemailer|connect-mongo)/d' package.json
	
	# update build version
	if [ ! -z "$BUILD_NUMBER" ]; then
		old_version=${pkg_version}
		pkg_version=`echo ${pkg_version} | sed 's/.0$/.'"${BUILD_NUMBER}"'/'`
		sed -i .bak 's/\"version\": \"'"${old_version}"'\"/\"version\"\:\ \"'"${pkg_version}"'\"/' package.json
	fi

	# set udpate server
	if [ ! -z "$UPDATE_SERVER" ]; then
		update_url=$(echo ${UPDATE_SERVER} | sed -e 's/[\/&.-]/\\&/g') # for autoUpdater
		sed -i .bak 's/orion\.autoUpdater\.url\=/orion\.autoUpdater\.url\='"${update_url}"'/' orion.conf
		latest_build=$(curl -s ${UPDATE_SERVER}"/api/version/latest" | jsawk 'return this.tag')
		if [ ! -z "$latest_build" ]; then
			download_url=$(echo ${UPDATE_SERVER}"/download" | sed -e 's/[\/&.-]/\\&/g') # for remoteReleases
			sed -i .bak "s/.*remoteReleases.*/\"remoteReleases\": \"${download_url}\/v${latest_build}\"/" package.json
		fi
	fi
}

update_config_files

exit

# create .npmrc to target electron runtime
if [ ! -f ".npmrc" ]; then
cat <<EOF >> .npmrc
runtime = electron
target = $electron_version
target_arch = x64
disturl = https://atom.io/download/atom-shell
EOF
fi

# Install production modules and clean up some unecessary files to reduce size
rm -rf node_modules
npm install --production
rm -rf node_modules/node-pty
rm -rf node_modules/nodegit/vendor
rm -rf node_modules/nodegit/build/Release/obj.target
rm -rf target

# Install electron builder
npm install -g electron-builder@5.5.0

# Build mac dmg, etc
if [ -z "$NODEGIT_DIR" ]; then
	NODEGIT_DIR=~/downloads/orion/orionode/nodegit
fi
nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/mac/nodegit.node
if [ -f "$nodegit_lib" ]; then
	cp $nodegit_lib ./node_modules/nodegit/build/Release
fi
npm run dist:osx

# Build windows setup, etc
nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/windows/nodegit.node
if [ -f "$nodegit_lib" ]; then
	cp $nodegit_lib ./node_modules/nodegit/build/Release
fi
npm run dist:win

# Build linux packages, etc
nodegit_lib=${NODEGIT_DIR}/v${nodegit_version}/electron/v${electron_version}/linux/nodegit.node
if [ -f "$nodegit_lib" ]; then
	cp $nodegit_lib ./node_modules/nodegit/build/Release
fi
npm run dist:linux
