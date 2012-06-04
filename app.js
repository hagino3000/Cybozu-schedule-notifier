#!/opt/local/bin/node

var Cybozu = require('./thirdparty/cybozu-connect'),
    growl = require('growl'),
    SETTINGS = require('./settings');

Cybozu.init(SETTINGS.JQUERY_PATH, function(API) {

  if (API) {
    console.log(API);
    growl('Cheking Cybozu schedules.......');

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
      console.info(events.users);
      events.users[con.user.id].forEach(function(s) {
        if (!s.allDay) {
          glowlEvent(s);
        }
      });
    }
  } else {
    console.info('failed to init cybozu api');
  }
});


function glowlEvent(e) {
  console.info(e.title);
  var start = new Date(e.start);
  growl(e.title, {
    title: 'Cybozu: ' + start.toLocaleTimeString(),
    sticky: true
  });
}

