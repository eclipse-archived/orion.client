# Orion - Atom Package

Orion - Atom is a package that enables connections to Eclipse Orion for collaboration. 

## Getting Started

These instructions will get you an instance of the Atom package up and running on your local machine for development and testing purposes.

### Prerequisites

Please ensure that you have the latest version of Atom installed:

```
https://atom.io/
```

Also ensure that your Eclipse Orion repository is up to date. The repository can be found at:

```
https://github.com/eclipse/orion.client
```

### Installing the package

1. Within your terminal, navigate to:
  ```
  orion.client/modules/orionode.collab.atom
  ```
2. Within this directory, link the package to Atom using:
  ```
  apm link
  ```

## Running the package

(*Refer to each command's specific section for configuration details before running the package.*)

Running the Atom - Orion package consists of three consecutive commands:

1. Start_Collab
2. Join_Session
3. Join_Document

These three commands can be executed in Atom using the Command Palette
```MAC: Command + Shift + P```
```PC and Linux: Control + Shift + P```

### Orion: Start_Collab

Upon execution, function start_collab within *orion.js* is called. Start_collab handles the connections through socket.io, as well as message transfers. 

At the moment **there are two attributes that must be entered manually** in respect to their Orion values:

- Orion Collab Hub IP + Port
- SessionID

Example: 

```
mySocket = io.connect('http://localhost:8082/' + "?sessionId=" + 'jnpO0CBn8n', {
	path: "/socket.io/"
});
```
The SessionID can be found in *orion.client/modules/orionode.collab.hub/server.js* by printing to terminal:

```
var sessionID = sock.conn.request._query.sessionID; (~ Line 30)
console.log("The SessionID is: " + sessionID);
```

#### Socket.IO Channels

Transferring of text from Orion to Atom is done within the 'message' channel as described below.

'connect' : Calls join_session()

'disconnect' : Disconnects user from current socket.io session

'error' : Displays all socket.io server errors

'message' : Has types 'init-document' and 'operation'

##### ***If the message object has type 'operation', text is transferred and inserted into Atom.***

```
if (msgObj.type === 'operation') {
	atom.workspace.getActiveTextEditor().insertText(msgObj.operation[1]);
}
```

### Orion: Join_Session

Upon execution, function join_session within *orion.js* is called. Join_session handles the connection of users to a specific Orion session.

At the moment there are two attributes that must be entered manually in respect to their Orion values:
- ClientID     ```In the form of: username.12345```
- Token  ```In the form: username``` 


**Temporary Alert: *Both Authentication and Token usage were removed (commented out) to enable Atom connections to Orion. This avoids the need for JWT_SECRET within each user object.***

### Orion: Join_Document

Upon execution, function join_document within *orion.js* is called. Join_document handles the connection of users to a specific Orion document.

At the moment there are two attributes that must be entered manually in respect to their Orion values:
- Document path
- The same ClientID from Orion: Join_Session

```
mySocket.emit('message', JSON.stringify({
	type: 'join-document',
	doc: '/arshi-OrionContent/Test/test.txt',
	clientId: 'arshi3.12345'
}));
```

## To Do

List of things to do towards the completion of the Atom - Orion package.

**Real-time Editing**

- Sending messages/text from Orion to Atom
  - *Text Insertion location needs to be same on both editors (In progress)*
- Sending messages/text from Atom to Orion

**Authentication**

- Restore the security layer for Atom users such that the Atom user needs to be authenticated to view/edit files and directories.
  - *Authentication had been temporarily removed for development purposes.*

**Invitation/Revoke Access Control**

- Show Atom user a list of workspaces that he has access to.

**Workspaces**

- Let the user choose the workspace he wishes to work on.
- Get a representation of the tree (files and directories) once they are in a workspace.
  - Render the tree
  - Starter goal: List View
  - End goal: GUI within Atom
- Synchronized file manipulation, such as Create, Rename, Delete.
- Let Atom user select a file (in the chosen workspace) so that they can view/edit the document.
- Get file content for the chosen file and render it on Atom when Atom user joins a document.
  - *Content is currently fetched and inserted into the Atom editor*

**Text, Audio, and Video Communication**

- Implementation of a text chat with individual chatroom scopes for: Workspace, Project Folder, and File.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/eclipse/orion.client/blob/master/CONTRIBUTING.md) for details on our code of conduct, and developer resources.

## Versioning

We use Github for versioning. For the versions available, see the commits on [this repository](https://github.com/eclipse/orion.client).

## License

Dual-licensed under the [Eclipse Public License v1.0](http://www.eclipse.org/legal/epl-v10.html) and the [Eclipse Distribution License v1.0](http://www.eclipse.org/org/documents/edl-v10.html).