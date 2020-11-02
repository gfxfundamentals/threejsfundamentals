Title: Three.jsの複数キャンバスと複数シーン
Description: THREE.jsでページ全体にものを描画する方法
TOC: 複数キャンバスと複数シーン

よくある質問として、複数キャンバスを使ったthree.jsの使い方があります。
ECサイトを作りたい、3Dの図をたくさん使ったページを作りたい場合を考えてみましょう。
一見簡単そうに見えます。
図が欲しいところにキャンバスを作るだけです。
それぞれのキャンバスで `Renderer` を作成します。

以下の問題にぶつかる事にすぐに気づくでしょう。

1. ブラウザはWebGLコンテキスト数を制限しています

    一般的にはコンテキスト数の制限は約8個です。
    9個目のコンテキストを作成すると、すぐに古いコンテキストが失われます。

2. WebGLリソースはコンテキスト間で共有できません

    10MBの3Dモデルを2つのキャンバスにロードしたいとします。
    3Dモデルのテクスチャが20MBの場合、10MBのモデルも20MBのテクステャも2回ロードしなければなりません。
    コンテキスト間で共有できるものはありません。
    これは初期化を2回、シェーダーを2回コンパイルする必要があります。
    キャンバスが増えると状況はさらに悪化します。

何か解決策はないでしょうか？

解決策としては、背景のビューポートを埋める1つのキャンバスと、それぞれのキャンバスに"仮想"のキャンバス要素を持つ事です。
仮想キャンバスごとに `Renderer` と `Scene` を1つずつ作成します。
次に仮想キャンバス要素の位置を確認し、その要素が画面上にある場合はThree.jsにシーンを正しい場所に描画するようにします。

この解決策はキャンバスが1つしかないため、上記の問題1と2の両方を解決します。
1つのコンテキストだけなので、WebGLコンテキストの制限にぶつかる事はありません。
同じ理由で共有の問題が発生する事もありません。

2つのシーンだけの簡単な例から始めましょう。まずはHTMLを作成します。

```html
<canvas id="c"></canvas>
<p>
  <span id="box" class="diagram left"></span>
  I love boxes. Presents come in boxes.
  When I find a new box I'm always excited to find out what's inside.
</p>
<p>
  <span id="pyramid" class="diagram right"></span>
  When I was a kid I dreamed of going on an expedition inside a pyramid
  and finding a undiscovered tomb full of mummies and treasure.
</p>
```

次にCSSを次のように設定します。

```css
#c {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: -1;
}
.diagram {
  display: inline-block;
  width: 5em;
  height: 3em;
  border: 1px solid black;
}
.left {
  float: left;
  margin-right: .25em;
}
.right {
  float: right;
  margin-left: .25em;
}
```

キャンバスを画面一杯に設定し、`z-index` を-1に設定し他のDOM要素よりも後に表示されるようにします。
仮想キャンバスにはサイズ指定がないため、幅と高さを指定する必要があります。

次にライトとカメラを使用しそれぞれ2つのシーンを作成します。
あるシーンにキューブを追加し、もう1つのシーンにはひし形を追加します。

```js
function makeScene(elem) {
  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;
  camera.position.set(0, 1, 2);
  camera.lookAt(0, 0, 0);

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  return {scene, camera, elem};
}

function setupScene1() {
  const sceneInfo = makeScene(document.querySelector('#box'));
  const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({color: 'red'});
  const mesh = new THREE.Mesh(geometry, material);
  sceneInfo.scene.add(mesh);
  sceneInfo.mesh = mesh;
  return sceneInfo;
}

function setupScene2() {
  const sceneInfo = makeScene(document.querySelector('#pyramid'));
  const radius = .8;
  const widthSegments = 4;
  const heightSegments = 2;
  const geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
  const material = new THREE.MeshPhongMaterial({
    color: 'blue',
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  sceneInfo.scene.add(mesh);
  sceneInfo.mesh = mesh;
  return sceneInfo;
}

const sceneInfo1 = setupScene1();
const sceneInfo2 = setupScene2();
```

