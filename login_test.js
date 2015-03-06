'use strict';

var app = require('./app');

app.getRunner(function(runner) {
    console.info('Start fetch nearest schedules immediately');
    runner();
});
