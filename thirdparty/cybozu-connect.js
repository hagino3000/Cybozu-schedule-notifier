/**
 * cybozu-connect for Node
 */
var jsdom = require('jsdom'),
    XMLHttpRequest = require('XMLHttpRequest').XMLHttpRequest;

var document, 
    window, 
    $, 
    CBLabs = {}, 
    initialized = false;

function init(jQueryPath, callback) {
  document = jsdom.jsdom('<html><head></head><body></body></html>');
  window = document.createWindow();
  jsdom.jQueryify(window, jQueryPath, function(window, jQuery) {
    setupUtility(jQuery);
    $ = jQuery;
    if (!$) {
      console.info('Cannot load jQuery from');
      console.info(jQueryPath);
    }
    callback(CBLabs);
  });
}

function getAPI() {
  if (initialized) {
    return CBLabs
  }
  throw "Not initialized. Call init method in advance.";
}

exports.init = init;
exports.getAPI = getAPI;

///////////////////////////////////////////////////////////////////////////////////
// Code from  http://code.google.com/p/cybozu-connect/
///////////////////////////////////////////////////////////////////////////////////
/*
 * cybozu-connect v1.1.1 - Cybozu API JavaScript Library
 *
 * CBLabs.CybozuConnect.Base class
 *
 * @requires jQuery v1.4.1 or later.
 *
 * Copyright (C) 2011 Cybozu Labs, Inc.
 * http://labs.cybozu.co.jp/
 *
 * Licensed under the GPL Version 2 license.
 */

if (!CBLabs.CybozuConnect) { CBLabs.CybozuConnect = {}; }

CBLabs.CybozuConnect.Base = function (app) {
    /// <summary>Baseで提供されるAPIを実行するためのクラス</summary>
    /// <param name="app" type="CBLabs.CybozuConnect.App" />
    /// <returns type="CBLabs.CybozuConnect.Base" />
    /// <remarks>
    /// <b>ユーザー情報の属性</b>
    /// <pre>
    /// var user = {
    ///     id: "1",                      // ユーザーID
    ///     key: "1",                     // ユーザーID
    ///     login_name: "sato",           // ログイン名
    ///     name: "佐藤",                 // 名前
    ///     status: 1,                    // ユーザーの使用状況
    ///     email: "sato@example.com",    // E-mail アドレス
    ///     primary_organization_id: "1", // 優先する組織のID
    ///     orgIdList: ["1", "2"]         // 所属する組織のIDの配列
    /// };
    /// </pre>
    /// <b>組織情報の属性</b>
    /// <pre>
    /// var org = {
    ///     id: "1",               // 組織ID
    ///     key: "1",              // 組織ID
    ///     name: "営業部",        // 組織名
    ///     userIdList: ["1", "2"] // 所属するユーザーのIDの配列
    /// };
    /// </pre>
    /// </remarks>

    // private variables
    var userArray, userHash, orgArray, orgHash;
    var hierarchical = null;

    // initialize
    app.Base = this; // set to parent property

    // public methods

    this.isHierarchical = function () {
        /// <summary>組織構造が階層的か否かを返す。</summary>
        /// <returns type="Boolean" />

        if (hierarchical == null) {
            this.organizationList();
        }

        return hierarchical;
    };

    this.userList = function () {
        /// <summary>全ユーザー情報を返す。</summary>
        /// <returns type="Array">ユーザー情報の配列</returns>

        if (userArray) return userArray;

        var res = app.queryItems("Base", "BaseGetUserVersions", "BaseGetUsersById", "user_id", "user_item");
        if (!res) return null;

        userArray = new Array();
        userHash = new Object();

        $(res.response).find("user").each(function () {
            $this = $(this);
            var userId = $this.attr("key");
            if (!userId) return;

            var user = {
                id: userId,
                key: userId,
                version: $this.attr("version"),
                order: parseInt($this.attr("order"), 10),
                login_name: $this.attr("login_name"),
                name: $this.attr("name"),
                status: $this.attr("status"),
                email: $this.attr("email"),
                primary_organization_id: $this.attr("primary_organization"),
                orgIdList: []
            };

            $this.find("organization").each(function () {
                var orgId = $(this).attr("id");
                if (orgId) {
                    user.orgIdList[user.orgIdList.length] = orgId;
                }
            });

            userArray[userArray.length] = user;
            userHash[userId] = user;
        });

        return userArray;
    };

    this.user = function (userId) {
        /// <summary>指定したユーザーIDのユーザー情報を返す。</summary>
        /// <param name="userId" type="String">ユーザーID</param>
        /// <returns type="Object">ユーザー情報。存在しない場合は null。</returns>

        if (!userId) return null;

        if (userHash) return userHash[userId];

        this.userList();
        if (!userArray) return null;

        if (!userHash) {
            userHash = {};
            for (var i = 0; i < userArray.length; i++) {
                var user = userArray[i];
                userHash[user.id] = user;
            }
        }

        return userHash[userId];
    };

    this.userSearch = function (userText) {
        /// <summary>ユーザー情報を検索する。</summary>
        /// <param name="userText" type="String">検索文字列（ユーザー名、もしくはメールアドレス）</param>
        /// <returns type="Array">ヒットしたユーザー情報の配列</returns>

        this.userList();

        var userResult = new Array();
        for (var i = 0; i < userArray.length; i++) {
            var user = userArray[i];
            if (user.name && user.name.indexOf(userText) >= 0) {
                userResult[userResult.length] = user;
            } else if (user.email && user.email.indexOf(userText) >= 0) {
                userResult[userResult.length] = user;
            }
        }

        return userResult;
    };

    this.organizationList = function () {
        /// <summary>トップレベルの組織情報を返す。</summary>
        /// <returns type="Array">組織情報の配列</returns>

        if (orgArray) return orgArray;

        hierarchical = false;

        var res = app.queryItems("Base", "BaseGetOrganizationVersions", "BaseGetOrganizationsById", "organization_id", "organization_item");
        if (!res) return null;

        orgArray = new Array();
        orgHash = new Object();

        $(res.response).find("organization[name]").each(function () {
            $this = $(this);
            var orgId = $this.attr("key");
            if (!orgId) return;

            var org = {
                id: orgId,
                key: orgId,
                name: $this.attr("name"),
                version: $this.attr("version"),
                order: parseInt($this.attr("order"), 10),
                userIdList: []
            };

            // child organization ids
            var childOrg = $this.children("organization");
            if (childOrg.length) {
                org.orgIdList = new Array();
                var j = 0;
                childOrg.each(function () {
                    org.orgIdList[j++] = $(this).attr("key");
                });
                hierarchical = true;
            }

            // member ids
            var j = 0;
            $this.find("user").each(function () {
                var userId = $(this).attr("id");
                if (userId) {
                    org.userIdList[j++] = userId;
                }
            });

            // parent organization id
            var parent_organization_id = $this.attr("parent_organization");
            if (parent_organization_id) {
                org.parent_organization_id = parent_organization_id;
                hierarchical = true;
            } else {
                orgArray[orgArray.length] = org;
            }

            orgHash[orgId] = org;
        });

        return orgArray;
    };

    this.organization = function (orgId) {
        /// <summary>指定した組織IDの組織情報を返す。</summary>
        /// <param name="orgId" type="String">組織ID</param>
        /// <returns type="Object">組織情報</returns>

        if (!orgId) return null;

        if (orgHash) return orgHash[orgId];

        this.organizationList();
        if (!orgArray) return null;

        if (!orgHash) {
            orgHash = {};
            for (var i = 0; i < orgArray.length; i++) {
                var org = orgArray[i];
                orgHash[org.id] = org;
            }
        }

        return orgHash[orgId];
    };

    this.primaryOrganization = function (userId, getFirstIfNotBelong) {
        /// <summary>指定したユーザーの優先する組織を返す。</summary>
        /// <param name="userId" type="String">ユーザーID</param>
        /// <param name="getFirstIfNotBelong">true のとき、指定したユーザーが組織に所属していなかった場合、null ではなく、全組織のうち最初の組織を返す。</param>
        /// <returns type="Object">組織情報</returns>

        if (!userId) return null;

        var user = this.user(userId);
        var org = this.organization(user.primary_organization_id);
        if (org) return org;

        if (user.orgIdList.length) {
            org = this.organization(user.orgIdList[0]);
            if (org) return org;
        }

        if (!getFirstIfNotBelong) return null;

        var orgList = this.organizationList();
        if (orgList.length) return orgList[0];

        return null;
    };
};

