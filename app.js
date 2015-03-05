var Cybozu = require('./thirdparty/cybozu-connect'),
    NotificationCenter = require('node-notifier/notifiers/notificationcenter'),
    SETTINGS = require('./settings');

Cybozu.init(SETTINGS.JQUERY_PATH, function(API) {

  if (API) {
    console.log(API);
    console.log(SETTINGS);

    var con = new API.CybozuConnect.App(SETTINGS.URL,
                                        SETTINGS.LOGIN_NAME,
                                        SETTINGS.PASSWORD);

    console.info('Login info ----------------');
    console.info(con.user);

    // 直近60分のスケジュールを取得する
    var now = new Date();
    var offset = 1000*60*60;
    var end = new Date(+now + offset);

    var schedule = new API.CybozuConnect.Schedule(con);
    var events = schedule.getEvents({
      start : now,
      end : end,
      userIdList : [con.user.id]
    }, true);

    if (events.users && events.users[con.user.id]) {
      var notifyEvents = [];
      (function processEvents(){
        var ev = events.users[con.user.id].pop();
        if (ev) {
          if (!ev.allDay) {
            notifyEvents.push({
              title: ev.title,
              time: (new Date(ev.start)).toLocaleTimeString() 
                    + " - " 
                    + (new Date(ev.end)).toLocaleTimeString(),
              body: ev.description,
              location: ev.facilities[0] ? ev.facilities[0].name : '場所の指定無し',
              url: SETTINGS.URL + "/schedule/view?event=" + ev.id
            });
          }
          processEvents();
        } else {
          notify(notifyEvents);
        }
      })();
    }
  } else {
    console.info('failed to init cybozu api');
  }
});

function notify(data) {
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

process.on('uncaughtexception', function(e) {
  console.error(e);
});

