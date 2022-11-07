# nleak

[![n-leak CI](https://github.com/nleak/n-leak/actions/workflows/n-leak.js.yml/badge.svg)](https://github.com/nleak/n-leak/actions/workflows/n-leak.js.yml)

An automatical memory detection and diagnosis tool for NodeJS.

## Background

- `core` folder contains all src code for `nleak-core`
    + NodeJS driver
    + Heap analysis
    + Leak detection & debugging algorithms
    + Reporter
    + ...
- `guest` folder contains all src code for running guest app in child NodeJS process
    + Code rewriting logic
    + Instrumental agent
    + Testing guest app
    + ...

## System Architecture

<img width="1254" alt="image" src="https://user-images.githubusercontent.com/5697641/200388783-55ced4e0-103a-41f7-8535-db7359a99a8e.png">

### Local Development

- `npm i`
- `npm run dev`

The `dev` script will start `nodemon` to monitor all TypeScript changes and compile
them into JavaScript and put to `build` folder.

For local testing, currently we support driver tests. Simply run `npm run test:driver`.

### Docker Related Build & CI
Docker is used as CI building environment and testing.

```sh
$ docker build . -t nleak_build --platform=linux/amd64
$ docker run -v <path on host>:/home/NLeak --platform=linux/amd64 -it nleak_build:latest
```
