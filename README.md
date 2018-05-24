Orion
=====

Orion is an open-source development platform focused on creating applications for the web, in the web. 

The vision behind Orion is to move software development to the web by 
enabling open tool integration through HTTP and REST, JSON, OAuth, OpenID, and others. 
We exploit internet design principles throughout, allowing Orion to be easily run in the browser, locally and in Electron. 

Great care has been taken to provide a world class web development experience, rather than to recreate the traditional desktop
IDE experience in a browser tab.

Please refer to our [project page](https://projects.eclipse.org/projects/ecd.orion) for plan and overall project information, or
head over to the [wiki](http://wiki.eclipse.org/Orion) for even more information about Orion.

Contributing
------------

For complete details on getting the source and getting setup to develop Orion, see the [Orion wiki](http://wiki.eclipse.org/Orion/Getting_the_source).

Bug reports and patches are welcome in [bugzilla](https://bugs.eclipse.org/bugs/enter_bug.cgi?product=Orion), you can also open pull requests directly against [this repository](https://github.com/eclipse/orion.client).

How to build Orion using Maven
------------------------------

### Install Maven:

Install latest Maven 3.0 from http://maven.apache.org

### Clone Git repositories:

Clone `orion.client` and `orion.server` under the same local folder

```
% cd /my/git/repos
% git clone https://github.com/eclipse/orion.client.git
% git clone https://github.com/eclipse/orion.server.git
```

### Run Maven build:
```
% cd orion.server
% mvn clean install -P platform-kepler,local-build -Dorion.client.build.skip -DskipTests
```

### Run the Orion server
```
% cd releng/org.eclipse.orion.server.repository/target/products/org.eclipse.orion/linux/gtk/x86_64/eclipse/
% ./orion
```

Now point your browser at `http://localhost:8080` to start the Orion client.

How to build Orion using npm
------------------------------

### Install Node.js:

Install the latest Node.js v6 LTS from http://nodejs.org/

### Clone Git repositories:

Clone `orion.client`.

```
% cd /my/git/repos
% git clone https://github.com/eclipse/orion.client.git
```

### Run npm install:
```
% cd orion.client
% cd modules/orionode
% npm install
```

### Run the Orion server
```
% node server.js
```

Now point your browser at `http://localhost:8081` to start the Orion client.
  
License
-------

This repository contains the Orion client. This source code is available
under the [Eclipse Public License](http://www.eclipse.org/legal/epl-v10.html)
and [Eclipse Distribution License](http://www.eclipse.org/org/documents/edl-v10.php).
