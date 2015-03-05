# サイボウズガルーンスケジュール通知 for Mac

サイボウズガルーンのスケジュールをMacOSXの通知センターに通知します

## Requirement

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
