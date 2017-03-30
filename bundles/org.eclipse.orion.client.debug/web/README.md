# Orion Debug

Orion debug is a solution for debugging in Orion using [VS Code debug protocol](https://code.visualstudio.com/docs/extensionAPI/api-debugging).

The client side debug UI talks to the debug server (the debugee will run on the same host), and the debug server forwards messages between the client side debug UI and the debug adapter.

## Architecture

|           | Orion Client          | Debug UI (inside Orion Client)    | Debug Server          | Debug Adapter         | Actual Debugger       | Debugee       |
| --------- | --------------------- | --------------------------------- | --------------------- | --------------------- | --------------------- | ----------    |
| Source    | Current codebase      | New code                          | New Code              | VS Code community     | Native                | User code     |
| Purpose | Editor | Control the debugger and show messages from the debugger | Manage adapters | Translator between VS Code debug protocol and the actual debugger | Debugger | Debugee |

\* Every two adjecent components talks to each other.

Notice that there could be multiple adapter implementations but only one debug protocol, so we can use the same client side debug UI (and also its communication logic) to debug different programming languages, by simply switching debug adapters.

The debug server can be either a standalone node application or a module of Orionode. (See [Typical use cases](#typical-use-cases))

### Frontend architecture

#### Debug service

Debug service is a generic service, which means it doens't stick to any debugger implementation. It manages breakpoints and watches, and tells the editor which line to highlight.

#### Native deploy service

Native deploy service doesn't actually deploy anything. It is the entry point when the user wants to run and debug something.
Once the user clicks "deploy", which actually means "run" here, it connects to the debug server through a debug socket.

#### Debug pane

Debug pane is a slideout in the side bar. It is the debugging UI for the VSCode Debug Protocol. Notice that there are multiple
debug pane instances, and each of them corresponds to a launch configuration.

### Backend architecture

The backend manages all the installed debug adapters. It runs at most one debug adapter per connection. Once a connection is
establised and a debug adapter for it is launched, it just simply forward messages between the adapter and the frontend.

## Setup Guide

### Adapter Configuration

[ORION_DIR/modules/orionode.debug.server/adapters.json](../../../modules/orionode.debug.server/adapters.json) is the adapter configuration file.

The format of this configuration is:
~~~json
{
    "ADAPTER_NAME": {
        "repository": "GIT_REPO_URL",
        "build": "(optional) BUILD_SCRIPT",
        "templates": [
            {
                "SOME_KEY": "SOME_VALUE"
            }
        ]
    }
}
~~~

### Server Side Setup

[ORION_DIR/modules/orionode.debug.server/config.json](../../../modules/orionode.debug.server/config.json) is the configuration file of the debug server.

Run ```npm install``` in [ORION_DIR/modules/orionode.debug.server](../../../modules/orionode.debug.server) to install dependencies and adapters.

#### Run as a module of Orionode

Run Orionode.

#### Run as a standalone server

Run ```node server.js``` in [ORION_DIR/modules/orionode.debug.server](../../../modules/orionode.debug.server).

### Client Side Setup

Launch Orion. Go to settings -> general settings. Check "Enable debugger". Then there should be a "Native" configuration in the run bar.

## Adapter templates

The only thing that is different between each adapter implementations is the launch configuration. So every adapter implementation provides some default templates. However, the configuration may have some VS Code specific fields. So it's better to [override the default templates in the adapter settings](#adapter-configuration).

## Typical Use Cases

### Developing in a Container

Setup:
* Host a single-user Orionode server with debug server module in a container.

The user can develop and debug an application inside this container. Everything run in this container.

### Remote Debugging

Setup:
* Host a multi-user Orion server on a public server. The server can be either the Java or the JavaScript version.
* Or use the Electron build.
* Setup a deployment service so that the changes made in the public Orion server can be synchronized to the user's own server.
* Run the standalone debug server on the user's own server.

The user can develop and debug an application on Orion, but the applcation (debugee) runs on the user's own server.

### Electron Local Debugging

Setup:
* Run a Electron build locally.

The user can develop and debug an application locally just as other desktop editors.