要素が画面上にある場合にのみ、各シーンをレンダリングする関数を作成します。
`Renderer.setScissorTest` で *シザー* テストをオンにし、
` Renderer.setVieport` と `Renderer.setScissor` でシザーとビューポートの両方を設定します。
これでキャンバスの一部にのみレンダリングするようにできます。

```js
function renderSceneInfo(sceneInfo) {
  const {scene, camera, elem} = sceneInfo;

  // get the viewport relative position of this element
  const {left, right, top, bottom, width, height} =
      elem.getBoundingClientRect();

  const isOffscreen =
      bottom < 0 ||
      top > renderer.domElement.clientHeight ||
      right < 0 ||
      left > renderer.domElement.clientWidth;

  if (isOffscreen) {
    return;
  }

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const positiveYUpBottom = canvasRect.height - bottom;
  renderer.setScissor(left, positiveYUpBottom, width, height);
  renderer.setViewport(left, positiveYUpBottom, width, height);

  renderer.render(scene, camera);
}
```

レンダリング関数で最初に画面クリア後、各シーンをレンダリングします。

```js
function render(time) {
  time *= 0.001;

  resizeRendererToDisplaySize(renderer);

  renderer.setScissorTest(false);
  renderer.clear(true, true);
  renderer.setScissorTest(true);

  sceneInfo1.mesh.rotation.y = time * .1;
  sceneInfo2.mesh.rotation.y = time * .1;

  renderSceneInfo(sceneInfo1);
  renderSceneInfo(sceneInfo2);

  requestAnimationFrame(render);
}
```

その結果がこれです。

{{{example url="../threejs-multiple-scenes-v1.html" }}}

最初の `<span>` が赤いキューブ、2つ目の `span` が青いひし形です。

## 同期する

上記のコードは動作していますが、1つだけ小さな問題があります。
シーンが複雑だったり、何らかの理由でレンダリングに時間がかかり過ぎる場合、
キャンバスに描画したシーンの位置が他のページよりも遅れてしまいます。

各エリアに境界線を与えると

```css
.diagram {
  display: inline-block;
  width: 5em;
  height: 3em;
+  border: 1px solid black;
}
```

各シーンの背景を設定します。

```js
const scene = new THREE.Scene();
+scene.background = new THREE.Color('red');
```

そして、<a href="../threejs-multiple-scenes-v2.html" target="_blank">素早く上下にスクロール</a>すると問題が出てきます。以下はスクロールが10倍に遅くなった動画です。

<div class="threejs_center"><img class="border" src="resources/images/multi-view-skew.gif"></div>

異なったトレードオフになる別の方法に切り替える事もできます。
キャンバスのCSSを `position: fixed` から `position: absolute` に切り替えます。

```css
#c {
-  position: fixed;
+  position: absolute;
```

キャンバスの変形を設定し、キャンバス上部が現在のページスクロールしている部分の上部にくるように移動させます。

```js
function render(time) {
  ...

  const transform = `translateY(${window.scrollY}px)`;
  renderer.domElement.style.transform = transform;

```

`position: fixed` はページの残りの部分がスクロールしている間、キャンバスがスクロールしないようにしていました。
これはレンダリングに時間がかかりすぎてレンダリングできなくても、何を描画してもページがスクロールしている間はページに密着します。
最終的にレンダリングする時、ページがスクロールされた位置に合わせてキャンバスを移動し再レンダリングします。
ウィンドウの端だけが一瞬レンダリングされていないビットが表示されますが、<a href="../threejs-multiple-scenes-v2.html" target="_blank">ページの真ん中にあるものは一致しているはずです</a>
そしてスライドしません。新しい方法で10倍に遅くなった結果を見てみましょう。

