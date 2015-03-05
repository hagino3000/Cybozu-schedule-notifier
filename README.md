# サイボウズガルーンスケジュール通知 for Mac

サイボウズガルーンのスケジュールをMacOSXの通知センターに通知します

## Requirements

- MacOSX > 10.9
- Node.js > 0.10.0

## Setup

```
# Install node modules
$ make setup

# Create settings
$ cp settings.sample.js settings.js

# Edit settings
$ vim settings.js
```

## ログインパスワードについて

ガルーンのログインパスワードはKeychainから取得します、`settings.js` に指定したキーでKeychainに保存してください。

## Acknowledgements

- [Cybozu API JavaScript Library](https://code.google.com/p/cybozu-connect/)
- [Crystal Project Icons](http://www.softicons.com/system-icons/crystal-project-icons-by-everaldo-coelho)
