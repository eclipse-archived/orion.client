#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
pushd "$DIR" > /dev/null
$(npm bin)/grunt && npm publish
RC=$?
popd > /dev/null
exit $RC