<div class="threejs_center"><img class="border" src="resources/images/multi-view-fixed.gif"></div>

## より一般的にする

複数のシーンが機能するようになったので、もう少し一般的なものにしてみましょう。

キャンバスを管理するメインのrender関数に、要素とそれに関連するrender関数のリストだけを持たせる事ができます。
各要素について、要素が画面に表示されているかチェックし、表示されている場合は対応するrender関数を呼び出します。
この方法は、個々のシーンが小さなスペースでレンダリングされている事を意識せず汎用的なシステムになります。

これがメインのrender関数です。

```js
const sceneElements = [];
function addScene(elem, fn) {
  sceneElements.push({elem, fn});
}

function render(time) {
  time *= 0.001;

  resizeRendererToDisplaySize(renderer);

  renderer.setScissorTest(false);
  renderer.setClearColor(clearColor, 0);
  renderer.clear(true, true);
  renderer.setScissorTest(true);

  const transform = `translateY(${window.scrollY}px)`;
  renderer.domElement.style.transform = transform;

  for (const {elem, fn} of sceneElements) {
    // get the viewport relative position of this element
    const rect = elem.getBoundingClientRect();
    const {left, right, top, bottom, width, height} = rect;

    const isOffscreen =
        bottom < 0 ||
        top > renderer.domElement.clientHeight ||
        right < 0 ||
        left > renderer.domElement.clientWidth;

    if (!isOffscreen) {
      const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
      renderer.setScissor(left, positiveYUpBottom, width, height);
      renderer.setViewport(left, positiveYUpBottom, width, height);

      fn(time, rect);
    }
  }

  requestAnimationFrame(render);
}
```

`elem` と`fn` プロパティを持つオブジェクトの配列があり、`sceneElements` の上でループしているのがわかります。

要素が画面上にあるかどうかをチェックします。画面上にある場合は `fn` を呼び出し、現在の時刻と矩形を渡します。

これで各シーンのセットアップコードがシーンのリストに追加されます。

```js
{
  const elem = document.querySelector('#box');
  const {scene, camera} = makeScene();
  const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({color: 'red'});
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  addScene(elem, (time, rect) => {
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    mesh.rotation.y = time * .1;
    renderer.render(scene, camera);
  });
}

{
  const elem = document.querySelector('#pyramid');
  const {scene, camera} = makeScene();
  const radius = .8;
  const widthSegments = 4;
  const heightSegments = 2;
  const geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
  const material = new THREE.MeshPhongMaterial({
    color: 'blue',
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  addScene(elem, (time, rect) => {
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    mesh.rotation.y = time * .1;
    renderer.render(scene, camera);
  });
}
```

これで `sceneInfo1` と `sceneInfo2` が不要になり、メッシュを回転させていたコードがシーンごとに固有のものになりました。

{{{example url="../threejs-multiple-scenes-generic.html" }}}

## HTML Datasetを使う

最後にさらに一般的な事として、HTML [dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)を使う事ができます。
これはHTML要素に独自のデータを追加する方法です。
`id="...."` の代わりに `data-diagram="...."` を使います。

```html
<canvas id="c"></canvas>
<p>
-  <span id="box" class="diagram left"></span>
+  <span data-diagram="box" class="left"></span>
  I love boxes. Presents come in boxes.
  When I find a new box I'm always excited to find out what's inside.
</p>
<p>
-  <span id="pyramid" class="diagram left"></span>
+  <span data-diagram="pyramid" class="right"></span>
  When I was a kid I dreamed of going on an expedition inside a pyramid
  and finding a undiscovered tomb full of mummies and treasure.
</p>
```

CSSのセレクタを変更し、それを選択するようにします。

```css
-.diagram
+*[data-diagram] {
  display: inline-block;
  width: 5em;
  height: 3em;
}
```

シーンの設定コードを *シーンの初期化関数* への名前のマップに変更して、*シーンのレンダリング関数* を返すようにします。

