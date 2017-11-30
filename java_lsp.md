Contributing to Orion/LSP Support
=================================

Thanks for your interest in this project.

Setup instructions
------------------

1) Clone the [orion.client](https://github.com/eclipse/orion.client) Git repository checkout the `java-lsp` branch.

2) Get the lsp server from the [eclipse.jdt.ls](https://github.com/eclipse/eclipse.jdt.ls.git) Git repository and follow the `README.md` file to build it.
dfd
3) Install the compiled LSP server from the `org.eclipse.jdt.ls.product/target/repository` folder to the  `org.eclipse.orion.client/modules/orionode/server` folder.

4) Inside a console where Node.js is installed, do:
  - `npm install`
  - start it by using: `node --debug server.js -p 8083 --w <workspace_path>`
  This runs the Node.js Orion server on localhost:8083.

5) Open the browser on `http://localhost:8083`.
The Orion client with the Java™ plugin requires a Node.js Orion server that is enabled for the language server connections.
This is why for now we use a local Node.js server instead of the instance running on [orion.eclipse.org](https://orion.eclipse.org).

6) In order to help users to test the latest integration, we provide a Dockerfile and a shell script that can be used to build 
a docker image that contains the latest version of the orion Node.js server with lsp support and the latest implementation of the
Java lsp server provided by the eclipse.jst.ls project. In order to do so, you need to go to the `orion.client/modules/orionode/` folder.
Then invoke the `./docker_build.sh` command. Once done, start your image using `docker run -p 8081:8081 orionlsp` and open your browser on at
`http://localhost:8081/`. You will start with an empty workspace in which you can git clone a project with Java files and test the lsp support.

Contributor License Agreement
-----------------------------

Before your contribution can be accepted by the project, you will need to create and electronically sign the
Eclipse Foundation [Contributor License Agreement](https://www.eclipse.org/legal/CLA.php) (CLA):

1. Log in to the [Eclipse projects forge](https://projects.eclipse.org/user/login/sso). You will need to
   create an account with the Eclipse Foundation if you have not already done so.
2. Click on "Contributor License Agreement", and complete the form.

Be sure to use the same email address in your Eclipse account that you intend to use when you commit to Git.

Contact
-------

Contact the project developers via the project's "dev" list.

- [https://dev.eclipse.org/mailman/listinfo/orion-dev]