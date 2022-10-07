FROM ubuntu:22.04

LABEL MAINTAINER "NLeak Team"
LABEL DESCRIPTION "This image is used to create the build environment for n-leak"

RUN apt-get update && apt -y upgrade && apt-get install -y \
    curl \
    rsync \
    vim \
    zip \
    wget \
    git \
    python3-pip \
    net-tools

RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm

RUN npm install npm@latest -g && \
    npm install n -g && \
    n latest

RUN npm install --global yarn

RUN pip3 install mitmproxy

RUN pip3 install websockets

RUN npm install -g http-server

ENTRYPOINT [ "/bin/bash" ]