/*
 * cybozu-connect v1.1.1 - Cybozu API JavaScript Library
 *
 * CBLabs.CybozuConnect.App class
 *
 * @requires jQuery v1.4.1 or later.
 *
 * Copyright (C) 2011 Cybozu Labs, Inc.
 * http://labs.cybozu.co.jp/
 *
 * Licensed under the GPL Version 2 license.
 */

if (!CBLabs.CybozuConnect) { CBLabs.CybozuConnect = {}; }

CBLabs.CybozuConnect.App = function (url, username, password) {
    /// <summary>サイボウズ Office 8/ガルーン 3 連携 API を実行するためのクラス</summary>
    /// <param name="url" type="String">アクセス先のURL。URlは ag.exe(cgi) または grn.exe(cgi) で終わる必要がある。</param>
    /// <param name="username" type="String">省略可。username と password を指定した場合、クラス生成時に auth を実行する。</param>
    /// <param name="password" type="String">省略可。username と password を指定した場合、クラス生成時に auth を実行する。</param>
    /// <returns type="CBLabs.CybozuConnect.App" />
    //

    // private variables
    var _cybozuURL = url;
    var cybozuUsername;
    var cybozuPassword;
    var _cybozuType;
    var _this = this;

    // public variables

    this.error;
    /// <value type="Object">直前のエラー情報</value>

    this.user;
    /// <value type="Object">認証を行ったユーザー情報</value>

    this.userId;
    /// <value type="String">認証を行ったユーザーのID</value>

    this.debug = false;
    /// <value type="Boolean">デバッグモードか否か</value>

    // initialize service URL
    if (_cybozuURL.indexOf("/grn.") >= 0) {
        _cybozuType = "Garoon";
    } else if (_cybozuURL.indexOf("/ag.") >= 0) {
        _cybozuType = "Office";
    } else {
        alert("API が利用できません。");
    }
    if (_cybozuURL.charAt(_cybozuURL.length - 1) == "?") {
        _cybozuURL = _cybozuURL.substr(0, _cybozuURL.length - 1);
    }

    // public methods

    this.cybozuURL = function () { return _cybozuURL; };
    this.cybozuType = function () { return _cybozuType; };

    this.auth = function (username, password) {
        /// <summary> APIに対して認証を行う。auth 実行後、query, exec を呼び出すことができる。</summary>
        /// <param name="username" type="String">ログイン名</param>
        /// <param name="password" type="String">パスワード</param>
        /// <returns type="Boolean">true: 成功、false: 失敗</returns>

        cybozuUsername = username;
        cybozuPassword = password;
        var res = _this.query("Base", "BaseGetUsersByLoginName", { login_name: { innerValue: cybozuUsername} });
        if (res.error) {
            console.info('Login Failed!!');
            console.error(res.error);
            cybozuUsername = cybozuPassword = null;

        } else {
            var user = $(res.response).find("user");
            if (user.length) {
                _this.user = {
                    id: user.attr("key"),
                    key: user.attr("key"),
                    login_name: user.attr("login_name"),
                    name: user.attr("name"),
                    status: user.attr("status"),
                    email: user.attr("email"),
                    primary_organization_id: user.attr("primary_organization")
                };
                _this.userId = this.user.id;
                return true;

            } else {
                cybozuUsername = cybozuPassword = null;
            }
        }

        return false;
    };

    this.clearAuth = function () {
        /// <summary>認証をクリアする。再度 auth を実行しない限り、query, exec を呼び出すことはできなくなる。</summary>

        cybozuUsername = cybozuPassword = null;
        this.user = this.userId = null;
    };

    this.query = function (service, method, params, alertIfError, debug) {
        /// <summary>APIのうち、データ取得系についてのみ実行する。誤ってデータを更新することを防ぐことができる。引数と戻り値は exec と同様。</summary>

        if (method.indexOf(service + "Get") != 0 && method.indexOf(service + "Search") != 0) {
            this.error = { message: "query() メソッドで更新系APIを実行することはできません。" };
            if (alertIfError) {
                alert(this.error.message);
            }
            return { error: this.error };
        }

        return this.exec(service, method, params, alertIfError, debug);
    };

    this.exec = function (service, method, params, alertIfError, debug) {
        /// <summary>APIを実行する。</summary>
        /// <param name="service" type="String">アプリケーション識別子 (Base/Schedule/...)</param>
        /// <param name="method" type="String">API名</param>
        /// <param name="params" type="Object">APIへのパラメータ</param>
        /// <param name="alertIfError" type="Boolean">true のとき、API実行時にエラーが出た場合、アラートボックスを表示する。</param>
        /// <param name="debug" type="Boolean">true のとき、デバッグモードになり、APIへのリクエストおよびレスポンスのXMLの内容が、アラートボックスに表示される。</param>
        /// <returns type="Object">(obj).response にAPIからの戻り値のXMLが入る。エラーの場合 (obj).error.code にエラーコード、(obj).error.message にエラーメッセージが入る。</returns>

        // timestamp
        var time = (new Date()).getTime();
        var created = $.cybozuConnect.formatISO8601(time, false);
        time += 1000;
        var expires = $.cybozuConnect.formatISO8601(time, false);

        // request
        method = $.cybozuConnect.xmlEscape(method);
        var requestXml = '<?xml version="1.0" encoding="utf-8"?>\
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">\
  <soap:Header>\
    <Action soap:mustUnderstand="1" xmlns="http://schemas.xmlsoap.org/ws/2003/03/addressing">' + method + '</Action>\
    <Timestamp soap:mustUnderstande="1" xmlns="http://schemas.xmlsoap.org/ws/2002/07/utility">\
      <Created>' + created + '</Created>\
      <Expires>' + expires + '</Expires>\
    </Timestamp>\
    <Security xmlns:wsu="http://schemas.xmlsoap.org/ws/2002/07/utility" soap:mustUnderstand="1" xmlns="http://schemas.xmlsoap.org/ws/2002/12/secext">\
      <UsernameToken>\
        <Username>' + $.cybozuConnect.xmlEscape(cybozuUsername) + '</Username>\
        <Password>' + $.cybozuConnect.xmlEscape(cybozuPassword) + '</Password>\
      </UsernameToken>\
    </Security>\
  </soap:Header>\
  <soap:Body>\
    <' + method + ' xmlns="http://wsdl.cybozu.co.jp/base/2008">';
        requestXml += makeParametersXml("parameters", params);
        requestXml += '</' + method + '></soap:Body></soap:Envelope>';

        if (debug || this.debug) {
            alert(requestXml);
        }

        // call API
        var req = new XMLHttpRequest;
        var url = _cybozuURL;
        if (_cybozuType == "Garoon") {
            url += "/cbpapi/" + service.toLowerCase() + "/api";
        } else { // Office
            url += "?page=PApi" + service;
        }
        req.open("POST", url, false);
        req.setRequestHeader("Content-Type", 'application/soap+xml; charset=utf-8; action="' + method + '"');
        req.send(requestXml);
        var res;
        if (req.status != 503) {
            if (debug || this.debug) {
                alert(req.responseText);
            }
            var dom = req.responseXml ? req.responseXml : $(req.responseText);
            var $dom = $(dom);
            var code = $dom.find("code");
            var diagnosis = $dom.find("diagnosis");
            if (code.length > 0 && diagnosis.length > 0) {
                this.error = { code: code.text(), message: diagnosis.text() };
                res = { response: dom, error: this.error };
            } else {
                this.error = null;
                res = { response: dom };
            }
            if (debug || this.debug) {
                res.responseText = req.responseText;
            }
        } else {
            this.error = { message: "通信エラー" };
            res = { error: this.error };
        }

        if (alertIfError && this.error) {
            alert(this.error.message);
        }

        return res;
    };

    this.queryItems = function (service, methodOfGetVersions, methodOfGetById, idName, itemName) {
        var params = {};
        params[idName] = new Array();

        // get item versions
        var res = _this.query(service, methodOfGetVersions, null, true);
        if (res.error) return null;

        // make item id list
        var i = 0;
        $(res.response).find(itemName).each(function () {
            var id = $(this).attr("id");
            if (id) {
                params[idName][i++] = { innerValue: id };
            }
        });

        // get item list
        res = _this.query(service, methodOfGetById, params, true);
        if (res.error) return null;

        return res;
    };

    // authentication
    if (username && password) {
        this.auth(username, password);
    }


    // private functions

    function makeParametersXml(name, child) {
        if (!child || !$.isPlainObject(child)) return "<" + name + " />";

        var xml = "<" + name;
        var attributesEnded = false;
        if (name == "parameters") {
            xml += ' xmlns=""';
        }
        for (var key in child) {
            var value = child[key];
            if (value == null) {
                // do noting

            } else if ($.isPlainObject(value)) {
                if (!attributesEnded) {
                    attributesEnded = true;
                    xml += ">";
                }
                xml += makeParametersXml(key, value);

            } else if ($.isArray(value)) {
                if (!attributesEnded) {
                    attributesEnded = true;
                    xml += ">";
                }
                for (var i = 0; i < value.length; i++) {
                    if (!$.isPlainObject(value[i])) continue;
                    xml += makeParametersXml(key, value[i]);
                }
            } else if (key == "innerValue") {
                // inner value
                if (!attributesEnded) {
                    attributesEnded = true;
                    xml += ">"
                }
                xml += $.cybozuConnect.htmlEscape(value);
                break;

            } else if (!attributesEnded) {
                // attribute
                var type = typeof value;
                if (type == "string") {
                    if (value.indexOf("\n") >= 0) {
                        xml += " " + key + '="' + $.cybozuConnect.xmlAttributeEscape(value) + '"';
                    } else {
                        xml += " " + key + '="' + $.cybozuConnect.htmlEscape(value) + '"';
                    }
                } else if (type == "number" || type == "boolean") {
                    xml += " " + key + '="' + value + '"';
                }

            } else {
                // attributes are ended
            }
        }
        if (!attributesEnded) xml += ">";
        xml += "</" + name + ">";
        return xml;
    }
};

