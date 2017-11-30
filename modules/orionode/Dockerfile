FROM airdock/oracle-jdk

ARG JAVA_LANGUAGE_SERVER
ARG NODE_VERSION
ARG LSP_ORION_VERSION

# install java lsp server based on the latest build
RUN mkdir -p /home/java-language-server
WORKDIR /home/java-language-server
RUN curl -L http://download.eclipse.org/jdtls/snapshots/$JAVA_LANGUAGE_SERVER -o /home/java-language-server/java-server.tar.gz \
  && tar -xzvf /home/java-language-server/java-server.tar.gz \
  && rm /home/java-language-server/java-server.tar.gz

# install node 4.4.1 which is the version that matches the one used on hudson for nodejs server builds
RUN curl -SLO "http://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
  && tar -xzvf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.gz" \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

# Create app directory
RUN mkdir -p /home/orion
WORKDIR /home/orion

# Retrieve nodejs Orion server and install it
RUN curl -SLO download.eclipse.org/orion/lsporionode/lsporionode_$LSP_ORION_VERSION.tar.gz \
  && mv lsporionode_$LSP_ORION_VERSION.tar.gz /home/orion/orionode.tar.gz \
  && tar -xzvf /home/orion/orionode.tar.gz \
  && rm /home/orion/orionode.tar.gz

# Copy the lsp server into the server folder
RUN cp -R /home/java-language-server/ /home/orion/orionode/server

WORKDIR /home/orion/orionode

# install sample project for demoing
RUN mkdir -p /home/workspace

EXPOSE 8083

WORKDIR /home/orion/orionode
CMD [ "node", "server.js", "-p", "8083", "-w","/home/workspace" ]