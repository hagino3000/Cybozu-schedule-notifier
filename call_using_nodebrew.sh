#!/bin/bash
# Launch script for cron if you using nodebrew

export PATH=~/.nodebrew/current/bin/:$PATH
cd `dirname $0`
make run
