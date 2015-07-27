/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node*/

var connect = require('connect');
var resource = require('./resource');
var api = require('./api'), writeError = api.writeError;

var taskList = {};

function orionTasksAPI(options) {
    var workspaceRoot = options.root;
    if (!workspaceRoot) { throw new Error('options.root path required'); }

    return connect()
    .use(connect.json())
    .use(resource(workspaceRoot, {
        GET: function(req, res, next, rest) {

            if(rest.indexOf("id/") !== 0) return writeError(403, res);

            var id = rest.replace("id/", "");

            if (!taskList[id]) return writeError(404, res);

            if (taskList[id].Result) del = true;

            var resp = JSON.stringify(taskList[id]);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(resp);
            // console.log("sent task " + id)
            // console.log(resp)
        },
        // POST: function(req, res, next, rest) {
        //     writeError(403, res);
        // },
        // PUT: function(req, res, next, rest) {
        //     writeError(403, res);
        // },
        DELETE: function(req, res, next, rest) {
            if(rest.indexOf("id/") !== 0) return writeError(403, res);
            
            var id = rest.replace("id/", "");
            delete taskList[id];

            res.statusCode = 200;
            res.end();
        }
    }));
}

//Add the task, return the task so it can be sent
function addTask(id, message, running, completionPercent) {
    var task = {
        Id: id,
        Message: message,
        Running: running,
        PercentComplete: completionPercent,
        Location: "/task/id/" + id
    };

    taskList[id] = task;

    return task;
}

function updateTask(id, completionPercentage, result, type) {
    if (taskList[id]) {

        //if (result) return taskList[id] = result;
        taskList[id]["PercentComplete"] = completionPercentage;
        taskList[id]["Result"] = result;
        if (type) taskList[id]["type"] = type;

        if (completionPercentage === 100) {
            taskList[id].Running = false;
        }
    }
}

module.exports = {
    orionTasksAPI: orionTasksAPI,
    addTask: addTask,
    updateTask: updateTask
};