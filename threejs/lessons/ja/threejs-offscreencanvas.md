Title: Three.jsのOffscreenCanvas
Description: three.jsでweb workerを使う方法
TOC: Web WorkerでOffscreenCanvasを使用する

[`OffscreenCanvas`](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)は新しいブラウザの機能で現在はChromeでしか利用できませんが、他のブラウザでも利用できるようになるようです。

`OffscreenCanvas` でweb workerがキャンバスにレンダリングできます。
これは複雑な3Dシーンのレンダリングなどの重い作業をWeb workerにオフロードし、ブラウザのレスポンスを低下させないようにする方法です。
また、データが読み込まれworkerで解析されてるのでページ読み込み中にページ表示の途切れは少ないでしょう。

OffscreenCanvasの使用を*開始*するのは非常に簡単です。
[レスポンシブデザインの記事](threejs-responsive.html)からキューブを3回転させるようにしてみましょう。

通常はWorkersのコードを別ファイルに分離しますが、このサイトのほとんどのサンプルコードではスクリプトをHTMLファイルに埋め込んでいます。

ここでは `offscreencanvas-cubes.js` というファイルを作成し、[レスポンシブデザインの例](threejs-responsive.html)から全てのJavaScriptをコピーして下さい。
そして、ワーカーで実行するために必要な変更を行います。

HTMLファイルにはまだJavaScriptが必要です。

まず最初に行う必要があるのはキャンバスを検索し、そのキャンバスのコントロールで `canvas.transferControlToOffscreen` 呼び出しオフスクリーンに転送する事です。

```js
function main() {
  const canvas = document.querySelector('#c');
  const offscreen = canvas.transferControlToOffscreen();

  ...
```

`new Worker(pathToScript, {type: 'module'})`でworkerを起動します。
そしてworkerを起動し、`offscreen` オブジェクトを渡します。

```js
function main() {
  const canvas = document.querySelector('#c');
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('offscreencanvas-cubes.js', {type: 'module'});
  worker.postMessage({type: 'main', canvas: offscreen}, [offscreen]);
}
main();
```

ここで重要なのはworkerが `DOM` にアクセスできない事です。
HTML要素を見る事もマウスイベントやキーボードイベントを受け取ることもできません。
workerができる事は、workerに送られたメッセージに返信してWebページにメッセージを送り返す事だけです。

