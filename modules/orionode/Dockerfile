FROM java:8

ARG JAVA_LANGUAGE_SERVER
ARG NODE_VERSION
ARG LSP_ORION_VERSION

# install java lsp server based on the latest build
RUN mkdir -p /home/java-language-server
WORKDIR /home/java-language-server
RUN curl -L https://dl.bintray.com/gorkem/java-language-server/java-server-1.0.0-$JAVA_LANGUAGE_SERVER.tar.gz -o /home/java-language-server/java-server.tar.gz
RUN tar -xzvf /home/java-language-server/java-server.tar.gz
RUN rm /home/java-language-server/java-server.tar.gz

# install node 4.4.1 which is the version that matches the one used on hudson for nodejs server builds
RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done

RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
  && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs

# Create app directory
RUN mkdir -p /home/orion
WORKDIR /home/orion

# Retrieve nodejs Orion server and install it
RUN curl -s download.eclipse.org/orion/lsporionode/lsporionode_$LSP_ORION_VERSION.tar.gz > /home/orion/orionode.tar.gz
RUN tar -xzvf /home/orion/orionode.tar.gz
RUN rm /home/orion/orionode.tar.gz

# Copy the lsp server into the server folder
RUN cp -R /home/java-language-server/ /home/orion/orionode/server

WORKDIR /home/orion/orionode

# install sample project for demoing
RUN mkdir -p /home/workspace

EXPOSE 8081

WORKDIR /home/orion/orionode
CMD [ "node", "server.js","-w","/home/workspace" ]