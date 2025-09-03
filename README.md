# Overview

This service provides data for a status overview of rocket statuses.

## Implementation notes

Duplicate and out-of-order events are handled by only processing events when it matches the sequence of the current state. Future events (i.e. events that have a higher sequence number than the current state) are stored in a buffer and replayed when gaps are closed. Dropped events are not supported.

## Usage

After cloning, install packages

```sh
$ npm i
```

build

```sh
$ ./node_modules/.bin/tsc
```

deploy

```sh
$ npx @riddance/deploy dev1
```

where `dev1` is the namespace (aka. prefix). Deployment requires valid AWS credentials stored in `~/.aws/credentials`.
