# Overview

This service provides data for a status overview of rocket statuses.

## Implementation notes

Duplicate events are handled by keeping a list of processed events. Out-of-order events are not yet supported.

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