/*
* cybozu-connect v1.1.1 - Cybozu API JavaScript Library
*
* CBLabs.CybozuConnect.Schedule class
*
* @requires jQuery v1.4.1 or later.
*
* Copyright (C) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

if (!CBLabs.CybozuConnect) { CBLabs.CybozuConnect = {}; }

CBLabs.CybozuConnect.SchedulePersonalProfile = function (res) {
    /// <summary>スケジュールの個人設定を表すクラス</summary>
    /// <param name="res" type="Object">APIからのレスポンス</param>
    /// <returns type="CBLabs.CybozuConnect.SchedulePersonalProfile" />

    var profile = $(res.response).find("personal_profile");
    var plan_menu;

    this.plan_menu = function () {
        /// <summary>予定メニュー</summary>
        /// <returns type="Array">予定メニュー項目の配列</returns>

        if (plan_menu) return plan_menu;

        var value = profile.attr("plan_menu");
        if (value) {
            plan_menu = value.split("\n");
            for (var i = plan_menu.length - 1; i >= 0; i--) {
                if (plan_menu[i]) break;
                plan_menu.pop();
            }
        } else {
            plan_menu = new Array();
        }

        return plan_menu;
    };
};

CBLabs.CybozuConnect.ScheduleSystemProfile = function (res) {
    /// <summary>スケジュールのシステム設定を表すクラス</summary>
    /// <param name="res" type="Object">APIからのレスポンス</param>
    /// <returns type="CBLabs.CybozuConnect.ScheduleSystemProfile" />

    var profile = $(res.response).find("system_profile");
    var plan_menu = null;
    var show_group_event = null;

    this.plan_menu = function () {
        /// <summary>予定メニュー</summary>
        /// <returns type="Array">予定メニュー項目の配列</returns>

        if (plan_menu != null) return plan_menu;

        var value = profile.attr("plan_menu");
        if (value) {
            plan_menu = value.split("\n");
            for (var i = plan_menu.length - 1; i >= 0; i--) {
                if (plan_menu[i]) break;
                plan_menu.pop();
            }
        } else {
            plan_menu = new Array();
        }

        return plan_menu;
    };

    this.show_group_event = function () {
        /// <summary>グループの予定を表示するか否か</summary>
        /// <returns type="Boolean" />

        if (show_group_event == null) {
            show_group_event = (profile.attr("show_group_event") != "false");
        }
        return show_group_event;
    }
};

CBLabs.CybozuConnect.Schedule = function (app) {
    /// <summary>Scheduleで提供されるAPIを実行するクラス</summary>
    /// <param name="app" type="CBLabs.CybozuConnect.App" />
    /// <returns type="CBLabs.CybozuConnect.Schedule" />
    /// <remarks>
    /// <b>予定を取得する期間の指定について</b>
    ///
    /// 例えば 2011-01-16 から 2011/01/22 までの予定を取得する場合、
    /// 開始日時として 2011-01-16 00:00:00 を指定し、
    /// 終了日時として 2011-01-23 00:00:00 を指定する。
    ///
    /// <b>予定情報の属性</b>
    /// <pre>
    /// var event = {
    ///     id: "1",                             // 予定ID
    ///     allDay: false,                       // 終日予定（バナー予定を含む）か否か
    ///     start: new Date(2011, 0, 28, 10, 0), // 開始日時
    ///     end: new Date(2011, 0, 28, 11, 0),   // 終了日時
    ///     event_type: "repeat",                // 予定の種類
    ///     public_type: "public",               // 公開方法（"public": 公開、"private": 非公開）
    ///     plan: "会議",                        // 予定メニュー
    ///     detail: "進捗",                      // 予定詳細
    ///     title: "会議:進捗",                  // 予定メニュー＋予定詳細
    ///     description: "要議事録",             // メモ
    ///     timezone: "Asia/Tokyo",              // タイムゾーン
    ///     start_only: false,                   // 開始時刻のみ設定されているか否か
    ///     users: [],                           // 参加するユーザーの配列（予定取得時）
    ///     organizations: [],                   // 参加する組織の配列（予定取得時）
    ///     facilities: [],                      // 参加する設備の配列（予定取得時）
    ///     userIdList: ["1", "2"],              // 参加するユーザーのIDの配列（予定追加・変更時）
    ///     orgIdList: ["1"],                    // 参加する組織のIDの配列（予定追加・変更時）
    ///     facilityIdList: ["5"],               // 参加する設備のIDの配列（予定追加・変更時）
    ///
    ///     repeatInfo: {                 // 繰り返し情報（繰り返し予定の場合）
    ///         type: "week",             // 繰り返しの種類
    ///         day: "28",                // type=="month" の場合の日指定
    ///         week: "5",                // type=="week"/"1stweek"/"2ndweek"/"3rdweek"/"4thweek"/"lastweek" の場合の曜日指定
    ///         start_date: "2011-01-28", // 繰り返し期間の開始日付（xsd:date）
    ///         end_date: "2011-02-28",   // 繰り返し期間の終了日付（xsd:date）
    ///         start_time: "10:00:00",   // 開始時刻（xsd:time）
    ///         end_time: "11:00:00"      // 終了時刻（xsd:time）
    ///     }
    /// };
    /// </pre>
    ///
    /// <b>予定の種類</b>
    ///
    ///   * "normal": 通常予定
    ///   * "banner": バナー（期間）予定
    ///   * "repeat": 繰り返し予定
    ///   * "temporary": 仮予定
    ///
    /// <b>繰り返しの種類</b>
    ///
    ///   * "day": 毎日
    ///   * "weekday": 平日
    ///   * "week": 毎週
    ///   * "1stweek": 毎月第１何曜日
    ///   * "2ndweek": 毎月第２何曜日
    ///   * "3rdweek": 毎月第３何曜日
    ///   * "4thweek": 毎月第４何曜日
    ///   * "lastweek": 毎月最終何曜日
    ///   * "month": 毎月何日
    ///
    /// <b>設備情報の属性</b>
    /// <pre>
    /// var facility = {
    ///     id: "5",                      // 設備ID
    ///     key: "5",                     // 設備ID
    ///     name: "会議室１",             // 設備名
    ///     description: "",              // メモ
    ///     belong_facility_group_id: "1" // 所属する設備グループ
    /// };
    /// </pre>
    /// <b>設備グループの属性</b>
    /// <pre>
    /// var facilityGroup = {
    ///     id: "1",                       // 設備グループID
    ///     key: "1",                      // 設備グループID
    ///     name: "会議室",                // 設備グループ名
    ///     facilityIdList: ["5"],         // 所属する設備のIDの配列
    ///     parent_facility_group_id: null // 親設備グループ
    /// };
    /// </pre>
    /// </remarks>

    // private variables
    var facilityArray, facilityHash, facilityGroupArray, facilityGroupHash;
    var personalProfile, systemProfile;

    // initialize
    app.Schedule = this; // set to parent property

    // get base
    var Base = app.Base || new CBLabs.CybozuConnect.Base(app);

    this.personalProfile = function () {
        /// <summary>スケジュールの個人設定を返す。</summary>
        /// <returns type="CBLabs.CybozuConnect.SchedulePersonalProfile" />

        if (!personalProfile) loadProfiles();
        return personalProfile;
    };

    this.systemProfile = function () {
        /// <summary>スケジュールのシステム設定を返す。</summary>
        /// <returns type="CBLabs.CybozuConnect.ScheduleSystemProfile" />

        if (!systemProfile) loadProfiles();
        return systemProfile;
    };

    function loadProfiles() {
        var res = app.query("Schedule", "ScheduleGetProfiles", { include_system_profile: true }, true);
        if (res.error) return;

        personalProfile = new CBLabs.CybozuConnect.SchedulePersonalProfile(res);
        systemProfile = new CBLabs.CybozuConnect.ScheduleSystemProfile(res);
    }

    this.getEventsByTarget = function (options, isUtc) {
        /// <summary>指定した対象の予定を返す。</summary>
        /// <param name="options.start" type="Date">取得する期間の開始日時</param>
        /// <param name="options.end" type="Date">取得する期間の終了日時</param>
        /// <param name="options.userId" type="String">ユーザーID</param>
        /// <param name="options.organizationId" type="String">組織ID</param>
        /// <param name="options.facilityId" type="String">設備ID</param>
        /// <returns type="Array">予定の配列</returns>
        /// <remarks>ユーザーID、組織ID、および設備IDのうち、いずれか１つだけ指定できる。</remarks>
        //

        if (!options.start || !options.end || (!options.userId && !options.organizationId && !options.facilityId)) return null;

        var params = {
            start: $.cybozuConnect.formatXSDDateTime(options.start, isUtc),
            end: $.cybozuConnect.formatXSDDateTime(options.end, isUtc)
        };


        if (options.userId) {
            params.user = { id: options.userId };
        } else if (options.organizationId) {
            params.organization = { id: options.organizationId };
        } else { // options.facilityId
            params.facility = { id: options.facilityId };
        }

        var res = app.query("Schedule", "ScheduleGetEventsByTarget", params, true);
        if (res.error) return null;

        return getEventsFromResponse(res.response, options.start, options.end);
    };


    this.getEvents = function (options, isUtc) {
        /// <summary>指定した複数の対象の予定を返す。</summary>
        /// <param name="options.start" type="Date">取得する期間の開始日時</param>
        /// <param name="options.end" type="Date">取得する期間の終了日時</param>
        /// <param name="options.userIdList" type="Array">（省略可）ユーザーIDの配列</param>
        /// <param name="options.organizationIdList" type="Array">（省略可）組織IDの配列</param>
        /// <param name="options.facilityIdList" type="Array">（省略可）設備IDの配列</param>
        /// <returns type="Array">予定の配列</returns>
        //

        if (!options.start || !options.end) return null;

        var userIdList = options.userIdList || new Array();
        var orgIdList = options.orgIdList || new Array();
        var facilityIdList = options.facilityIdList || new Array();
        if (userIdList.length + orgIdList.length + facilityIdList.length == 0) return null;

        var events = { organizations: {}, users: {}, facilities: {} };
        for (var i = 0; i < orgIdList.length; i++) {
            var id = orgIdList[i];
            events.organizations[id] = this.getEventsByTarget({ start: options.start, end: options.end, organizationId: id }, isUtc);
        }
        for (var i = 0; i < userIdList.length; i++) {
            var id = userIdList[i];
            events.users[id] = this.getEventsByTarget({ start: options.start, end: options.end, userId: id }, isUtc);
        }
        for (var i = 0; i < facilityIdList.length; i++) {
            var id = facilityIdList[i];
            events.facilities[id] = this.getEventsByTarget({ start: options.start, end: options.end, facilityId: id }, isUtc);
        }
        return events;
    };

    this.addEvent = function (event, visStart, visEnd) {
        /// <summary>予定を追加する。</summary>
        /// <param name="event" type="Object">追加する予定の情報</param>
        /// <param name="visStart" type="Date">（戻り値としての予定を）取得する期間の開始日時</param>
        /// <param name="visEnd" type="Date">（戻り値としての予定を）取得する期間の終了日時</param>
        /// <returns type="Array">追加された予定の配列</returns>

        if (event.userIdList) {
            if (event.userIdList.length + event.orgIdList.length + event.facilityIdList.length == 0) {
                alert("参加者がいません。");
                return null;
            }
        }

        var params = {
            schedule_event: {
                xmlns: "",
                id: "dummy",
                event_type: event.event_type,
                version: "dummy",
                public_type: "public",
                plan: event.plan,
                detail: event.detail,
                description: event.description,
                allday: String(event.allDay)
            }
        };

        // members
        params.schedule_event.members = prepareMembers(event);

        if (event.event_type == "repeat") {
            // repeat_info
            params.schedule_event.repeat_info = {
                condition: {
                    type: event.repeatInfo.type,
                    day: event.repeatInfo.day,
                    week: event.repeatInfo.week,
                    start_date: event.repeatInfo.start_date
                }
            };
            if (event.repeatInfo.end_date) {
                params.schedule_event.repeat_info.condition.end_date = event.repeatInfo.end_date;
            }
            if (!event.allDay) {
                params.schedule_event.repeat_info.condition.start_time = event.repeatInfo.start_time;
                if (event.repeatInfo.end_time) {
                    params.schedule_event.repeat_info.condition.end_time = event.repeatInfo.end_time;
                }
                // start_only
                params.schedule_event.start_only = (!event.repeatInfo.end_time);
            }
        } else {
            // start_only
            params.schedule_event.start_only = (!event.end);

            // when
            params.schedule_event.when = createWhen(event);
        }

        var res = app.exec("Schedule", "ScheduleAddEvents", params, true);
        if (res.error) return null;

        if (!visStart || !visEnd) {
            return $(res.response).find("schedule_evnet").length > 0;
        }

        return getEventsFromResponse(res.response, visStart, visEnd);
    };

    this.modifyEvent = function (event) {
        /// <summary>（繰り返し以外の）予定を変更する。</summary>
        /// <param name="event" type="Object">変更する予定の情報</param>
        /// <returns type="Boolean">true: 成功、false: 失敗</returns>

        if (event.event_type == "repeat") {
            alert("このメソッドでは、繰り返し予定は変更できません。");
            return false;
        }

        if (event.userIdList) {
            if (event.userIdList.length + event.orgIdList.length + event.facilityIdList.length == 0) {
                alert("参加者がいません。");
                return false;
            }
        }

        // members
        var members = prepareMembers(event);

        // when
        var when = createWhen(event);

        var params = {
            schedule_event: {
                xmlns: "",
                id: event.id,
                event_type: event.event_type,
                version: event.version,
                public_type: event.public_type,
                allday: event.allDay,
                start_only: (!event.end),
                plan: event.plan,
                detail: event.detail,
                description: event.description,
                members: members,
                when: when
            }
        };

        var res = app.exec("Schedule", "ScheduleModifyEvents", params, true);
        if (res.error) return false;

        return $(res.response).find("schedule_event").length > 0;
    };

    this.modifyRepeatEvent = function (event, modifyType, baseDate, modifyDate) {
        /// <summary>繰り返し予定を変更する。</summary>
        /// <param name="event" type="Object">変更する予定の情報</param>
        /// <param name="modifyType" type="String">変更する範囲（"this": baseDate で指定した日付のみ、"after": baseDate 以降について、"all": すべて）</param>
        /// <param name="baseDate" type="Date">変更する範囲の基準日付（modifyType の項を参照）</param>
        /// <param name="modifyDate" type="Date">modifyType=="this" のとき、変更先の日付。modifyType=="after" のとき、変更後予定の繰り返し期間の開始日付。</param>
        /// <returns type="Boolean">true: 成功、false: 失敗</returns>

        if (event.event_type != "repeat") {
            alert("このメソッドでは、繰り返し予定のみ変更できます。");
            return false;
        }

        if (modifyType == "this" && !$.cybozuConnect.equalDate(baseDate, modifyDate)) {
            if (event.allDay) {
                event.start = event.end = modifyDate;
            } else {
                var xsdModifyDate = $.cybozuConnect.formatXSDDate(modifyDate);
                event.start = $.cybozuConnect.parseXSDDateTime(xsdModifyDate + "T" + event.repeatInfo.start_time);
                if (event.repeatInfo.end_time) {
                    event.end = $.cybozuConnect.parseXSDDateTime(xsdModifyDate + "T" + event.repeatInfo.end_time);
                }
            }
            var eventId = event.id; // save
            event.event_type = "normal";
            var visStart = new Date(modifyDate);
            var visEnd = $.cybozuConnect.incDate(visStart);
            var events = this.addEvent(event, visStart, visEnd);
            if (!events || !events.length) return false;

            if (!this.removeEventFromRepeatEvent(eventId, "this", baseDate)) {
                this.removeEvent(events[0].id);
                return false;
            } else {
                return true;
            }
        } else if (modifyType == "after" && $.cybozuConnect.compareDate(baseDate, modifyDate) > 0) {
            var eventId = event.id; // save
            var visStart = new Date(modifyDate);
            var visEnd = $.cybozuConnect.incDate(visStart);
            var events = this.addEvent(event, visStart, visEnd);
            if (!events) return false;

            if (!this.removeEventFromRepeatEvent(eventId, "after", baseDate)) {
                if (events.length) {
                    this.removeEventFromRepeatEvent(events[0].id, "all", null);
                }
                return false;
            } else {
                return true;
            }
        } else if (modifyType == "after" && $.cybozuConnect.compareDate(baseDate, modifyDate) != 0) {
            event.repeatInfo.start_date = $.cybozuConnect.formatXSDDate(baseDate);
        }

        if (event.userIdList) {
            if (event.userIdList.length + event.orgIdList.length + event.facilityIdList.length == 0) {
                alert("参加者がいません。");
                return false;
            }
        }

        // members
        var members = prepareMembers(event);
        var operation = { type: modifyType };
        var schedule_event = {
            xmlns: "",
            id: event.id,
            event_type: event.event_type,
            version: event.version,
            public_type: event.public_type,
            allday: event.allDay,
            start_only: event.start_only,
            plan: event.plan,
            detail: event.detail,
            description: event.description,
            members: members
        };

        if (modifyType == "this" || modifyType == "after") {
            operation.date = $.cybozuConnect.formatXSDDate(baseDate);
        }

        schedule_event.repeat_info = {
            condition: {
                type: event.repeatInfo.type,
                day: event.repeatInfo.day,
                week: event.repeatInfo.week,
                start_date: event.repeatInfo.start_date
            }
        };

        if (event.repeatInfo.end_date) {
            schedule_event.repeat_info.condition.end_date = event.repeatInfo.end_date;
        }
        if (!event.allDay) {
            schedule_event.repeat_info.condition.start_time = event.repeatInfo.start_time;
            if (event.repeatInfo.end_time) {
                schedule_event.repeat_info.condition.end_time = event.repeatInfo.end_time;
            }
            // start_only
            schedule_event.start_only = (!event.repeatInfo.end_time);
        }

        operation.schedule_event = schedule_event;
        var params = { operation: operation };

        var res = app.exec("Schedule", "ScheduleModifyRepeatEvents", params, true);
        if (res.error) return false;

        return $(res.response).find("result").length > 0;
    };

    function prepareMembers(event) {
        var memberList = new Array();
        if (event.userIdList) {
            for (var i = 0; i < event.userIdList.length; i++) {
                memberList[memberList.length] = { user: { id: event.userIdList[i]} };
            }
            for (var i = 0; i < event.orgIdList.length; i++) {
                memberList[memberList.length] = { organization: { id: event.orgIdList[i]} };
            }
            for (var i = 0; i < event.facilityIdList.length; i++) {
                memberList[memberList.length] = { facility: { id: event.facilityIdList[i]} };
            }
        } else if (event.users) {
            for (var i = 0; i < event.users.length; i++) {
                var user = event.users[i];
                memberList[memberList.length] = { user: { id: user.id, order: user.order} };
            }
            for (var i = 0; i < event.organizations.length; i++) {
                var org = event.organizations[i];
                memberList[memberList.length] = { organization: { id: org.id, order: org.order} };
            }
            for (var i = 0; i < event.facilities.length; i++) {
                var facility = event.facilities[i];
                memberList[memberList.length] = { facility: { id: facility.id, order: facility.order} };
            }
        } else {
            // unexpected
        }
        return { member: memberList };
    }

    this.removeEvent = function (eventId) {
        /// <summary>（繰り返し以外の）予定を削除する。</summary>
        /// <param name="eventId" type="String">予定ID</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var res = app.exec("Schedule", "ScheduleRemoveEvents", { event_id: { innerValue: eventId} }, true);
        return res.error ? false : true;
    };

    this.removeEventFromRepeatEvent = function (eventId, type, date) {
        /// <summary>繰り返し予定を削除する。</summary>
        /// <param name="eventId" type="String">予定ID</param>
        /// <param name="type" type="String">削除する範囲（"this"/"after"/"all"）</param>
        /// <param name="date" type="Date">削除する範囲の基準日付</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var params = { operation: { event_id: eventId, type: type} };
        if (type == "this" || type == "after") {
            params.operation.date = $.cybozuConnect.formatXSDDate(date);
        }
        var res = app.exec("Schedule", "ScheduleRemoveEventsFromRepeatEvent", params, true);
        return res.error ? false : true;
    };

    this.leaveEvent = function (eventId) {
        /// <summary>（繰り返し以外の）予定から抜ける。</summary>
        /// <param name="eventId" type="String">予定ID</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var res = app.exec("Schedule", "ScheduleLeaveEvents", { event_id: { innerValue: eventId} }, true);
        return res.error ? false : true;
    };

    this.leaveEventFromRepeatEvent = function (eventId, type, date) {
        /// <summary>繰り返し予定から抜ける。</summary>
        /// <param name="eventId" type="String">予定ID</param>
        /// <param name="type" type="String">抜ける範囲（"this"/"after"/"all"）</param>
        /// <param name="date" type="Date">抜ける範囲の基準日付</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var params = { operation: { event_id: eventId, type: type} };
        if (type == "this" || type == "after") {
            params.operation.date = $.cybozuConnect.formatXSDDate(date);
        }
        var res = app.exec("Schedule", "ScheduleLeaveEventsFromRepeatEvent", params, true);
        return res.error ? false : true;
    };

    this.addFollow = function (event, followText) {
        /// <summary>フォローを予定に追加する。</summary>
        /// <param name="event" type="Object/String">フォローを追加する先の予定、または予定ID</param>
        /// <param name="followText" type="String">フォロー内容</param>
        /// <returns type="Object">フォローが追加された予定</returns>

        var event_id;
        if ($.isPlainObject(event)) {
            if (event.event_type == "repeat") {
                alert("このメソッドでは、繰り返し予定にフォローを追加できません。");
                return null;
            }
            event_id = event.id;
        } else {
            event_id = event;
        }

        var events = this.addFollows({ event_id: event_id, content: followText });
        if ($.isArray(events) && events.length) return events[0];

        return null;
    };

    this.addFollows = function (follows) {
        /// <summary>フォローを予定に追加する。</summary>
        /// <param name="follows" type="Object/Array">フォロー（の配列）</param>
        /// <param name="visStart" type="Date">（省略可）（戻り値としての予定を）取得する期間の開始日時</param>
        /// <param name="visEnd" type="Date">（省略可）（戻り値としての予定を）取得する期間の終了日時</param>
        /// <returns type="Array">フォローが追加された予定の配列</returns>

        var params = {};
        if (!$.isPlainObject(follows) && $.isArray(follows)) {
            throw "'follows' must be a plain object or a array.";
        }
        params.follow = follows;
        var res = app.exec("Schedule", "ScheduleAddFollows", params, true);
        if (res.error) return null;

        return getEventsFromResponse(res.response, null, null);
    };

    this.addFollowToRepeatEvent = function (event, date, followText) {
        /// <summary>フォローを繰り返し予定に追加する。</summary>
        /// <param name="event" type="Object/String">フォローを追加する先の予定、または予定ID</param>
        /// <param name="date" type="Date">フォローを追加する先の予定の日付</param>
        /// <param name="followText" type="String">フォロー内容</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var event_id;
        if ($.isPlainObject(event)) {
            if (event.event_type != "repeat") {
                alert("このメソッドでは、繰り返し予定以外にフォローを追加できません。");
                return null;
            }
            event_id = event.id;
        } else {
            event_id = event;
        }

        var events = this.addFollowsToRepeatEvent({ event_id: event_id, date: $.cybozuConnect.formatXSDDate(date), content: followText });
        if ($.isArray(events) && events.length) return events[0];

        return null;
    };

    this.addFollowsToRepeatEvent = function (follows) {
        /// <summary>フォローを繰り返し予定に追加する。</summary>
        /// <param name="follows" type="Object/Array">フォロー（の配列）</param>
        /// <param name="visStart" type="Date">（省略可）（戻り値としての予定を）取得する期間の開始日時</param>
        /// <param name="visEnd" type="Date">（省略可）（戻り値としての予定を）取得する期間の終了日時</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var params = {};
        if (!$.isPlainObject(follows) && $.isArray(follows)) {
            throw "'follows' must be a plain object or a array.";
        }
        params.follow = follows;
        var res = app.exec("Schedule", "ScheduleAddFollowsToRepeatEvent", params, true);
        if (res.error) return false;

        return getEventsFromResponse(res.response, null, null, "modified");
    };

    this.removeFollows = function (followIds) {
        /// <summary>フォローを削除する。</summary>
        /// <param name="followIds" type="String/Array">フォローID（の配列）</param>
        /// <return type="Boolean" />true: 成功、false: 失敗</returns>

        var params = {};
        if ($.isArray(followIds)) {
            params.follow_id = new Array();
            for (var i = 0 ; i < followIds.length ; i ++) {
                params.follow_id[params.follow_id.length] = { innerValue: followIds[i] };
            }
        } else {
            params.follow_id = { innerValue: followIds };
        }

        var res = app.exec("Schedule", "ScheduleRemoveFollows", params, true);
        return res.error ? false : true;
    };

    this.inMembers = function (userId, event) {
        /// <summary>指定したユーザーが予定の参加者に含まれるか否か</summary>
        /// <param name="userId" type="String">ユーザーID</param>
        /// <param name="event" type="Object">予定</param>
        /// <returns type="Boolean" />

        for (var i = 0; i < event.users.length; i++) {
            var user = event.users[i];
            if (user.id == userId) return true;
        }
        return false;
    };

    var hierarchical = null;

    this.isHierarchical = function () {
        /// <summary>設備グループが階層的か否か</summary>
        /// <returns type="Boolean" />

        if (hierarchical == null) {
            this.facilityGroupList();
        }

        return hierarchical;
    };

    this.facilityList = function () {
        /// <summary>全設備を取得する。</summary>
        /// <returns type="Array">設備の配列</returns>

        if (facilityArray) return facilityArray;

        var res = app.queryItems("Schedule", "ScheduleGetFacilityVersions", "ScheduleGetFacilitiesById", "facility_id", "facility_item");
        if (!res) return null;

        facilityArray = new Array();
        facilityHash = new Object();

        $(res.response).find("facility").each(function () {
            $this = $(this);
            var id = $this.attr("key");
            if (!id) return;

            facilityHash[id] = {
                id: id,
                key: id,
                version: $this.attr("version"),
                order: $this.attr("order"),
                name: $this.attr("name"),
                description: $this.attr("description"),
                belong_facility_group_id: $this.attr("belong_facility_group")
            };
        });

        for (var key in facilityHash) {
            facilityArray[facilityArray.length] = facilityHash[key];
        }

        return facilityArray;
    };

    this.facility = function (facilityId) {
        /// <summary>指定した設備の情報を取得する</summary>
        /// <param name="facilityId" type="String">設備ID</param>
        /// <returns type="Object">設備情報</returns>

        if (!facilityId) return null;

        if (!facilityHash) {
            this.facilityList();
        }

        return facilityHash[facilityId];
    };

    this.facilitySearch = function (text) {
        /// <summary>設備を検索する</summary>
        /// <param name="text" type="String">検索文字列</param>
        /// <returns type="Array">ヒットした設備情報の配列</returns>

        this.facilityList();

        var facilityResult = new Array();
        for (var i = 0; i < facilityArray.length; i++) {
            var facility = facilityArray[i];
            if (facility.name && facility.name.indexOf(text) >= 0) {
                facilityResult[facilityResult.length] = facility;
            } else if (facility.description && facility.description.indexOf(text) >= 0) {
                facilityResult[faciuserResult.length] = facility;
            }
        }

        return facilityResult;
    };

    this.facilityGroupList = function () {
        /// <summary>トップレベルの設備グループを返す</summary>
        /// <returns type="Array">設備グループ情報の配列</returns>

        if (facilityGroupArray) return facilityGroupArray;

        var res = app.queryItems("Schedule", "ScheduleGetFacilityGroupsVersions", "ScheduleGetFacilityGroupsById", "facility_group_id", "facility_group_item");
        if (!res) return null;

        facilityGroupArray = new Array();
        facilityGroupHash = new Object();

        $(res.response).find("facility_group[name]").each(function () {
            $this = $(this);
            var groupId = $this.attr("id");
            if (!groupId) return;

            var facilityGroup = {
                id: groupId,
                key: groupId,
                version: $this.attr("version"),
                order: $this.attr("order"),
                name: $this.attr("name"),
                facilityIdList: []
            };

            // child facility group ids
            var childGroup = $this.children("facility_group");
            if (childGroup.length) {
                facilityGroup.facilityGroupIdList = new Array();
                var j = 0;
                childGroup.each(function () {
                    facilityGroup.facilityGroupIdList[j++] = $(this).attr("id");
                });
                hierarchical = true;
            }

            // member facility ids
            var j = 0;
            $this.find("facility").each(function () {
                var id = $(this).attr("id");
                if (id) {
                    facilityGroup.facilityIdList[j++] = id;
                }
            });

            // parent facility group id
            var parent_facility_group_id = $this.attr("parent_facility_group");
            if (parent_facility_group_id) {
                facilityGroup.parent_facility_group_id = parent_facility_group_id;
                hierarchical = true;
            } else {
                facilityGroupArray[facilityGroupArray.length] = facilityGroup;
            }

            facilityGroupHash[groupId] = facilityGroup;
        });

        return facilityGroupArray;
    };

    this.facilityGroup = function (groupId) {
        /// <summary>指定した設備グループの情報を返す。</summary>
        /// <param name="groupId" type="String">設備グループID</param>
        /// <returns type="Object">設備グループ情報</returns>

        if (!groupId) return null;

        if (!facilityGroupHash) {
            this.facilityGroupList();
        }

        return facilityGroupHash[groupId];
    };

    // private functions

    function getEventsFromResponse(response, visStart, visEnd, elementName) {
        var events = new Array();
        var name = elementName ? elementName : "schedule_event";
        $(response).find(name).each(function () {
            var event = createEventFromResponse($(this), visStart, visEnd);
            if (!event) {
                // nothing
            } else if ($.isArray(event)) {
                for (var i = 0; i < event.length; i++) {
                    events[events.length] = event[i];
                }
            } else {
                events[events.length] = event;
            }
        });

        return events;
    }

    function createWhen(event) {
        if (event.allDay) {
            var date = { start: $.cybozuConnect.formatXSDDate(event.start) };
            if (event.end) {
                date.end = $.cybozuConnect.formatXSDDate(event.end);
            }
            return { date: date };

        } else {
            var datetime = { start: $.cybozuConnect.formatISO8601(event.start, true) }; // not xsd:datetime
            if (event.end) {
                datetime.end = $.cybozuConnect.formatISO8601(event.end, true); // not xsd:datetime
            }
            return { datetime: datetime };
        }
    }

    function createEventFromResponse($event, start, end) {
        var when = $event.find("when");
        if (!when.length && start && end) {
            if ($event.attr("event_type") == "repeat") {
                var $repeat_info = $event.find("repeat_info");
                if ($repeat_info.length) {
                    return createRepeatedEventsFromReponse($event, $repeat_info, start, end);
                }
            }
            return null;
        }

        var e = createSingleEventFromResponse($event);
        if (e.allDay) {
            var date = when.find("date");
            e.start = date.attr("start");
            if (!e.start_only) {
                e.end = date.attr("end");
            }
        } else {
            var datetime = when.find("datetime");
            e.start = $.cybozuConnect.parseISO8601(datetime.attr("start"), true);
            if (!e.start_only) {
                e.end = $.cybozuConnect.parseISO8601(datetime.attr("end"), true);
            }
        }

        return e;
    }

    function createRepeatedEventsFromReponse($event, $repeat_info, start, end) {
        var cond = $repeat_info.find("condition");
        var repeatInfo = {
            type: cond.attr("type"),
            day: parseInt(cond.attr("day"), 10),
            week: parseInt(cond.attr("week"), 10),
            start_date: cond.attr("start_date"),
            end_date: cond.attr("end_date")
        };

        var dates = getRepeatDates($repeat_info, repeatInfo, start, end);
        if (!dates.length) return null;

        var events = new Array();
        for (var i = 0; i < dates.length; i++) {
            var date = dates[i];
            var xsdDate = $.cybozuConnect.formatXSDDate(date);

            var e = createSingleEventFromResponse($event);
            if (e.allDay) {
                e.start = xsdDate;
                if (!e.start_only) {
                    e.end = xsdDate;
                }
            } else {
                /*if (!repeatInfo.start_time) {
                var cond = $repeat_info.find("condition");
                repeatInfo.start_time = cond.attr("start_time");
                if (!e.start_only) {
                repeatInfo.end_time = cond.attr("end_time");
                }
                }*/
                e.start = $.cybozuConnect.parseXSDDateTime(xsdDate + "T" + e.repeatInfo.start_time);
                if (!e.start_only && e.repeatInfo.end_time) {
                    e.end = $.cybozuConnect.parseXSDDateTime(xsdDate + "T" + e.repeatInfo.end_time);
                }
                //e.repeatInfo = repeatInfo;
            }

            events[events.length] = e;
        }

        return events;
    }

    function createSingleEventFromResponse($event) {
        var event_type = $event.attr("event_type");
        var plan = $event.attr("plan");
        var detail = $event.attr("detail");
        var start_only = ($event.attr("start_only") == "true");

        var e = new Object;

        // standard properties
        e.id = $event.attr("id");
        if (plan && detail) {
            e.title = plan + ":" + detail;
        } else if (plan) {
            e.title = plan;
        } else if (detail) {
            e.title = detail;
        } else {
            e.title = "--";
        }
        e.allDay = ($event.attr("allday") == "true" || event_type == "banner");

        // class
        if (event_type == "repeat") {
            e.className = "event-repeat";
        } else if (event_type == "banner") {
            e.className = "event-banner";
        } else if (e.allDay) {
            e.className = "event-allday";
        }

        // non-standard properties
        e.event_type = event_type;
        e.version = $event.attr("version");
        e.public_type = $event.attr("public_type");
        e.plan = plan;
        e.detail = detail;
        e.description = $event.attr("description");
        e.timezone = $event.attr("timezone");
        e.start_only = start_only;

        // repeat information
        if (event_type == "repeat") {
            var cond = $event.find("condition");
            if (cond.length) {
                e.repeatInfo = {
                    type: cond.attr("type"),
                    day: cond.attr("day"),
                    week: cond.attr("week"),
                    start_date: cond.attr("start_date"),
                    end_date: cond.attr("end_date"),
                    start_time: cond.attr("start_time"),
                    end_time: cond.attr("end_time")
                };
            }
        }

        // users
        e.users = new Array();
        $event.find("user").each(function () {
            $this = $(this);
            e.users[e.users.length] = { id: $this.attr("id"), name: $this.attr("name"), order: $this.attr("order") };
        });

        // organizations
        e.organizations = new Array();
        $event.find("organization").each(function () {
            $this = $(this);
            e.organizations[e.organizations.length] = { id: $this.attr("id"), name: $this.attr("name"), order: $this.attr("order") };
        });

        // facilities
        e.facilities = new Array();
        $event.find("facility").each(function () {
            $this = $(this);
            e.facilities[e.facilities.length] = { id: $this.attr("id"), name: $this.attr("name"), order: $this.attr("order") };
        });

        if ($event.find("follows").length) {
            e.follows = $event.find("follow");
        }

        return e;
    }

    function getRepeatDates($repeat_info, repeatInfo, start, end) {
        var type = repeatInfo.type;
        var day = repeatInfo.day;
        var week = repeatInfo.week;
        var startDate = $.cybozuConnect.parseXSDDate(repeatInfo.start_date);
        var endDate = $.cybozuConnect.parseXSDDate(repeatInfo.end_date);

        if (startDate.getTime() < start.getTime()) {
            startDate = start;
        }

        if (!endDate || (end.getTime() - 24 * 60 * 60 * 1000) < endDate.getTime()) {
            endDate = new Date();
            endDate.setTime(end.getTime() - 24 * 60 * 60 * 1000);
        }

        var exclusiveDates = new Array();
        $repeat_info.find("exclusive_datetime").each(function () {
            var datetime = $.cybozuConnect.parseXSDDateTime($(this).attr("start"));
            if (datetime) {
                exclusiveDates[exclusiveDates.length] = datetime;
            }
        });

        var dates = new Array();

        var date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        var lastDay;
        if (type == "lastweek" || (type == "month" && day == 0)) {
            var lastDate = $.cybozuConnect.getLastDate(date);
            lastDay = lastDate.getDate();
        }
        while (date.getTime() <= endDate.getTime()) {
            var wday = date.getDay();
            var mday = date.getDate();

            var hit = false;
            if (type == "day") {
                hit = true;
            } else if (type == "weekday") {
                hit = (wday != 0 && wday != 6);
            } else if (type == "week") {
                hit = (wday == week);
            } else if (type == "1stweek") {
                hit = (wday == week && mday <= 7);
            } else if (type == "2nweek") {
                hit = (wday == week && 7 < mday && mday <= 14);
            } else if (type == "3rdweek") {
                hit = (wday == week && 14 < mday && mday <= 21);
            } else if (type == "4thweek") {
                hit = (wday == week && 21 < mday && mday <= 28);
            } else if (type == "lastweek") {
                hit = (wday == week && lastDay - 7 < mday && mday <= lastDay);
            } else if (type == "month") {
                if (day == 0) {
                    hit = (mday == lastDay);
                } else {
                    hit = (mday == day);
                }
            }

            if (hit && !inDateArray(date, exclusiveDates)) {
                dates[dates.length] = date;
            }
            date = $.cybozuConnect.incDate(date);
        }

        return dates;
    }

    function inDateArray(date, dateArray) {
        for (var i = 0; i < dateArray.length; i++) {
            if (date.getTime() == dateArray[i].getTime()) return true;
        }
        return false;
    }
};

