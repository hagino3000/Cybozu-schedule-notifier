# サイボウズガルーン3スケジュール通知 for Mac

サイボウズガルーン3のスケジュールをMacOSXの通知センターに通知します。

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

## Launch

```
# Test
$ make login_test

# Schedule Run
$ make timer
```

Keychainを使っているので、cronのセッションからは動きません。

## Acknowledgements

- [Cybozu API JavaScript Library](https://code.google.com/p/cybozu-connect/)
- [Crystal Project Icons](http://www.softicons.com/system-icons/crystal-project-icons-by-everaldo-coelho)

## License

The MIT License

Copyright (c) 2012 hagino3000 (http://twitter.com/hagino3000)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
