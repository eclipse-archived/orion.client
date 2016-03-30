#!/bin/bash
#******************************************************************************
# Copyright (c) 2010, 2014 IBM Corporation and others.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html
#
# Contributors:
#     IBM Corporation - initial API and implementation
#*******************************************************************************
#
# This script deploys a new Orion build to an orion server
# Usage: deploy -archive <archive> <host>

while [ $# -gt 0 ]
do
        case "$1" in
                "-archive")
                        ARCHIVE="$2"; shift;;

                 *) break;;      # terminate while loop
        esac
        shift
done

#default to using orion.eclipse.org
HOST=${1-"orionode"}
SERVERHOME=/home/admin/${HOST}


currDate=`date`
echo "----------------- $currDate ----------------"

if [ "$ARCHIVE" ]
then
        echo "Deploying ${ARCHIVE} to ${HOST}"
else
        echo 'Usage: deploy.sh -archive <archive-name> [<host>]'
        exit
fi

echo "Copying build to ${HOST}"
scp ${ARCHIVE} admin@${HOST}:${SERVERHOME}
if [ $? -gt 0 ]
then
        echo "Copy failed: scp ${ARCHIVE} admin@${HOST}:${SERVERHOME}"
        exit
fi
ARCHIVEFILE=`basename ${ARCHIVE}`
echo "Invoking upgrade script on ${HOST} with archive file ${ARCHIVEFILE}"
ssh -l admin ${HOST} /home/admin/${HOST}/upgrade.sh -archive ${ARCHIVEFILE}
echo "Deploy complete in $SECONDS seconds"
echo "------------------------------------------"
