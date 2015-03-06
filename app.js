'use strict';

var NotificationCenter = require('node-notifier/notifiers/notificationcenter'),
    keychain = require('keychain');

var Cybozu = require('./thirdparty/cybozu-connect'),
    SETTINGS = require('./settings');


function notifySchedule(data) {
    data.forEach(function(entry) {
        var notifier = new NotificationCenter();
        notifier.notify({
            title: entry.title,
            subtitle: entry.time,
            message: entry.location,
            icon: __dirname + '/image/icon.png',
            open: entry.url
        });
    });
}

function notifyError(message) {
    console.error(message);
    var notifier = new NotificationCenter();
    notifier.notify({
        title: 'Garoon notifier Error',
        message: message,
    });
}

function createRunner(GaroonAPI, password) {
    var url = SETTINGS.URL;
    var account = SETTINGS.LOGIN_ACCOUNT;

    var runner = function() {
        var con = new GaroonAPI.CybozuConnect.App(url, account, password);
        if (!con.user) {
            notifyError('ガルーンにログインできませんでした');
            return;
        }

        // 直近60分のスケジュールを取得する
        var now = new Date();
        var offset = 1000*60*60;
        var end = new Date(+now + offset);

        var schedule = new GaroonAPI.CybozuConnect.Schedule(con);
        var events = schedule.getEvents({
            start : now,
            end : end,
            userIdList : [con.user.id]
        }, true);

        if (events.users && events.users[con.user.id]) {
            var nearestSchedule = [];
            (function processEvents(){
                var ev = events.users[con.user.id].pop();
                if (ev) {
                    if (!ev.allDay) {
                        nearestSchedule.push({
                            title: ev.title,
                            time: (new Date(ev.start)).toLocaleTimeString() + ' - ' + (new Date(ev.end)).toLocaleTimeString(),
                            body: ev.description,
                            location: ev.facilities[0] ? ev.facilities[0].name : '場所の指定無し',
                            url: SETTINGS.URL + '/schedule/view?event=' + ev.id
                        });
                    }
                    processEvents();
                } else {
                    notifySchedule(nearestSchedule);
                }
            })();
        }
    };
    return runner;
}

function getRunner(next) {
    keychain.getPassword({
        account: SETTINGS.LOGIN_ACCOUNT,
        service: SETTINGS.KEYCHAIN_ENTRY_NAME
    }, function(err, password) {
        if (err) {
            console.error(err);
            console.error('Failed to get Password from Keychain.');
            return;
        }

        Cybozu.init(SETTINGS.JQUERY_PATH, function(API) {
            if (!API) {
                console.error('Cannot get Garoon API');
                return;
            }
            next(createRunner(API, password));
        });
    });
}

process.on('uncaughtexception', function(e) {
    console.error(e);
});

exports.getRunner = getRunner;
