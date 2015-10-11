#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
pushd "$DIR" > /dev/null

# Optimize
shift
if ! which $(npm bin)/grunt ; then
    echo "Could not find grunt. Please run 'npm install' then retry." >&2
    exit 1
fi

$(npm bin)/grunt "$@" || echo "Grunt build failed." >&2 && exit 1

# Pack tarball
tarball=$(npm pack)
RC=$?
if [ "$RC" == "0" ]; then
    echo "pack succeeded! Please sanity check $tarball and if it looks OK, run:"
    echo
    echo "npm publish $tarball"
else
    echo "pack failed :(" &>2
    exit $RC
fi
