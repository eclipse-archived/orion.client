#Contributing to Orion/LSP Support

Thanks for your interest in this project.

#Steps to reproduce:

1) Clone the git repository : [https://git.eclipse.org/r/orion/org.eclipse.orion.client] and checkout the branch mrennie/languageServer.

2) Get the lsp server from git repo: [https://github.com/gorkem/java-language-server] and follow the README.md to build it.

3) Install the lsp server in org.eclipse.orion.client/modules/orionode/server folder.

4) Inside a console where node.js is installed, do:
  - npm install
  - start it using:	node --debug server.js -p 8083 –w <workspace_path>
  This runs the Node.js Orion server on localhost:8083.

5) Open the browser on http://local.orion.org:8083.
The Orion client with the Java™ plugin requires a Node.js Orion server that is enabled for the language server connections.
This is why for now I use a local Node.js server instead of the instance running on orion.eclipse.org.

#Contributor License Agreement

Before your contribution can be accepted by the project, you need to create and electronically sign the
Eclipse Foundation [Contributor License Agreement](https://www.eclipse.org/legal/CLA.php) (CLA):

1. Log in to the [Eclipse projects forge](https://projects.eclipse.org/user/login/sso). You will need to
   create an account with the Eclipse Foundation if you have not already done so.
2. Click on "Contributor License Agreement", and complete the form.

Be sure to use the same email address in your Eclipse account that you intend to use when you commit to Git.

#Contact

Contact the project developers via the project's "dev" list.

- [https://dev.eclipse.org/mailman/listinfo/orion-dev] (https://dev.eclipse.org/mailman/listinfo/orion-dev)
