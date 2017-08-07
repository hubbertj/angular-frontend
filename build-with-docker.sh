#!/bin/bash

#docker run --rm -v -it "$PWD":/usr/src/app -w /usr/src/app node:6.10.0 /bin/sh
docker run --rm -v "$PWD":/usr/src/app -w /usr/src/app jenky-jared sh dans-way.sh

