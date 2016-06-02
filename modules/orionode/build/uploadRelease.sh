#!/bin/bash

# TODO follow flow of orionode_build.sh
# TODO make more portable
# TODO figure out where to store icons - storing them in version 1 files might not be the best idea
# TODO once linux targets are figured out, follow upload model for win/osx
# TODO change /Orion-linux-x64 to /linux, /Orion-darwin-x64 to /mac, change /win to /windows to follow current build naming conventions
# TODO change Orion-Setup-x.x.x.exe to Orion-x.x.x-setup.exe
# TODO stop uploading LICENSES, and LICENSES.chromium, and Orion.app

export GITHUB_TOKEN="b4515ae8e2fdcafb869e11cce08e57e85c4fb480"
export CSC_NAME="IBM"

cp ../orion.icns ./build
cp ../orion.ico ./build
mv ./build/orion.ico icon.ico
cp ../orionLogo.gif ./build

mv icon icons
mv ./icons/16x32/orion.png ./icons
mv ./icons/32x32/orion.png ./icons
mv ./icons/48x48/orion.png ./icons
mv ./icons/128x128/orion.png ./icons
mv ./icons/256x256/orion.png ./icons

rm -rf orionode/node_modules/passport*
rm -rf orionode/node_modules/mongoose
rm -rf orionode/node_modules/mongodb
rm -rf orionode/node_modules/nodemailer

user="mzmousa"
repo="Orion-Update"
description=$(grep "description" package.json | awk -F: '{ print $2 }' | sed 's/[",]//g' | sed 's/^[ \t]*//') # remove quotes, then remove leading spaces

old_pkg_version=$(grep "version" package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
update_url_base="orion-update.mybluemix.net/download"

npm version patch # increments version patch, e.g., 1.0.0 -> 1.0.1
pkg_version=$(grep "version" package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
vpkg_version="v${pkg_version}"

name=$(grep "name" package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# update URL for autoUpdater to be changed in package.json
old_update_url="${update_url_base}/${old_pkg_version}"
new_update_url="${update_url_base}/${pkg_version}"

# path to distributable files   
dist_path="./dist"

# generate win64 artifacts: -full.nupkg, -delta.nupkg, .exe, RELEASES
npm run dist:win64
echo "windows artifacts generated"

# generate osx artifacts: .dmg, -mac.zip, .app
npm run dist:osx
echo "osx artifacts generated"

# npm run dist:linux
# echo "linux artifacts generated"

# path to windows artifacts
dist_path_win="${dist_path}/win"

# put all the files inside dist_path_win in an array
win_files=("${dist_path_win}/"*)

# create a new, formal release that follows both Nuts naming conventions
# ./github-release release --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${vpkg_version}" --description "${description}"

# upload all win64 distributables to the new release
for ((i=0; i<${#win_files[@]}; i++)); do
    file_path="${win_files[$i]}"
    echo $file_path
    file_name="${file_path#$dist_path_win/}" # remove leading dirs, e.g., ./dist/win/app.exe -> app.exe
    file_name="${file_name// /-}" # if the name has whitespace, replace with dashes
    new_path="${dist_path_win}/${file_name}"
    echo $new_path
    mv "${file_path}" "${new_path}" # rename our file to not have spaces
    necessary_file=$(echo ${file_name} | grep -e "${pkg_version}" -e "RELEASES" || echo 0 ) # if filename does not contain correct version #, or is not RELEASES, exclude it
    if [[ $necessary_file != "0" ]] ; then
        echo "uploading ${file_name}"
        ./github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"
    else
        # rm $file_path
        echo dog
    fi
done

# path to osx artifacts
dist_path_osx="${dist_path}/osx"

osx_files=("${dist_path_osx}/"*)    

# upload all distributables to the new release
for ((i=0; i<${#osx_files[@]}; i++)); do
    file_path="${osx_files[$i]}"
    file_name="${file_path#$dist_path_osx/}" # remove leading dirs, e.g., ./dist/win/app.exe -> app.exe
    file_name="${file_name// /-}" # if the name has whitespace, replace with dashes
    new_path="${dist_path_osx}/${file_name}"
    mv "${file_path}" "${new_path}"
    echo "uploading ${file_name} at path ${file_path}"
    ./github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"
done

# linux currently only has 1 artifact to upload (for now)
new_path="${dist_path}/${name}-${pkg_version}-amd64.deb"
file_name="${linux_file_path#$dist_path/}" # remove leading dirs for clean name upload, e.g., ./dist/win/app.exe -> app.exe

echo "uploading ${file_name}"
./github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"

# # implement this when we have multiple linux artifacts for linux, e.g., rpm, tar.gz., deb,...
# dist_path_linux="${dist_path}/${name}-linux-x64"

# linuxfiles=("${dist_path_linux}/"*)

# echo $linuxfiles

# # upload all distributables to the new release
# for ((i=0; i<${#linux_files[@]}; i++)); do
#     file_path=${linux_files[$i]}
#     file_name=${file_path#$dist_path_linux/} # remove leading dirs, e.g., ./dist/win/app.exe -> app.exe
#     file_name=${file_name// /-} # if the name has whitespace, replace with dashes
#     new_path="${dist_path_linux}/${file_name}"
#     echo $new_path
#     echo $file_name
#     echo "${dist_path_linux}/${file_name}"
#     mv "${file_path}" "${new_path}"
#     echo "uploading ${file_name} at path ${file_path}"
#     ./github-release upload --user "${user}" --repo "${repo}" --tag "${vpkg_version}" --name "${file_name}" --file "${new_path}"
# done

# restore remoteReleases URL to current version for future builds
sed -i -e "s@${old_update_url}@${new_update_url}@g" package.json

echo $(cat package.json | grep remoteReleases)

