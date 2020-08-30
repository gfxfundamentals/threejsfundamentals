Title: Three.jsにおけるJavaScriptのデバッグ
Description: THREE.jsでJavaScriptをデバッグする方法
TOC: JavaScriptのデバッグ

この記事のほとんどはTHREE.jsのデバッグというより、一般的なJavaScriptのデバッグについての記事です。THREE.jsを始めたばかりの人もJavaScriptを始めたばかりの人が多いので、問題解決の助けになればいいと思います。デバッグに関しては、時間をかけて学ぶ事を強くオススメします。

デバッグは大きなトピックでこの記事で全てをカバーできませんが、JavaScriptに慣れていない場合はいくつかのヒントを得られると思います。デバッグはあたなの学習を大いにサポートしてくれるでしょう。

## ブラウザの開発者ツールを学ぶ

全てのブラウザには開発者ツールがあります。
[Chrome](https://developers.google.com/web/tools/chrome-devtools/),
[Firefox](https://developer.mozilla.org/en-US/docs/Tools), 
[Safari](https://developer.apple.com/safari/tools/), 
[Edge](https://docs.microsoft.com/en-us/microsoft-edge/devtools-guide).

Chromeでは `⋮` アイコンをクリックし、その他のツール -> デベロッパー ツールを選択すると開発者ツールが表示されます。そこにはキーボードのショートカットも表示されています。

<div class="threejs_center"><img class="border" src="resources/images/devtools-chrome.jpg" style="width: 789px;"></div>

Firefoxでは `☰` アイコンをクリックし、"ウェブ開発"から"開発者ツール"を選択します。

<div class="threejs_center"><img class="border" src="resources/images/devtools-firefox.jpg" style="width: 786px;"></div>

Safariでは詳細設定メニューから開発メニューを有効にする必要があります。

<div class="threejs_center"><img class="border" src="resources/images/devtools-enable-safari.jpg" style="width: 775px;"></div>

次に開発メニューで"Webインスペクタの表示/接続"を選択します。

<div class="threejs_center"><img class="border" src="resources/images/devtools-safari.jpg" style="width: 777px;"></div>

[Chromeを使ってAndroidやタブレットでChrome上で実行されているウェブページをデバッグする事もできます](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/)。
同様にSafariでは[iPhoneやiPadでSafari上で実行されているウェブページをPCでデバッグする事ができます](https://www.google.com/search?q=safari+remote+debugging+ios)。

私はChromeを一番よく知ってるのでこのガイドではツールを参照する際にChromeを例にしますが、ほとんどのブラウザは似たような機能を持っているため、全てのブラウザで簡単に適用できるはずです。

## キャッシュをオフにする

ブラウザはダウンロードしたデータを再利用しようとします。これはウェブサイトを2回目に訪れた場合、サイトを表示するためのファイルの多くは再びダウンロードされず、ユーザーにとって素晴らしい事です。

一方でこれはウェブ開発に悪い影響を与える可能性があります。PC上でファイル変更しリロードしても、前回ダウンロードしたバージョンを使用しているため変更内容が表示されません。

ウェブ開発中の解決策の1つは、キャッシュをオフにする事です。これによりブラウザは常に最新バージョンのファイルを取得する事ができます。

最初にデベロッパーツールのSettingsメニューを選択します。

<div class="threejs_center"><img class="border" src="resources/images/devtools-chrome-settings.jpg" style="width: 778px"></div>

次に "Disable Cache (while DevTools is open)" を選択します。

<div class="threejs_center"><img class="border" src="resources/images/devtools-chrome-disable-cache.jpg" style="width: 779px"></div>

## JavaScriptコンソールを使用する

全てのdevtoolsの中には *console* があります。ここには警告やエラーメッセージが表示されます。

**メッセージを読みましょう!!**

一般的にはメッセージは1つか2つしかありません。

<div class="threejs_center"><img class="border" src="resources/images/devtools-no-errors.jpg" style="width: 779px"></div>

もし他のメッセージがあれば**メッセージを読みましょう**。例えば

<div class="threejs_center"><img class="border" src="resources/images/devtools-errors.jpg" style="width: 779px"></div>

"three"を"threee"とスペルミスしました。

以下のように `console.log` であなた自身がconsoleに情報を表示する事もできます。

```js
console.log(someObject.position.x, someObject.position.y, someObject.position.z);
```

さらにクールな事に、オブジェクトのログを記録したり検査する事ができます。例えば[gLTFの記事](threejs-load-gltf.html)からルートシーンのオブジェクトをlogに表示できます。

```js
  {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
      const root = gltf.scene;
      scene.add(root);
+      console.log(root);
```

そしてそのオブジェクトをJavaScriptコンソールで展開できます。

<div class="threejs_center"><img class="border" src="resources/images/devtools-console-object.gif"></div>

スタックトレースを含む赤色メッセージを表示する場合は `console.error` を使う事ができます。

## データを画面に載せる

もう1つの分かりやすい方法は `<div>` や `<pre>` タグを追加してデータを入れる事です。

最も分かりやすい方法はいくつかのHTML要素を作成する事です。

```html
<canvas id="c"></canvas>
+<div id="debug">
+  <div>x:<span id="x"></span></div>
+  <div>y:<span id="y"></span></div>
+  <div>z:<span id="z"></span></div>
+</div>
```

キャンバスの上に残るようにスタイルを整えます（キャンバスがページを埋めていると仮定します）。

```html
<style>
#debug {
  position: absolute;
  left: 1em;
  top: 1em;
  padding: 1em;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-family: monospace;
}
</style>
```

そして要素を探して内容を設定します。

```js
// at init time
const xElem = document.querySelector('#x');
const yElem = document.querySelector('#y');
const zElem = document.querySelector('#z');

// at render or update time
xElem.textContent = someObject.position.x.toFixed(3);
yElem.textContent = someObject.position.y.toFixed(3);
zElem.textContent = someObject.position.z.toFixed(3);
```

これはリアルタイムな値を見る時はとても便利です。

{{{example url="../threejs-debug-js-html-elements.html" }}}

または、画面にデータを貼り付けるのにクリアロガーを作成する方法もあります。私はその言葉を作っただけですが、私が開発したゲームの多くはこの解決法を使っています。
このアイデアは1フレーム分だけメッセージを表示するバッファを持つ事です。
データを表示したいコードのどの部分でも、フレームごとにバッファにデータを追加する関数を呼び出します。これは上記のデータのピースごとに要素を作成するよりもはるかに少ない作業です。

例えば上記のHTMLを以下のように変更してみましょう。

```html
<canvas id="c"></canvas>
<div id="debug">
  <pre></pre>
</div>
```

そして、この*クリアバックバッファ*を管理するための簡単なクラスを作ってみましょう。

```js
class ClearingLogger {
  constructor(elem) {
    this.elem = elem;
    this.lines = [];
  }
  log(...args) {
    this.lines.push([...args].join(' '));
  }
  render() {
    this.elem.textContent = this.lines.join('\n');
    this.lines = [];
  }
}
```

次にマウスをクリックするたびに2秒間のランダムな方向に移動するメッシュを作成する簡単な例を作ってみましょう。[レスポンシブデザイン](threejs-responsive.html)の記事から例を紹介します。

マウスをクリックするたびに新しい `Mesh` を追加するコードは以下の通りです。

```js
const geometry = new THREE.SphereBufferGeometry();
const material = new THREE.MeshBasicMaterial({color: 'red'});

const things = [];

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

function createThing() {
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  things.push({
    mesh,
    timer: 2,
    velocity: new THREE.Vector3(rand(-5, 5), rand(-5, 5), rand(-5, 5)),
  });
}

canvas.addEventListener('click', createThing);
```

作成したメッシュを移動させログに記録し、タイマーが切れたら削除するコードです。

```js
const logger = new ClearingLogger(document.querySelector('#debug pre'));

let then = 0;
function render(now) {
  now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;

  ...

  logger.log('fps:', (1 / deltaTime).toFixed(1));
  logger.log('num things:', things.length);
  for (let i = 0; i < things.length;) {
    const thing = things[i];
    const mesh = thing.mesh;
    const pos = mesh.position;
    logger.log(
        'timer:', thing.timer.toFixed(3), 
        'pos:', pos.x.toFixed(3), pos.y.toFixed(3), pos.z.toFixed(3));
    thing.timer -= deltaTime;
    if (thing.timer <= 0) {
      // remove this thing. Note we don't advance `i`
      things.splice(i, 1);
      scene.remove(mesh);
    } else {
      mesh.position.addScaledVector(thing.velocity, deltaTime);
      ++i;
    }
  }

  renderer.render(scene, camera);
  logger.render();

  requestAnimationFrame(render);
}
```

以下の例でマウスをクリックして下さい。

{{{example url="../threejs-debug-js-clearing-logger.html" }}}

## クエリパラメーター

もう1つ覚えておきたいのは、ウェブページにはクエリパラメーターやアンカーを介してデータを渡す事ができます。検索とハッシュと呼ばれる事があります。

    https://domain/path/?query#anchor

これを使用しオプション機能やパラメーターを渡す事ができます。

例えば、先ほどの例では次のようにしています。デバッグ機能はURLに `?debug=true` を指定した場合にのみ表示されます。

まず、クエリストリングを解析するコードが必要です。

```js
/**
  * Returns the query parameters as a key/value object. 
  * Example: If the query parameters are
  *
  *    abc=123&def=456&name=gman
  *
  * Then `getQuery()` will return an object like
  *
  *    {
  *      abc: '123',
  *      def: '456',
  *      name: 'gman',
  *    }
  */
function getQuery() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}
```

そうすると、debug要素をデフォルトでは表示しないようにする事ができるかもしれません。

```html
<canvas id="c"></canvas>
+<div id="debug" style="display: none;">
  <pre></pre>
</div>
```

このコードの引数をみると `?debug=true` が渡されただけの場合にデバッグ情報の非表示にするのが分かります。

```js
const query = getQuery();
const debug = query.debug === 'true';
const logger = debug
   ? new ClearingLogger(document.querySelector('#debug pre'))
   : new DummyLogger();
if (debug) {
  document.querySelector('#debug').style.display = '';
}
```

`?debug=true` の場合は何も渡さないように `DummyLogger` を作りました。

```js
class DummyLogger {
  log() {}
  render() {}
}
```

このURLを使用しているかどうかを確認する事ができます。

<a target="_blank" href="../threejs-debug-js-params.html">threejs-debug-js-params.html</a>

デバッグ情報はありませんが、このURLを使用するとデバッグ情報が得られます。

<a target="_blank" href="../threejs-debug-js-params.html?debug=true">threejs-debug-js-params.html?debug=true</a>

これにはデバッグ情報があります。

複数のパラメーターは `somepage.html?someparam=somevalue&someotherparam=someothervalue` のように'&'で区切る事で渡せます。
このようなパラメータを使用するとあらゆる種類のオプションを渡す事ができます。
`speed=0.01` のようにアプリの速度を遅くしてわかりやすくしたり、`showHelpers=true` のように他のレッスンで見られる照明や影、カメラのフラスタムを表示するヘルパーを追加するかどうかを設定したりしてもいいかもしれません。

## デバッガの使い方を学ぶ

どのブラウザにもデバッガがあり、プログラムを1行ごとに一時停止し全ての変数を検査する事ができます。

デバッガの使い方を教えるのはあまりにも大きなトピックなので、ここではいくつかのリンクを紹介します。

* [Chrome DevTools で JavaScript をデバッグする](https://developers.google.com/web/tools/chrome-devtools/javascript/)
* [Debugging in Chrome](https://javascript.info/debugging-chrome)
* [Tips and Tricks for Debugging in Chrome Developer Tools](https://hackernoon.com/tips-and-tricks-for-debugging-in-chrome-developer-tools-458ade27c7ab)

## デバッガなどで `NaN` がないかチェックする

`NaN` は Not A Numberの略です。これは数学的に意味のない事をした場合、JavaScript が値として代入するものです。

簡単な例としては

<div class="threejs_center"><img class="border" src="resources/images/nan-banana.png" style="width: 180px;"></div>

何か開発中に画面に何も表示されない事がよくあるので、いくつかの値を確認し `NaN` が表示されたらすぐに探す場所ができます。

パスを最初に作り始めた例として[gLTFファイルの読込](threejs-load-gltf.html)の記事で、2次元曲線を作るSplineCurveクラスを使って曲線を作ってみました。

そのカーブを利用してこんな風に車を動かしました。

```js
curve.getPointAt(zeroToOnePointOnCurve, car.position);
```

内部的には `curve.getPointAt` は第二引数として渡されたオブジェクトに対して `set` 関数を呼び出します。この場合、第2引数は `car.position` であり、これは `Vector3` です。`Vector3` の `set` 関数は x, y, z の3つの引数を必要としますが、`SplineCurve` は2次元曲線なので、xとyだけを指定して `car.position.set` を呼び出します。

その結果、`car.position.set` はxをxに、yをyに、zを `undefined` に設定します。

デバッガで `matrixWorld` を見てみると `NaN` 値のが表示されています。

<div class="threejs_center"><img class="border" src="resources/images/debugging-nan.gif" style="width: 476px;"></div>

行列を見ると `NaN` が含まれており、`position`, `rotation`, `scale`, または他の関数に影響を与える悪いデータがある事が見えます。これらの悪いデータから逆算すると、問題を追跡するのは簡単です。

`NaN` の上には `Infinity` もありますが、これはどこかに数学のバグがあるような気がします。

## コードの中を見て!

THREE.jsはオープンソースです。コードの中を見る事を恐れないで下さい!
[github](https://github.com/mrdoob/three.js)で内部コードを見れます。
また、デバッガの関数を踏み込んで内部を見る事もできます。その際には、`three.min.js` でなく `three.js` を見るようにして下さい。`three.min.js` は、最小化・圧縮されたバージョンなので、ダウンロードする際のサイズが小さくなっています。`three.js` はサイズは大きいですが、デバッグしやすいバージョンです。私はよく `three.js` に切り替えて、コードをステップスルーを行い、何が起こっているのかを確認しています。

## render関数の下に `requestAnimationFrame` を配置する

以下のパターンはよく見かけます。

```js
function render() {
   requestAnimationFrame(render);

   // -- do stuff --

   renderer.render(scene, camera);
}
requestAnimationFrame(render);
```

以下のように `requestAnimationFrame` の呼び出しを一番下に置く事をお勧めします。

```js
function render() {
   // -- do stuff --

   renderer.render(scene, camera);

   requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

最大の理由は、エラーが発生した場合にあなたのコードが停止する事を意味します。
`requestAnimationFrame`を先頭に置くのは、既に別のフレームを要求しているためにエラーが発生してもコードを実行し続ける事です。
IMOを無視するよりも、それらのエラーを見つける方が良いでしょう。これらのエラーは、何かが期待したように表示されない原因になりやすいのですが、コードが停止しない限り、気がつかないかもしれません。

## 単位をチェックして下さい!

ここでは基本的な角度を使う時、ラジアンを使う時の例を知ってる必要があります。
残念ながら、THREE.jsではどこでも同じ単位を使用している訳ではありません。
頭のてっぺんからカメラの視野は度が入っています。その他の角度は全てラジアンで表示されます。

もう1つ注目したいのは、あなたの世界単位の大きさです。最近の3Dアプリでは好きな単位を選べるようになっています。あるアプリでは1単位＝1cmを選択する事があります。もう1つのアプリでは1台＝1フィートを選ぶかもしれません。特定の用途に合わせて好きな単位を選べるアプリはあります。つまり、three.jsは1単位＝1メートルを想定しています。
これは、測定器を使用して照明効果を計算する物理ベースのレンダリングなどで重要です。
スマホがどこにあるか、VRコントローラーがどこにあるかなど、現実世界の単位を扱う必要があるARやVRにとっても重要です。

## スタックオーバーフローのための *最小で完全で検証可能なサンプルコード* の作成

THREE.jsについて質問をする場合、MCVE（Minimal<最小>、Complete<完全>、Verifiable<検証可能>、Example<サンプル>の略）のコードを提供する事が求められます。

**最小** の部分が重要です。[gLTF読込の記事](threejs-load-gltf.html)の最後のサンプルコードでパスの動きに問題があったとしましょう。そのサンプルには多くのパーツがあり、リストアップすると

1. HTMLの集まり
2. いくつかのCSS
3. ライティング
4. 影
5. 影を操作するためのDAT.guiコード
6. GLTFファイルの読込コード
7. キャンバスのリサイズコード
8. パスに沿って車を移動させるコード

このコードはかなり大きいです。もし質問がパスの後に続く部分だけであれば、THREE.jsの `<canvas>` と `<script>` タグだけで済むので、ほとんどのHTMLを削除する事ができます。CSSとリサイズのコードを削除する事ができます。GLTFのコードもパスだけを気にしているので削除できます。`MeshBasicMaterial` を使用すると、ライトとシャドウも削除する事ができます。DAT.guiのコードも確実に削除できます。
このコードはテクスチャ付きの地面を作ります。`GridHelper` を使った方が簡単です。
最終的に、もし質問したい事がパス上での移動についてなら、ロードされた車モデルの代わりにパス上にキューブを使用する事ができます。

以上の事を考慮したミニマムなサンプルコードを紹介します。271行から135行に縮小しました。パスを単純化する事でさらに縮小する事も考られます。3,4点のパスは、21点のパスと同じように動作するかもしれません。

{{{example url="../threejs-debugging-mcve.html" }}}

I kept the `OrbitController` just because it's useful for others
to move the camera and figure out what's going on but depending
on your issue you might be able to remove that as well.

The best thing about making an MCVE is we'll often solve our own
problem. The process of removing everything that's not needed and
making the smallest example we can that reproduces the issue more
often than not leads us to our bug.

On top of that it's respectful of all the people's time who you are
asking to look at your code on Stack Overflow. By making the minimal
example you make it much easier for them to help you. You'll also
learn in the process.

Also important, when you go to Stack Overflow to post your question **put your
code [in a snippet](https://stackoverflow.blog/2014/09/16/introducing-runnable-javascript-css-and-html-code-snippets/).**
Of course you are welcome to use JSFiddle or Codepen or similar site to test out
your MCVE but once you actually get to posting your question on Stack Overflow
you're required to put the code to reproduce your issue **in the question itself**. 
By making a snippet you satisfy that requirement.

Also note all the live examples on this site should run as snippets.
Just copy the HTML, CSS, and JavaScript parts to their respective
parts of the [snippet editor](https://stackoverflow.blog/2014/09/16/introducing-runnable-javascript-css-and-html-code-snippets/).
Just remember to try to remove the parts that are not relevant to
your issue and try to make your code the minimal amount needed.

Follow these suggestions and you're far more likely to get help
with your issue.

## Use a `MeshBasicMaterial`

Because the `MeshBasicMaterial` uses no lights this is one way to 
remove reasons something might not be showing up. If your objects
show up using `MeshBasicMaterial` but not with whatever materials
you were using then you know the issue is likely with the materials
or the lights and not some other part of the code.

## Check your `near` and `far` settings for your camera

A `PerspectiveCamera` has `near` and `far` settings which are covered in the
[article on cameras](threejs-cameras.html). Make sure they are set to fit the
space that contains your objects. Maybe even just **temporarily** set them to
something large like `near` = 0.001 and `far` = 1000000. You will likely run
into depth resolution issues but you'll at least be able to see your objects
provided they are in front of the camera.

## Check your scene is in front of the camera

Sometimes things don't appear because they are not in front of the camera. If
your camera is not controllable try adding camera control like the
`OrbitController` so you can look around and find your scene. Or, try framing
the scene using code which is covered in [this article](threejs-load-obj.html).
That code finds the size of part of the scene and then moves the camera and
adjusts the `near` and `far` settings to make it visible. You can then look in
the debugger or add some `console.log` messages to print the size and center of
the scene.

## Put something in front of the camera

This is just another way of saying if all else fails start with
something that works and then slowly add stuff back in. If you get
a screen with nothing on it then try putting something directly in
front of the camera. Make a sphere or box, give it a simple material
like the `MeshBasicMaterial` and make sure you can get that on the screen.
Then start adding things back a little at time and testing. Eventually
you'll either reproduce your bug or you'll find it on the way.

---

These were a few tips for debugging JavaScript. Let's also go
over [some tips for debugging GLSL](threejs-debugging-glsl.html).
