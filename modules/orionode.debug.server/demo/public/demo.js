$(document).ready(function () {
    var PRESET_CONFIG = {
        node: {
            name: 'Launch Program',
            type: 'node',
            request: 'launch',
            program: '/Users/ibm/dev/org.eclipse.orion.client/modules/orionode/server.js',
            cwd: '/Users/ibm/dev/org.eclipse.orion.client/modules/orionode'
        },
        lldb: {
            "type": "lldb",
            "request": "launch",
            "name": "Launch",
            "program": "/Users/ibm/dev/demoCpp/a.out",
            "args": [],
            "cwd": "/Users/ibm/dev/demoCpp"
        },
        python: {
            "name": "Python",
            "type": "python",
            "request": "launch",
            "stopOnEntry": true,
            "pythonPath": "/usr/local/bin/python",
            "program": "/Users/ibm/dev/demoPython/main.py",
            "cwd": "/Users/ibm/dev/demoPython",
            "debugOptions": [
                "WaitOnAbnormalExit",
                "WaitOnNormalExit",
                "RedirectOutput"
            ]
        }
    };

    var PRESET_CMD = {
        continue: {
            command: "continue",
            arguments: {}
        },
        pause: {
            command: "pause",
            arguments: {}
        },
        cppBreakpoint: {
            "command": "setBreakpoints",
            "arguments": {
                "source": {
                    "path": "/Users/ibm/dev/demoCpp/main.cpp"
                },
                "breakpoints": [{
                    "line": 9
                }]
            }
        },
        disconnect: {
            command: "disconnect",
            arguments: {}
        },
        configDone: {
            command: "configurationDone",
            arguments: {}
        },
        stackTrace: {
            command: "stackTrace",
            arguments: {
                threadId: 0
            }
        },
        next: {
            command: "next",
            arguments: {
                threadId: 0
            }
        }
    }

    var INIT_CMD = {
        "command": "initialize",
        "arguments": {
            "adapterID": null,
            "pathFormat": "path",
            "linesStartAt1": true,
            "columnsStartAt1": true,
            "supportsVariableType": true,
            "supportsVariablePaging": true,
            "supportsRunInTerminalRequest": true
        },
        "type": "request",
        "seq": 1
    };

    var socket = null;

    // Assign some initial value
    $('#message-out').val(JSON.stringify(PRESET_CMD.configDone, null, 4));

    disableLaunch();

    function launch(type) {
        $(this).prop('disabled', true);

        // Start a debug session
        var initCmd = JSON.parse(JSON.stringify(INIT_CMD));
        initCmd.arguments.adapterID = type;

        socket.emit('init', initCmd);

        socket.once('ready', function() {
            $('#message-send').prop('disabled', false);
            var config = JSON.parse(JSON.stringify(PRESET_CONFIG[type])); // make a copy
            $('#message-out').val(JSON.stringify({
                command: config.request,
                arguments: config
            }, null, 4));
        });
    }

    function enableLaunch() {
        $('#debugger-config-node').prop('disabled', false);
        $('#debugger-config-python').prop('disabled', false);
        $('#debugger-config-lldb').prop('disabled', false);
    }

    function disableLaunch() {
        $('#debugger-config-node').prop('disabled', true);
        $('#debugger-config-python').prop('disabled', true);
        $('#debugger-config-lldb').prop('disabled', true);
    }

    function enableSend() {
        $('#message-send').prop('disabled', false);
    }

    function disableSend() {
        $('#message-send').prop('disabled', true);
    }

    // Connect to adapter server
    socket = io.connect('/debug');
    socket.on('fail', function(error) {
        console.log(error);
    });

    socket.on('ready', function() {
        disableLaunch();
        enableSend();
    });

    socket.on('idle', function() {
        enableLaunch();
        disableSend();
    });

    $('#message-send').click(function () {
        // Send a new operation
        var message = JSON.parse($('#message-out').val());
        socket.emit('request', message, function(response) {
            onMessage(response);
        });

        // Log hit
        $('#message-in').text($('#message-in').val() + '========== SENT REQUSET ==========' + "\r\n\r\n");
    });

    function onMessage(message) {
        // Receive message from adapter
        $('#message-in').text($('#message-in').val() + JSON.stringify(message, null, 4) + "\r\n\r\n");
        $('#message-in').scrollTop($('#message-in')[0].scrollHeight);
    };

    socket.on('request', onMessage);
    socket.on('event', onMessage);

    // Bind preset config button
    $('#debugger-config-node').click(function () {
        launch('node');
    });
    $('#debugger-config-python').click(function () {
        launch('python');
    });
    $('#debugger-config-lldb').click(function () {
        launch('lldb');
    });

    // Bind some util
    $('#debugger-continue').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.continue, null, 4));
    });
    $('#debugger-pause').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.pause, null, 4));
    });
    $('#debugger-stop').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.disconnect, null, 4));
    });
    $('#debugger-cppBreak').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.cppBreakpoint, null, 4));
    });
    $('#debugger-configDone').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.configDone, null, 4));
    });
    $('#debugger-stack').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.stackTrace, null, 4));
    });
    $('#debugger-stepover').click(function () {
        $('#message-out').val(JSON.stringify(PRESET_CMD.next, null, 4));
    });
});
