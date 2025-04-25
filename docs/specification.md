# スタックチャンWeb版 機能仕様書

## 1. 顔描画・アニメーション

- スタックチャンの顔をHTML5 Canvasで描画する。
  - 解像度は320×240pxを基準とする。
- Audio APIと連携し、音声再生時にリップシンク（口パク）を行う。
- 瞬き、サッケード（視線の素早い動き）、呼吸による体の動きをアニメーションで再現する。
- 目線や表情（喜怒哀楽など）の変化をプログラムから制御できる。

## 2a. OpenAI Agent SDKのTypeScript移植

- 音声認識→応答生成→音声合成の一連の流れをTypeScriptで実装する。
  - 音声認識：Web Speech APIや外部APIを利用。
  - 応答生成：OpenAI Agent SDKの一部をTypeScriptで移植し、Stack-chan MCP仕様にも対応。
  - 音声合成：Web Speech APIや外部TTSサービスを利用。
- MCP（Model Context Protocol）仕様に準拠したAPI設計。

## 2b. OpenAI RealtimeAPI（WebRTC版）によるリアルタイム会話

- OpenAIのRealtimeAPI（WebRTC）を利用し、リアルタイムで音声会話ができる。
- 音声ストリームをリアルタイムで認識・応答・合成し、インタラクティブな会話体験を実現。

## 3. スタックチャン基板（ESP32）とのBluetooth連携

- Web Bluetooth APIを用いて、ESP32搭載基板と接続する。
- Bluetoothシリアル通信でサーボモーターの制御情報をリアルタイムに送受信する。
  - サーボの角度・速度・トルクON/OFFなどを制御。
- サーボの力制御（トルク制御）に対応し、物理的な動きとWeb上のアニメーションを同期させる。