function setupUtility($) {
  /*
   * cybozu-connect v1.1.1 - Cybozu API JavaScript Library
   *
   * utility functions as jquery plugins
   *
   * @requires jQuery v1.4.1 or later.
   *
   * Copyright (c) 2011 Cybozu Labs, Inc.
   * http://labs.cybozu.co.jp/
   *
   * Licensed under the GPL Version 2 license.
  */

  $.cybozuConnect = {
      /// <summary>ユーティリティ関数</summary>

      /*
      xmlDom: function (text) {
          /// <summary>XMLからDOMを構築する。</summary>
          /// <param name="text" type="String">XML</param>
          /// <returns type="Object">DOM。構築できなかった場合 null を返す。</returns>

          if (window.ActiveXObject) {
              var dom = new ActiveXObject("Microsoft.XMLDOM");
              dom.loadXML(text);
              return dom;
          } else if (window.DOMParser) {
              var dom = new DOMParser().parseFromString(text, "application/xml");
              if (dom.documentElement.tagName != "parsererror") return dom;
              text = text.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, "");
              return new DOMParser().parseFromString(text, "application/xml");
          } else {
              return null;
          }
      },
      */

      htmlEscape: function (text) {
          /// <summary>HTMLエスケープを行う。</summary>
          /// <param name="text" type="String">エスケープする文字列</param>
          /// <returns type="String">エスケープされた文字列</returns>

          return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      },

      xmlEscape: function (text) {
          /// <summary>XMLエスケープを行う。</summary>
          /// <param name="text" type="String">エスケープする文字列</param>
          /// <returns type="String">エスケープされた文字列</returns>

          return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      },

      xmlAttributeEscape: function (text) {
          /// <summary>XMLの属性値としてのエスケープを行う。</summary>
          /// <param name="text" type="String">エスケープする文字列</param>
          /// <returns type="String">エスケープされた文字列</returns>

          return $.cybozuConnect.htmlEscape(text).replace(/\r/g, "&#xD;").replace(/\n/g, "&#xA;");
      },

      nn: function (num) {
          /// <summary>２桁の整数に対し、０パディングした文字列を返す。</summary>
          /// <param name="num" type="Number">２桁の整数</param>
          /// <returns type="String">０パディングされた文字列</returns>

          return _nn(num);
      },

      formatXSDDate: function (value) {
          /// <summary>日付をxsd:date形式でフォーマットする。</summary>
          /// <param name="value" type="Date">日付</param>
          /// <returns type="String">フォーマットされた文字列</returns>

          var d;
          if (value instanceof Date) {
              d = value;
          } else if (typeof value == "number") {
              d = new Date();
              d.setTime(value);
          } else {
              d = new Date(value);
          }

          var year = d.getFullYear();
          var month = d.getMonth() + 1;
          var day = d.getDate();
          return year + "-" + _nn(month) + "-" + _nn(day);
      },

      formatXSDDateTime: function (value, utc) {
          /// <summary>日時をxsd:datetime形式でフォーマットする。</summary>
          /// <param name="value" type="Date, Number">日時。型がNumberの場合はタイムスタンプ値</param>
          /// <param name="utc" type="Boolean">UTCとして扱うか否か</param>
          /// <returns type="String">フォーマットされた文字列</returns>

          var d;
          if (value instanceof Date) {
              d = value;
          } else if (typeof value == "number") {
              d = new Date();
              d.setTime(value);
          } else {
              d = new Date(value);
          }

          var year, month, day, hours, minutes, seconds;
          if (utc) {
              year = d.getUTCFullYear();
              month = d.getUTCMonth() + 1;
              day = d.getUTCDate();
              hours = d.getUTCHours();
              minutes = d.getUTCMinutes();
              seconds = d.getUTCSeconds();
          } else {
              year = d.getFullYear();
              month = d.getMonth() + 1;
              day = d.getDate();
              hours = d.getHours();
              minutes = d.getMinutes();
              seconds = d.getSeconds();
          }
          return year + "-" + _nn(month) + "-" + _nn(day) + "T" + _nn(hours) + ":" + _nn(minutes) + ":" + _nn(seconds);
      },

      formatXSDTime: function (date) {
          /// <summary>時刻をxsd:time形式でフォーマットする。</summary>
          /// <param name="value" type="Date">時刻</param>
          /// <returns type="String">フォーマットされた文字列</returns>

          return _nn(date.getHours()) + ":" + _nn(date.getMinutes()) + ":" + _nn(date.getSeconds());
      },

      formatISO8601: function (value, utc) {
          /// <summary>日時をISO8601形式でフォーマットする。</summary>
          /// <param name="value" type="Date, Number">日時。型がNumberの場合はタイムスタンプ値</param>
          /// <param name="utc" type="Boolean">UTCとして扱うか否か</param>
          /// <returns type="String">フォーマットされた文字列</returns>

          return $.cybozuConnect.formatXSDDateTime(value, utc) + "Z";
      },

      parseISO8601: function (text, utc) {
          /// <summary>ISO8601形式の文字列をパースして、Date型を返す。</summary>
          /// <param name="text" type="String">>ISO8601形式の文字列</param>
          /// <param name="utc" type="Boolean">UTCとして扱うか否か</param>
          /// <returns type="Date">パースされた日時</returns>

          if (text.length < 20) {
              return new Date();
          }
          var year = text.substr(0, 4);
          var month = text.substr(5, 2) - 1;
          var day = text.substr(8, 2);
          var hours = text.substr(11, 2);
          var minutes = text.substr(14, 2);
          var seconds = text.substr(17, 2);
          if (utc) {
              var t = Date.UTC(year, month, day, hours, minutes, seconds);
              var d = new Date();
              d.setTime(t);
              return d;
          } else {
              return new Date(year, month, day, hours, minutes, seconds);
          }
      },

      parseXSDDate: function (text) {
          /// <summary>xsd:date形式の文字列をパースして、Date型を返す。</summary>
          /// <param name="text" type="String">xsd:date形式の文字列</param>
          /// <returns type="Date">パースされた日付</returns>

          if (!text) return null;
          var vals = text.split("-");
          if (vals.length < 3) return null;
          return new Date(parseInt(vals[0], 10), parseInt(vals[1], 10) - 1, parseInt(vals[2], 10));
      },

      parseXSDDateTime: function (text) {
          /// <summary>xsd:datetime形式の文字列をパースして、Date型を返す。</summary>
          /// <param name="text" type="String">xsd:datetime形式の文字列</param>
          /// <returns type="Date">パースされた日時</returns>

          if (!text) return null;
          var vals = text.split("T");
          if (vals.length < 2) return null;
          var date = $.cybozuConnect.parseXSDDate(vals[0]);
          if (!date) return null;
          vals = vals[1].split("+");
          vals = vals[0].split(":");
          if (vals.length < 3) return null;
          return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(vals[0], 10), parseInt(vals[1], 10), parseInt(vals[2], 10));
      },

      incDate: function (date, dayDelta) {
          /// <summary>日付を指定分進める。</summary>
          /// <param name="date" type="Date">基準となる日付</param>
          /// <param name="dayDelta" type="Number">進める日数。マイナスの場合は戻す。</param>
          /// <returns type="Date">進められた日付</returns>

          if (dayDelta == 0) return new Date(date);
          var d = new Date();
          if (!dayDelta) dayDelta = 1;
          d.setTime(date.getTime() + dayDelta * 24 * 60 * 60 * 1000);
          return d;
      },

      getLastDate: function (date) {
          /// <summary>指定した日付の月末の日付を返す。</summary>
          /// <param name="date" type="Date">日付</param>
          /// <returns type="Date">月末の日付</returns>

          var nextMonth;
          if (date.getMonth() < 11) {
              nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
          } else {
              nextMonth = new Date(date.getFullYear() + 1, 0, 1);
          }
          var lastDate = new Date();
          lastDate.setTime(nextMonth.getTime() - 24 * 60 * 60 * 1000);
          return lastDate;
      },

      getLastDay: function (year, month) {
          /// <summary>指定した年/月の月末の日付の日番号を返す。</summary>
          /// <param name="year" type="Number">年</param>
          /// <param name="month" type="Number">月</param>
          /// <returns type="Number">月末の日番号(1～31)</returns>

          return $.cybozuConnect.getLastDate(new Date(year, month, 1)).getDate();
      },

      equalDate: function (date1, date2) {
          /// <summary>２つの日付が同日かどうかを返す。</summary>
          /// <param name="date1" type="Date">日付１</param>
          /// <param name="date2" type="Date">日付２</param>
          /// <returns type="Boolean" />

          return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate();
      },

      compareDate: function (date1, date2) {
          /// <summary>２つの日付を比較する。</summary>
          /// <param name="date1" type="Date">日付１</param>
          /// <param name="date2" type="Date">日付２</param>
          /// <returns type="Number">0: 等しい、<0: 日付１が日付２よりも先、>0: 日付１が日付２よりも後</returns>

          var diffYear = date1.getFullYear() - date2.getFullYear();
          if (diffYear) return diffYear;
          var diffMonth = date1.getMonth() - date2.getMonth();
          if (diffMonth) return diffMonth;
          var diffDay = date1.getDate() - date2.getDate();
          if (diffDay) return diffDay;
          return 0;
      }
  };

  // private function
  function _nn(num) {
      return ((num < 10) ? "0" : "") + num;
  };
}

