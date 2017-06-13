#!/bin/bash
# 
#  Env vars:
#
#    GITHUB_API - github API url
#    GITHUB_TOKEN - github access token for uploading releases and commit changes
#    GITHUB_REPO - github repository
#    GITHUB_USER - github user
#    RELEASE_DESCRIPTION - the release description
#    RELEASE_CHANNEL - the release channel (optional)

cd ..

if [ -z "$RELEASE_CHANNEL" ]; then
	RELEASE_CHANNEL="-alpha"
fi

name=$(jsawk -i package.json 'return this.name')
pkg_version=$(jsawk -i package.json 'return this.version')

# upload a file under the specified github release
# $1: file name/path
upload () {
	echo Uploading $1
	github-release upload --user "${GITHUB_USER}" --repo "${GITHUB_REPO}" --tag v"${pkg_version}${RELEASE_CHANNEL}" --name $1 --file $1
}

# create a new release
new_release() {
	echo Creating release v"${pkg_version}${RELEASE_CHANNEL}"
	github-release release --user "${GITHUB_USER}" --repo "${GITHUB_REPO}" --tag v"${pkg_version}${RELEASE_CHANNEL}" --name v"${pkg_version}${RELEASE_CHANNEL}" --description "${RELEASE_DESCRIPTION}"
}

checkfile() {
	if [ ! -f $1 ]; then 
		echo "File not found: "$1
		exit 1
	fi
}

pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

checkfile "dist/linux/${name}-${pkg_version}.deb"
checkfile "dist/linux/${name}-${pkg_version}.rpm"
checkfile "dist/linux/${name}-${pkg_version}.tar.gz"
checkfile "dist/osx/${name}-${pkg_version}.dmg"
checkfile "dist/osx/${name}-${pkg_version}-mac.zip"
checkfile "dist/win/${name}-${pkg_version}-full.nupkg"
checkfile "dist/win/${name}-${pkg_version}-setup.exe"

new_release

# upload linux artifacts to new release
pushd dist/linux
upload "${name}-${pkg_version}.deb"
upload "${name}-${pkg_version}.rpm"
upload "${name}-${pkg_version}.tar.gz"
popd

# upload osx artifacts to new release
pushd dist/osx
upload "${name}-${pkg_version}.dmg"
upload "${name}-${pkg_version}-mac.zip"
popd

# upload windows artifacts to new release
pushd dist/win
upload "RELEASES"
upload "${name}-${pkg_version}-full.nupkg"
if [ -e "${name}-${pkg_version}-delta.nupkg" ]; then
	upload "${name}-${pkg_version}-delta.nupkg"
fi
upload "${name}-${pkg_version}-setup.exe"
popd