```js
const sceneInitFunctionsByName = {
  'box': () => {
    const {scene, camera} = makeScene();
    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({color: 'red'});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return (time, rect) => {
      mesh.rotation.y = time * .1;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
  },
  'pyramid': () => {
    const {scene, camera} = makeScene();
    const radius = .8;
    const widthSegments = 4;
    const heightSegments = 2;
    const geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({
      color: 'blue',
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return (time, rect) => {
      mesh.rotation.y = time * .1;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
  },
};
```

そして `querySelectorAll` を使い全てのダイアグラムを見つけ、対応するinit関数を呼び出します。

```js
document.querySelectorAll('[data-diagram]').forEach((elem) => {
  const sceneName = elem.dataset.diagram;
  const sceneInitFunction = sceneInitFunctionsByName[sceneName];
  const sceneRenderFunction = sceneInitFunction(elem);
  addScene(elem, sceneRenderFunction);
});
```

見た目の変更はありませんが、コードはさらに一般的なものになっています。

{{{examples url="../threejs-multiple-scenes-selector.html" }}}

## 各要素にコントロールを追加する

インタラクティブな要素を追加するには、例えば `TrackballControls` のように簡単です。
最初にコントロール用のスクリプトを追加します。

```js
import {TrackballControls} from './resources/threejs/r122/examples/jsm/controls/TrackballControls.js';
```

そして `TrackballControls` を各シーンに追加し、そのシーンに関連付けられた要素を渡します。

```js
-function makeScene() {
+function makeScene(elem) {
  const scene = new THREE.Scene();

  const fov = 45;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 1, 2);
  camera.lookAt(0, 0, 0);
+  scene.add(camera);

+  const controls = new TrackballControls(camera, elem);
+  controls.noZoom = true;
+  controls.noPan = true;

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
-    scene.add(light);
+    camera.add(light);
  }

-  return {scene, camera};
+ return {scene, camera, controls};
}
```

シーンにカメラを追加し、ライティングを加えたのがわかると思います。
これにより、カメラに対する相対的な光を受けます。
`TrackballControls` がカメラを動かしているので、これが望んだ形です。
見ている対象物の側に光を当て続けます。

render関数でこれらのコントロールを更新する必要があります。

```js
const sceneInitFunctionsByName = {
- 'box': () => {
-    const {scene, camera} = makeScene();
+ 'box': (elem) => {
+    const {scene, camera, controls} = makeScene(elem);
    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({color: 'red'});
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return (time, rect) => {
      mesh.rotation.y = time * .1;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
+      controls.handleResize();
+      controls.update();
      renderer.render(scene, camera);
    };
  },
-  'pyramid': () => {
-    const {scene, camera} = makeScene();
+  'pyramid': (elem) => {
+    const {scene, camera, controls} = makeScene(elem);
    const radius = .8;
    const widthSegments = 4;
    const heightSegments = 2;
    const geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({
      color: 'blue',
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return (time, rect) => {
      mesh.rotation.y = time * .1;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
+      controls.handleResize();
+      controls.update();
      renderer.render(scene, camera);
    };
  },
};
```

オブジェクトをドラッグすると回転するようになりました。

{{{example url="../threejs-multiple-scenes-controls.html" }}}

これらのテクニックはこのサイト自体にも使われています。
特に[プリミティブの記事](threejs-primitives.html)と[マテリアルの記事](threejs-materials.html)では、このテクニックを使ってページ全体に様々な例を追加しています。

もう1つの解決策は、オフスクリーンのキャンバスにレンダリングし、各要素で結果を2Dキャンバスにコピーする事です。
この解決策の利点は、分離した各領域を合成する方法に制限がないです。
以前の解決策では、背景に単一のキャンバスを使用していました。
この解決策では通常のHTML要素を使用しています。

欠点としては、領域ごとにコピーが発生するため遅いという事です。
どのくらい遅くなるかはブラウザとGPUに依存します。

