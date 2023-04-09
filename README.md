# sample-skyway-react

Reactで開発したビデオ会議のサンプルプログラムです。仮想背景にも対応しています。

## 環境構築

以下のソフトウェアが必要です。

* nodejs
* yarn

## 起動方法

srcディレクトリに`keys.tsx`という名前のファイルを作成し，以下の内容を書き込んでください。
```
export const skyWayKey = "YOUR_API_KEY";
export const skyWayRoomId = "YOUR_ROOM_ID"; // 同じskyWayKeyとskyWayRoomIdを使用しているアプリケーションが接続されます。
```
次に以下のコマンドを実行すると，アプリケーションが起動します。
```
yarn install
yarn start
```
