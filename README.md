# nleak

#### Build
```sh
$ docker build . -t nleak_build --platform=linux/amd64
$ docker run -v <path on host>:/home/NLeak --platform=linux/amd64 -it nleak_build:latest
```