必要な変更は非常に小さいです。

まず、ページ内にキャンバスが不要になったのでHTMLを変更します。

```html
<body>
-  <canvas id="c"></canvas>
  ...
</body>
```

CSSも変更します。

```
-#c {
-  position: absolute;
-  left: 0;
-  top: 0;
-  width: 100%;
-  height: 100%;
-  display: block;
-  z-index: -1;
-}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
*[data-diagram] {
  display: inline-block;
  width: 5em;
  height: 3em;
}
```

全てのキャンバスにcontainerを埋めさせました。

では、JavaScriptを変更してみましょう。
もはやキャンバスを調べる事は不要になりました。
代わりに私たちは1つのものを作ります。
また、最初にシザーテストをONにします。

```js
function main() {
-  const canvas = document.querySelector('#c');
+  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
+  renderer.setScissorTest(true);

  ...
```

次に各シーンに対して2Dレンダリングのコンテキストを作成し、そのシーンの要素にキャンバスを追加します。

```js
const sceneElements = [];
function addScene(elem, fn) {
+  const ctx = document.createElement('canvas').getContext('2d');
+  elem.appendChild(ctx.canvas);
-  sceneElements.push({elem, fn});
+  sceneElements.push({elem, ctx, fn});
}
```

レンダリング時に、レンダラーのキャンバスがレンダリングするのに十分な大きさでない場合はそのサイズを大きくします。
また、キャンバスのサイズが間違っている場合は、そのサイズを変更します。
最後にシザーとビューポートを設定し、シーンをレンダリングしその結果をキャンバスにコピーします。

```js
function render(time) {
  time *= 0.001;

-  resizeRendererToDisplaySize(renderer);
-
-  renderer.setScissorTest(false);
-  renderer.setClearColor(clearColor, 0);
-  renderer.clear(true, true);
-  renderer.setScissorTest(true);
-
-  const transform = `translateY(${window.scrollY}px)`;
-  renderer.domElement.style.transform = transform;

-  for (const {elem, fn} of sceneElements) {
+  for (const {elem, fn, ctx} of sceneElements) {
    // get the viewport relative position of this element
    const rect = elem.getBoundingClientRect();
    const {left, right, top, bottom, width, height} = rect;
+    const rendererCanvas = renderer.domElement;

    const isOffscreen =
        bottom < 0 ||
-        top > renderer.domElement.clientHeight ||
+        top > window.innerHeight ||
        right < 0 ||
-        left > renderer.domElement.clientWidth;
+        left > window.innerWidth;

    if (!isOffscreen) {
-      const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
-      renderer.setScissor(left, positiveYUpBottom, width, height);
-      renderer.setViewport(left, positiveYUpBottom, width, height);

+      // make sure the renderer's canvas is big enough
+      if (rendererCanvas.width < width || rendererCanvas.height < height) {
+        renderer.setSize(width, height, false);
+      }
+
+      // make sure the canvas for this area is the same size as the area
+      if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
+        ctx.canvas.width = width;
+        ctx.canvas.height = height;
+      }
+
+      renderer.setScissor(0, 0, width, height);
+      renderer.setViewport(0, 0, width, height);

      fn(time, rect);

+      // copy the rendered scene to this element's canvas
+      ctx.globalCompositeOperation = 'copy';
+      ctx.drawImage(
+          rendererCanvas,
+          0, rendererCanvas.height - height, width, height,  // src rect
+          0, 0, width, height);                              // dst rect
    }
  }

  requestAnimationFrame(render);
}
```

結果は同じように見えます。

{{{example url="../threejs-multiple-scenes-copy-canvas.html" }}}

この解決策のもう1つの利点は、潜在的にWeb workerからレンダリングするには [`OffscreenCanvas`](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)を使用しますが、このテクニックも使用します。
残念ながら2020年7月現在、`OffscreenCanvas` はChromeのみの対応となっています。
