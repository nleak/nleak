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

## System Overview

<img width="750" alt="Slice 1" src="https://user-images.githubusercontent.com/5697641/205152647-1869cd8e-6618-4307-be2a-1b39f119202c.png">

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

### NLeak result preview

<img width="1575" alt="Screen Shot 2022-11-27 at 1 45 27 PM" src="https://user-images.githubusercontent.com/5697641/204161283-ca1ed0b5-3cd3-402e-be1a-4b5532cf86dd.png">
