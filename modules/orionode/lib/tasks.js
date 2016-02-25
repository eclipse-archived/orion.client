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
var express = require('express');
var bodyParser = require('body-parser');
var api = require('./api');
var writeError = api.writeError;

var taskList = {};

function orionTasksAPI(options) {
    var root = options.root;
    if (!root) { throw new Error('options.root path required'); }

    return express.Router()
    .use(bodyParser.json())
    .param('id', function(req, res, next, value) {
        req.id = value;
        next();
    })
    .get('/id/:id', function(req, res/*, next*/) {
        var id = req.id;

        if (!taskList[id]) return writeError(404, res);

        if (taskList[id].Result) del = true;

        res.json(taskList[id]);
        // console.log("sent task " + id)
        // console.log(resp)
    })
    .delete('/id/:id', function(req, res/*, next*/) {
        var id = req.id;
        delete taskList[id];

        res.sendStatus(200);
    });
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