workerにメッセージを送信するには [`worker.postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage)を呼び出し、1つまたは2つの引数を渡します。
1つ目の引数は [クローン](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)されるJavaScriptオブジェクトです。そして、workerに送られてきます。
2番目の引数はworkerに *転送* したい最初のオブジェクトのオプション配列です。
このオブジェクトはクローンされません。
その代わりに *転送* され、メインページには存在しなくなります。
存在しなくなるというのはおそらく間違った説明であり、むしろ彼らは去勢されています。
クローンではなく、特定のタイプのオブジェクトのみを転送する事ができます。
このオブジェクトには `OffscreenCanvas` が含まれているので、1度転送した `offscreen` オブジェクトをメインページに戻しても意味がありません。
上記のコードではworkerに渡すオブジェクトに `type: 'main'` を宣言しています。

Workersは `onmessage` ハンドラからメッセージを受け取ります。
`postMessage` に渡したオブジェクトはWorkerの `onmessage` ハンドラに渡された `event.data` を更新します。
このオブジェクトはブラウザには何の意味もありません。完全に自分達で使うためのものです。
あとは必要に応じて関数を追加し、メインページから簡単に呼び出す事ができます。

```js
const handlers = {
  main,
};

self.onmessage = function(e) {
  const fn = handlers[e.data.type];
  if (!fn) {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};
```

上記で見たように `type` に基づいてハンドラを検索し、メインページから送られてきた `data` を渡すだけです。
あとは `offscreencanvas-cubes.js` に貼り付けた `main` を [レスポンシブデザインの記事](threejs-responsive.html) から変更するだけです。

DOMからキャンバスを探すのではなく、イベントデータからキャンバスを受け取ります。

```js
-function main() {
-  const canvas = document.querySelector('#c');
+function main(data) {
+  const {canvas} = data;
  const renderer = new THREE.WebGLRenderer({canvas});

  ...

```

workerがDOMを見る事ができないのを覚えておくと、
最初の問題は `resizeRendererToDisplaySize` が `canvas.clientWidth` と `canvas.clientHeight` を見れない事です。
 元のコードは以下の通りです。

```js
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
```

その代わりにサイズを変更した値をworkerに送る必要があります。
そこでグローバルな状態を追加し、幅と高さを維持するようにしましょう。

```js
const state = {
  width: 300,  // canvas default
  height: 150,  // canvas default
};
```

これらの値を更新するための `'size'` ハンドラを追加してみましょう。

```js
+function size(data) {
+  state.width = data.width;
+  state.height = data.height;
+}

const handlers = {
  main,
+  size,
};
```

これで `resizeRendererToDisplaySize` を変更し、 `state.width` と `state.height` を使用するようになりました。

```js
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
-  const width = canvas.clientWidth;
-  const height = canvas.clientHeight;
+  const width = state.width;
+  const height = state.height;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
```

同様の変更が必要です。

```js
function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
-    camera.aspect = canvas.clientWidth / canvas.clientHeight;
+    camera.aspect = state.width / state.height;
    camera.updateProjectionMatrix();
  }

  ...
```

メインページに戻り、ページのリサイズの度に `size` イベントを送信します。

```js
const worker = new Worker('offscreencanvas-picking.js', {type: 'module'});
worker.postMessage({type: 'main', canvas: offscreen}, [offscreen]);

+function sendSize() {
+  worker.postMessage({
+    type: 'size',
+    width: canvas.clientWidth,
+    height: canvas.clientHeight,
+  });
+}
+
+window.addEventListener('resize', sendSize);
+sendSize();
```

初期サイズを送るために1度呼んでいます。

ブラウザが `OffscreenCanvas` を完全にサポートしていると仮定して、これらの変更を行うだけで動作するはずです。
実行する前にブラウザが `OffscreenCanvas` を実際にサポートしているかどうかを確認し、サポートしていない場合はエラーを表示してみましょう。
まずはエラーを表示するためのHTMLを追加してみましょう。

```html
<body>
  <canvas id="c"></canvas>
+  <div id="noOffscreenCanvas" style="display:none;">
+    <div>no OffscreenCanvas support</div>
+  </div>
</body>
```

そして、いくつかのCSSを追加します。

```css
#noOffscreenCanvas {
    display: flex;
    width: 100vw;
    height: 100vh;
    align-items: center;
    justify-content: center;
    background: red;
    color: white;
}
```

ブラウザが `OffscreenCanvas` をサポートしているか確認するためには `transferControlToOffscreen` を呼びます。

```js
function main() {
  const canvas = document.querySelector('#c');
+  if (!canvas.transferControlToOffscreen) {
+    canvas.style.display = 'none';
+    document.querySelector('#noOffscreenCanvas').style.display = '';
+    return;
+  }
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('offscreencanvas-picking.js', {type: 'module});
  worker.postMessage({type: 'main', canvas: offscreen}, [offscreen]);

  ...
```

ブラウザが `OffscreenCanvas` をサポートしていれば、このサンプルは動作するはずです。

{{{example url="../threejs-offscreencanvas.html" }}}

これは素晴らしい事ですが、今の所は全てのブラウザが `OffscreenCanvas` をサポートしているわけではないので、
`OffscreenCanvas` と `OffscreenCanvas` でない場合の両方で動作するようにコードを変更し、動作しない場合はメインページのキャンバスを通常のように表示します。

> 余談ですがページをレスポンシブにするためにOffscreenCanvasが必要な場合、フォールバックを持つ意味がよくわかりません。
> メインページで実行するかWorkerで実行するかには、Workerで実行している時にメインページで実行している時よりも多くのことができるように
> 作業量を調整するかもしれません。何をするかは本当にあなた次第です。

まず最初にすべき事はthree.jsのコードとWorkerに固有のコードを分離することでしょう。
これでメインページとWorkerの両方で同じコードを使う事ができます。
言い換えると3つのファイルを持つ事になります。

1. htmlファイル

   `threejs-offscreencanvas-w-fallback.html`

2. three.jsのコードを含むJavaScript

   `shared-cubes.js`

3. workerをサポートするコード

   `offscreencanvas-worker-cubes.js`

`shared-cubes.js` と `offscreencanvas-worker-cubes.js` は基本的に以前の `offscreencanvas-cubes.js` ファイルを分割したものです。
まず `offscreencanvas-cubes.js` を全て `shared-cube.js` にコピーします。
次にHTMLファイルには既に `main` があり、`init` と `state` をエクスポートする必要があるため `main` の名前を `init` に変更します。

```js
import * as THREE from './resources/threejs/r119/build/three.module.js';

-const state = {
+export const state = {
  width: 300,   // canvas default
  height: 150,  // canvas default
};

-function main(data) {
+export function init(data) {
  const {canvas} = data;
  const renderer = new THREE.WebGLRenderer({canvas});
```

そして、three.js関連以外の部分だけを切り取ります。

```js
-function size(data) {
-  state.width = data.width;
-  state.height = data.height;
-}
-
-const handlers = {
-  main,
-  size,
-};
-
-self.onmessage = function(e) {
-  const fn = handlers[e.data.type];
-  if (!fn) {
-    throw new Error('no handler for type: ' + e.data.type);
-  }
-  fn(e.data);
-};
```

削除した部分を `offscreencanvas-worker-cubes.js` にコピーして `shared-cubes.js` をインポートし、`main` の代わりに `init` を呼び出します。

```js
import {init, state} from './shared-cubes.js';

function size(data) {
  state.width = data.width;
  state.height = data.height;
}

const handlers = {
-  main,
+  init,
  size,
};

self.onmessage = function(e) {
  const fn = handlers[e.data.type];
  if (!fn) {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};
```

同様にメインページに `shared-cubes.js` を含める必要があります。

```html
<script type="module">
+import {init, state} from './shared-cubes.js';
```
以前に追加したHTMLとCSSを削除します。

```html
<body>
  <canvas id="c"></canvas>
-  <div id="noOffscreenCanvas" style="display:none;">
-    <div>no OffscreenCanvas support</div>
-  </div>
</body>
```

CSSは以下のようになります。

```css
-#noOffscreenCanvas {
-    display: flex;
-    width: 100vw;
-    height: 100vh;
-    align-items: center;
-    justify-content: center;
-    background: red;
-    color: white;
-}
```

次にメインページのコードを変更し、1つのstartを呼び出すようにしましょう。
関数を使用するか、またはブラウザが `OffscreenCanvas` をサポートしているかどうかに応じて別の関数を使用します。

```js
function main() {
  const canvas = document.querySelector('#c');
-  if (!canvas.transferControlToOffscreen) {
-    canvas.style.display = 'none';
-    document.querySelector('#noOffscreenCanvas').style.display = '';
-    return;
-  }
-  const offscreen = canvas.transferControlToOffscreen();
-  const worker = new Worker('offscreencanvas-picking.js', {type: 'module'});
-  worker.postMessage({type: 'main', canvas: offscreen}, [offscreen]);
+  if (canvas.transferControlToOffscreen) {
+    startWorker(canvas);
+  } else {
+    startMainPage(canvas);
+  }
  ...
```

Workerをセットアップするために必要だったコードを全て `startWorker` の中に移動します。

```js
function startWorker(canvas) {
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('offscreencanvas-worker-cubes.js', {type: 'module'});
  worker.postMessage({type: 'main', canvas: offscreen}, [offscreen]);

  function sendSize() {
    worker.postMessage({
      type: 'size',
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  }

  window.addEventListener('resize', sendSize);
  sendSize();

  console.log('using OffscreenCanvas');
}
```

`main` の代わりに `init` を送信します。

```js
-  worker.postMessage({type: 'main', canvas: offscreen}, [offscreen]);
+  worker.postMessage({type: 'init', canvas: offscreen}, [offscreen]);
```

メインページで開始するには次のようにします。

```js
function startMainPage(canvas) {
  init({canvas});

  function sendSize() {
    state.width = canvas.clientWidth;
    state.height = canvas.clientHeight;
  }
  window.addEventListener('resize', sendSize);
  sendSize();

  console.log('using regular canvas');
}
```

このサンプルコードではOffscreenCanvasで実行されるか、メインページで実行されるようにフォールバックされます。

{{{example url="../threejs-offscreencanvas-w-fallback.html" }}}

比較的簡単でした。ピッキングしてみましょう。
[ピッキングの記事](threejs-picking.html)にある `RayCaster` の例からコードをいくつか取り出し、画面外でオフスクリーンが動作するようにします。

`shared-cube.js` を `shared-picking.js` にコピーし、ピッキング部分を追加してみましょう。 
この例では `PickHelper` をコピーします。

```js
class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera, time) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }

    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color to flashing red/yellow
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}

const pickPosition = {x: 0, y: 0};
const pickHelper = new PickHelper();
```

マウスの `pickPosition` を以下のように更新しました。

```js
function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}

function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
  pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
}
window.addEventListener('mousemove', setPickPosition);
```

Workerではマウスの位置を直接読み取れないので、サイズのコードと同じようにマウスの位置を指定してメッセージを送信してみましょう。
サイズのコードと同様にマウスの位置を送信して `pickPosition` を更新します。

```js
function size(data) {
  state.width = data.width;
  state.height = data.height;
}

+function mouse(data) {
+  pickPosition.x = data.x;
+  pickPosition.y = data.y;
+}

const handlers = {
  init,
+  mouse,
  size,
};

self.onmessage = function(e) {
  const fn = handlers[e.data.type];
  if (!fn) {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};
```

メインページに戻ってマウスをWorkerやメインページに渡すコードを追加する必要があります。

```js
+let sendMouse;

function startWorker(canvas) {
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('offscreencanvas-worker-picking.js', {type: 'module'});
  worker.postMessage({type: 'init', canvas: offscreen}, [offscreen]);

+  sendMouse = (x, y) => {
+    worker.postMessage({
+      type: 'mouse',
+      x,
+      y,
+    });
+  };

  function sendSize() {
    worker.postMessage({
      type: 'size',
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
  }

  window.addEventListener('resize', sendSize);
  sendSize();

  console.log('using OffscreenCanvas');  /* eslint-disable-line no-console */
}

function startMainPage(canvas) {
  init({canvas});

+  sendMouse = (x, y) => {
+    pickPosition.x = x;
+    pickPosition.y = y;
+  };

  function sendSize() {
    state.width = canvas.clientWidth;
    state.height = canvas.clientHeight;
  }
  window.addEventListener('resize', sendSize);
  sendSize();

  console.log('using regular canvas');  /* eslint-disable-line no-console */
}

```

全てのマウス操作コードをメインページにコピーし、`sendMouse` を使用するようにマイナーチェンジを加えるだけです。

```js
function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
-  pickPosition.x = (pos.x / canvas.clientWidth ) *  2 - 1;
-  pickPosition.y = (pos.y / canvas.clientHeight) * -2 + 1;  // note we flip Y
+  sendMouse(
+      (pos.x / canvas.clientWidth ) *  2 - 1,
+      (pos.y / canvas.clientHeight) * -2 + 1);  // note we flip Y
}

function clearPickPosition() {
  // unlike the mouse which always has a position
  // if the user stops touching the screen we want
  // to stop picking. For now we just pick a value
  // unlikely to pick something
-  pickPosition.x = -100000;
-  pickPosition.y = -100000;
+  sendMouse(-100000, -100000);
}
window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

window.addEventListener('touchstart', (event) => {
  // prevent the window from scrolling
  event.preventDefault();
  setPickPosition(event.touches[0]);
}, {passive: false});

window.addEventListener('touchmove', (event) => {
  setPickPosition(event.touches[0]);
});

window.addEventListener('touchend', clearPickPosition);
```

これでこのピッキングは `OffscreenCanvas` で動作するはずです。

{{{example url="../threejs-offscreencanvas-w-picking.html" }}}

もう一歩踏み込んで `OrbitControls` を追加してみましょう。

これはもう少し複雑です。
`OrbitControls` はDOMをマウス、タッチイベント、キーボードをかなり広範囲にチェックしています。

これまでのコードとは異なり、グローバルな `state` オブジェクトを使うことはできません。
これを使用して動作するようにOrbitControlsのコードを全て書き換える必要はありません。
OrbitControlsは `HTMLElement` を取り、それに使用するDOMイベントのほとんどをアタッチします。
OrbitControlsが必要とする機能をサポートする必要があります。

[OrbitControlsのソースコード](https://github.com/gfxfundamentals/threejsfundamentals/blob/master/threejs/resources/threejs/r119/examples/js/controls/OrbitControls.js)を掘り下げてみると、次のイベントを処理する必要があるように見えます。

* contextmenu
* mousedown
* mousemove
* mouseup
* touchstart
* touchmove
* touchend
* wheel
* keydown

マウスイベントには `ctrlKey`、 `metaKey`、 `shiftKey`、 `button`、 `clientX`、 `clientY`、 `pageX`、 `pageY` プロパティが必要です。
キーダウンイベントには `ctrlKey`, `metaKey`, `shiftKey`, `keyCode` プロパティが必要です。

ホイールイベントに必要なのは `deltaY` プロパティだけです。

また、タッチイベントに必要なのは `touches` プロパティの `pageX` と `pageY` だけです。

そこでproxyオブジェクトのペアを作ってみましょう。
あるパーツはメインページで実行されそれらのイベントを全て取得し、関連するプロパティ値をWorkerに渡します。
他の部分はWorkerで実行されこれらのイベントを受信し、オリジナルのDOMイベントと同じ構造を持つイベントを使用してそれらを渡します。
違いを見分けることができます。

Worker部分のコードです。

```js
import {EventDispatcher} from './resources/threejs/r119/build/three.module.js';

class ElementProxyReceiver extends EventDispatcher {
  constructor() {
    super();
  }
  handleEvent(data) {
    this.dispatchEvent(data);
  }
}
```

メッセージを受信した場合にそれを送信するだけです。

これは `EventDispatcher` を継承しており、DOM要素のように `addEventListener` や `removeEventListener` のようなメソッドを提供しているので、
OrbitControlsに渡せば動作するはずです。

`ElementProxyReceiver` は1つの要素を扱います。
私たちの場合は1人でいいのですが頭を使って考えた方がいいので、複数の管理者を作って管理するようにしています。

```js
class ProxyManager {
  constructor() {
    this.targets = {};
    this.handleEvent = this.handleEvent.bind(this);
  }
  makeProxy(data) {
    const {id} = data;
    const proxy = new ElementProxyReceiver();
    this.targets[id] = proxy;
  }
  getProxy(id) {
    return this.targets[id];
  }
  handleEvent(data) {
    this.targets[data.id].handleEvent(data.data);
  }
}
```

`ProxyManager`のインスタンスを作成し、その `makeProxy` メソッドをidを指定して呼び出す事で、
そのidを持つメッセージに応答する `ElementProxyReceiver` を作成できます。

Workerのメッセージハンドラに接続してみましょう。

```js
const proxyManager = new ProxyManager();

function start(data) {
  const proxy = proxyManager.getProxy(data.canvasId);
  init({
    canvas: data.canvas,
    inputElement: proxy,
  });
}

function makeProxy(data) {
  proxyManager.makeProxy(data);
}

...

const handlers = {
-  init,
-  mouse,
+  start,
+  makeProxy,
+  event: proxyManager.handleEvent,
   size,
};

self.onmessage = function(e) {
  const fn = handlers[e.data.type];
  if (!fn) {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};
```

共有のthree.jsコードでは `OrbitControls` をインポートして設定する必要があります。

```js
import * as THREE from './resources/threejs/r119/build/three.module.js';
+import {OrbitControls} from './resources/threejs/r119/examples/jsm/controls/OrbitControls.js';

export function init(data) {
-  const {canvas} = data;
+  const {canvas, inputElement} = data;
  const renderer = new THREE.WebGLRenderer({canvas});

+  const controls = new OrbitControls(camera, inputElement);
+  controls.target.set(0, 0, 0);
+  controls.update();
```

OffscreenCanvas以外の例のようにキャンバスを渡すのではなく、
`inputElement` を介してOrbitControlsをProxyに渡している事に注目してください。

次に `canvas` を `inputElement` に変更し、HTMLファイルから全てのピッキングイベントのコードを共有のthree.jsコードに移動させます。

```js
function getCanvasRelativePosition(event) {
-  const rect = canvas.getBoundingClientRect();
+  const rect = inputElement.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
-  sendMouse(
-      (pos.x / canvas.clientWidth ) *  2 - 1,
-      (pos.y / canvas.clientHeight) * -2 + 1);  // note we flip Y
+  pickPosition.x = (pos.x / inputElement.clientWidth ) *  2 - 1;
+  pickPosition.y = (pos.y / inputElement.clientHeight) * -2 + 1;  // note we flip Y
}

function clearPickPosition() {
  // unlike the mouse which always has a position
  // if the user stops touching the screen we want
  // to stop picking. For now we just pick a value
  // unlikely to pick something
-  sendMouse(-100000, -100000);
+  pickPosition.x = -100000;
+  pickPosition.y = -100000;
}

*inputElement.addEventListener('mousemove', setPickPosition);
*inputElement.addEventListener('mouseout', clearPickPosition);
*inputElement.addEventListener('mouseleave', clearPickPosition);

*inputElement.addEventListener('touchstart', (event) => {
  // prevent the window from scrolling
  event.preventDefault();
  setPickPosition(event.touches[0]);
}, {passive: false});

*inputElement.addEventListener('touchmove', (event) => {
  setPickPosition(event.touches[0]);
});

*inputElement.addEventListener('touchend', clearPickPosition);
```

メインページに戻り、上記で列挙した全てのイベントにメッセージを送信するコードが必要です。

```js
let nextProxyId = 0;
class ElementProxy {
  constructor(element, worker, eventHandlers) {
    this.id = nextProxyId++;
    this.worker = worker;
    const sendEvent = (data) => {
      this.worker.postMessage({
        type: 'event',
        id: this.id,
        data,
      });
    };

    // register an id
    worker.postMessage({
      type: 'makeProxy',
      id: this.id,
    });
    for (const [eventName, handler] of Object.entries(eventHandlers)) {
      element.addEventListener(eventName, function(event) {
        handler(event, sendEvent);
      });
    }
  }
}
```
`ElementProxy` はProxyしたいイベントの要素を受け取ります。
次にWorkerにIDを登録し、先ほど設定した `makeProxy` メッセージを使って送信します。
Workerは `ElementProxyReceiver` を作成しそのidに登録します。

そして登録するイベントハンドラのオブジェクトを用意します。
このようにして、Workerに転送したいイベントにハンドラを渡す事ができます。

Workerを起動する時はまずProxyを作成しイベントハンドラを渡します。

```js
function startWorker(canvas) {
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('offscreencanvas-worker-orbitcontrols.js', {type: 'module'});

+  const eventHandlers = {
+    contextmenu: preventDefaultHandler,
+    mousedown: mouseEventHandler,
+    mousemove: mouseEventHandler,
+    mouseup: mouseEventHandler,
+    touchstart: touchEventHandler,
+    touchmove: touchEventHandler,
+    touchend: touchEventHandler,
+    wheel: wheelEventHandler,
+    keydown: filteredKeydownEventHandler,
+  };
+  const proxy = new ElementProxy(canvas, worker, eventHandlers);
  worker.postMessage({
    type: 'start',
    canvas: offscreen,
+    canvasId: proxy.id,
  }, [offscreen]);
  console.log('using OffscreenCanvas');  /* eslint-disable-line no-console */
}
```

以下はイベントハンドラです。
受信したイベントからプロパティのリストをコピーするだけです。
`sendEvent` 関数に渡され作成したデータを渡します。
この関数は正しいidを追加してワーカーに送信します

```js
const mouseEventHandler = makeSendPropertiesHandler([
  'ctrlKey',
  'metaKey',
  'shiftKey',
  'button',
  'clientX',
  'clientY',
  'pageX',
  'pageY',
]);
const wheelEventHandlerImpl = makeSendPropertiesHandler([
  'deltaX',
  'deltaY',
]);
const keydownEventHandler = makeSendPropertiesHandler([
  'ctrlKey',
  'metaKey',
  'shiftKey',
  'keyCode',
]);

function wheelEventHandler(event, sendFn) {
  event.preventDefault();
  wheelEventHandlerImpl(event, sendFn);
}

function preventDefaultHandler(event) {
  event.preventDefault();
}

function copyProperties(src, properties, dst) {
  for (const name of properties) {
      dst[name] = src[name];
  }
}

function makeSendPropertiesHandler(properties) {
  return function sendProperties(event, sendFn) {
    const data = {type: event.type};
    copyProperties(event, properties, data);
    sendFn(data);
  };
}

function touchEventHandler(event, sendFn) {
  const touches = [];
  const data = {type: event.type, touches};
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i];
    touches.push({
      pageX: touch.pageX,
      pageY: touch.pageY,
    });
  }
  sendFn(data);
}

// The four arrow keys
const orbitKeys = {
  '37': true,  // left
  '38': true,  // up
  '39': true,  // right
  '40': true,  // down
};
function filteredKeydownEventHandler(event, sendFn) {
  const {keyCode} = event;
  if (orbitKeys[keyCode]) {
    event.preventDefault();
    keydownEventHandler(event, sendFn);
  }
}
```

これは実行に近いと思われるが、実際に試してみると、`OrbitControls` がもう少し必要なものがある事を示しています。

1つは `element.focus` です。Workerには必要ないのでStubを追加しておきましょう。

```js
class ElementProxyReceiver extends THREE.EventDispatcher {
  constructor() {
    super();
  }
  handleEvent(data) {
    this.dispatchEvent(data);
  }
+  focus() {
+    // no-op
+  }
}
```

もう1つは `event.preventDefault` と `event.stopPropagation` を呼び出す事です。
メインページでは既に対応してるのでそれらも役に立たなくなります。

```js
+function noop() {
+}

class ElementProxyReceiver extends THREE.EventDispatcher {
  constructor() {
    super();
  }
  handleEvent(data) {
+    data.preventDefault = noop;
+    data.stopPropagation = noop;
    this.dispatchEvent(data);
  }
  focus() {
    // no-op
  }
}
```

もう1つは `clientWidth` と `clientHeight` を見る事です。
以前はサイズを渡してましたが、Proxyペアを更新してそれも渡すようにします。

Workerの中では

```js
class ElementProxyReceiver extends THREE.EventDispatcher {
  constructor() {
    super();
  }
+  get clientWidth() {
+    return this.width;
+  }
+  get clientHeight() {
+    return this.height;
+  }
+  getBoundingClientRect() {
+    return {
+      left: this.left,
+      top: this.top,
+      width: this.width,
+      height: this.height,
+      right: this.left + this.width,
+      bottom: this.top + this.height,
+    };
+  }
  handleEvent(data) {
+    if (data.type === 'size') {
+      this.left = data.left;
+      this.top = data.top;
+      this.width = data.width;
+      this.height = data.height;
+      return;
+    }
    data.preventDefault = noop;
    data.stopPropagation = noop;
    this.dispatchEvent(data);
  }
  focus() {
    // no-op
  }
}
```

メインページに戻るにはサイズと左と上の位置も送信する必要があります。
このままではキャンバスを移動しても処理されず、サイズが変更されても処理されないです。
移動を処理したい場合は何かがキャンバスを移動する度に `sendSize` を呼び出す必要があります。

```js
class ElementProxy {
  constructor(element, worker, eventHandlers) {
    this.id = nextProxyId++;
    this.worker = worker;
    const sendEvent = (data) => {
      this.worker.postMessage({
        type: 'event',
        id: this.id,
        data,
      });
    };

    // register an id
    worker.postMessage({
      type: 'makeProxy',
      id: this.id,
    });
+    sendSize();
    for (const [eventName, handler] of Object.entries(eventHandlers)) {
      element.addEventListener(eventName, function(event) {
        handler(event, sendEvent);
      });
    }

+    function sendSize() {
+      const rect = element.getBoundingClientRect();
+      sendEvent({
+        type: 'size',
+        left: rect.left,
+        top: rect.top,
+        width: element.clientWidth,
+        height: element.clientHeight,
+      });
+    }
+
+    window.addEventListener('resize', sendSize);
  }
}
```

そして共有のthree.jsコードでは `state` は不要になりました。

```js
-export const state = {
-  width: 300,   // canvas default
-  height: 150,  // canvas default
-};

...

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
-  const width = state.width;
-  const height = state.height;
+  const width = inputElement.clientWidth;
+  const height = inputElement.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
-    camera.aspect = state.width / state.height;
+    camera.aspect = inputElement.clientWidth / inputElement.clientHeight;
    camera.updateProjectionMatrix();
  }

  ...
```

他にもいくつかのハックがあります。
OrbitControlsは `mousemove` と `mouseup` イベントをマウスキャプチャ(マウスがウィンドウの外に出た時)を処理するための要素の `ownerDocument` です。

さらにコードはグローバルな `document` を参照していますが、Workerにはグローバルなドキュメントはありません。

これは2つの簡単なハックで全て解決できます。
Workerコードでは両方の問題に対してProxyを再利用します。

```js
function start(data) {
  const proxy = proxyManager.getProxy(data.canvasId);
+  proxy.ownerDocument = proxy; // HACK!
+  self.document = {} // HACK!
  init({
    canvas: data.canvas,
    inputElement: proxy,
  });
}
```

これで `OrbitControls` が期待に沿った検査を行うための何かを提供します。

難しいのは分かっていますが手短に言うと:
`ElementProxy` はメインページ上で動作し、DOM イベントを転送します。
Worker内の `ElementProxyReceiver` は一緒に使うことができる `HTMLElement` を装っています。
`OrbitControls` と独自のコードを使用しています。

最後にOffscreenCanvasを使用していない時のフォールバックです。
必要なのはcanvas自体を `inputElement` として渡す事です。

```js
function startMainPage(canvas) {
-  init({canvas});
+  init({canvas, inputElement: canvas});
  console.log('using regular canvas');
}
```

これでOrbitControlsがOffscreenCanvasで動作するようになりました。

{{{example url="../threejs-offscreencanvas-w-orbitcontrols.html" }}}

これはおそらくこのサイトで最も複雑な例です。
各サンプルには3つのファイルが含まれているので少しわかりにくいです。
HTMLファイル、Workerファイル、共有のthree.jsコードなどです。

難しいことではなく、少しでも参考になれば幸いです。
three.js、OffscreenCanvas、Web Workerを使った作業の便利な例を紹介しました。
