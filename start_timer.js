'use strict';

var later = require('later');

var app = require('./app');

function setTimer(runner) {
    console.info('Start timer');
    later.setInterval(runner, later.parse.cron('25/55 * * * *'));
}

app.getRunner(function(runner) {
    setTimer(runner);
});
