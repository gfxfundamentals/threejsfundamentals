Title: Three.jsでアニメーションする多くのオブジェクトを最適化
Description: モーフターゲットでアニメーションするオブジェクトをマージする
TOC: アニメーションする多くのオブジェクトを最適化

この記事は[多くのオブジェクトを最適化](threejs-optimize-lots-of-objects.html)の続きです。まだ読んでいない場合は先に読んでみて下さい。

前回の記事では約19000個のキューブを単体のジオメトリにマージしました。
19000個のキューブの描画を最適化する利点がありましたが、個々のキューブを動かすのが難しくなる欠点がありました。

何を達成しようとしているかによって、様々な解決策があります。
今回は複数のデータの集合をグラフ化し、その集合間でアニメーションさせてみましょう。

まず、複数のデータセットを取得する必要があります。
理想的にはオフラインでデータの前処理をする事ですが、今回は2つのデータセットをロードしてさらに2つのデータを生成してみましょう。

以下は古いデータロードのコードです。

```js
loadFile('resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc')
  .then(parseData)
  .then(addBoxes)
  .then(render);
```

こんな感じに変更してみましょう。

```js
async function loadData(info) {
  const text = await loadFile(info.url);
  info.file = parseData(text);
}

async function loadAll() {
  const fileInfos = [
    {name: 'men',   hueRange: [0.7, 0.3], url: 'resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014mt_2010_cntm_1_deg.asc' },
    {name: 'women', hueRange: [0.9, 1.1], url: 'resources/data/gpw/gpw_v4_basic_demographic_characteristics_rev10_a000_014ft_2010_cntm_1_deg.asc' },
  ];

  await Promise.all(fileInfos.map(loadData));

  ...
}
loadAll();
```

上記のコードでは `fileInfos` 内の各オブジェクトのurlプロパティからファイルをロードし、`file` プロパティに渡ってPromise.allで全てのファイルをロードします。
`name` と `hueRange` プロパティは後で使います。`name` はUIフィールドです。`hueRange` はマップする色相の範囲を選択するために使います。

上記の2つのファイルは、2010年時点でのエリア別の男性数と女性数を示しています。
注：このデータが正しいかどうかはわかりませんが、実際には重要ではありません。
重要なのは異なるデータセットを示す事です。

さらに2つのデータセットを生成してみましょう。
1つは女性の数よりも男性の数が多い場所、逆にもう1つは男性より女性が多い場所です。

まず先ほどのような2次元配列を与えられた時に、それをマップして新しい2次元配列を生成する関数を書いてみましょう。

```js
function mapValues(data, fn) {
  return data.map((row, rowNdx) => {
    return row.map((value, colNdx) => {
      return fn(value, rowNdx, colNdx);
    });
  });
}
```

通常の `Array.map` 関数と同様に `mapValues` 関数は配列の各値に対して関数 `fn` を呼び出します。
値と行と列のインデックスの両方を渡します。

2つのファイルを比較した新しいファイルを生成するコードを作成してみましょう。

```js
function makeDiffFile(baseFile, otherFile, compareFn) {
  let min;
  let max;
  const baseData = baseFile.data;
  const otherData = otherFile.data;
  const data = mapValues(baseData, (base, rowNdx, colNdx) => {
    const other = otherData[rowNdx][colNdx];
      if (base === undefined || other === undefined) {
        return undefined;
      }
      const value = compareFn(base, other);
      min = Math.min(min === undefined ? value : min, value);
      max = Math.max(max === undefined ? value : max, value);
      return value;
  });
  // make a copy of baseFile and replace min, max, and data
  // with the new data
  return {...baseFile, min, max, data};
}
```

上記のコードは `compareFn` 関数で比較した新しいデータセットを生成する `mapValues` 関数を使っています。
また、`min` と `max` の比較結果も追跡します。
最後に新しく `min`、`max`、`data` を追加した以外は `baseFile` と同じプロパティを持つ新しいファイルを作成します。

そして、それを使って2つの新しいデータセットを作りましょう。

```js
{
  const menInfo = fileInfos[0];
  const womenInfo = fileInfos[1];
  const menFile = menInfo.file;
  const womenFile = womenInfo.file;

  function amountGreaterThan(a, b) {
    return Math.max(a - b, 0);
  }
  fileInfos.push({
    name: '>50%men',
    hueRange: [0.6, 1.1],
    file: makeDiffFile(menFile, womenFile, (men, women) => {
      return amountGreaterThan(men, women);
    }),
  });
  fileInfos.push({
    name: '>50% women', 
    hueRange: [0.0, 0.4],
    file: makeDiffFile(womenFile, menFile, (women, men) => {
      return amountGreaterThan(women, men);
    }),
  });
}
```

これらのデータセットを選択するUIを生成しましょう。まず、いくつかのhtmlのUIが必要です。

```html
<body>
  <canvas id="c"></canvas>
+  <div id="ui"></div>
</body>
```

そして、左上のエリアに表示するためにCSSを追加しました。

```css
#ui {
  position: absolute;
  left: 1em;
  top: 1em;
}
#ui>div {
  font-size: 20pt;
  padding: 1em;
  display: inline-block;
}
#ui>div.selected {
  color: red;
}
```

各ファイルを調べてデータセットごとにマージされたボックスのセットを生成します。
これで上にマウスカーソルを置くとそのセットを表示し、他の全てのセットを非表示にするUIを生成する事ができます。

```js
// show the selected data, hide the rest
function showFileInfo(fileInfos, fileInfo) {
  fileInfos.forEach((info) => {
    const visible = fileInfo === info;
    info.root.visible = visible;
    info.elem.className = visible ? 'selected' : '';
  });
  requestRenderIfNotRequested();
}

const uiElem = document.querySelector('#ui');
fileInfos.forEach((info) => {
  const boxes = addBoxes(info.file, info.hueRange);
  info.root = boxes;
  const div = document.createElement('div');
  info.elem = div;
  div.textContent = info.name;
  uiElem.appendChild(div);
  div.addEventListener('mouseover', () => {
    showFileInfo(fileInfos, info);
  });
});
// show the first set of data
showFileInfo(fileInfos, fileInfos[0]);
```

先ほどの例からもう1つ変更が必要で `addBoxes` の引数に `hueRange` があります。

```js
-function addBoxes(file) {
+function addBoxes(file, hueRange) {

  ...

    // compute a color
-    const hue = THREE.MathUtils.lerp(0.7, 0.3, amount);
+    const hue = THREE.MathUtils.lerp(...hueRange, amount);

  ...
```

これで4つのデータセットを表示できるようになるはずです。ラベルの上にマウスを置いたり、タッチしてセットを切り替えたりする事ができます。

{{{example url="../threejs-lots-of-objects-multiple-data-sets.html" }}}

注意してほしいのは、突出したいくつかの奇妙なデータポイントがあります。
これは何が起きてるのでしょう！？
いずれにしてもこの4つのデータの間をアニメーションさせるにはどうすればいいのでしょうか。

たくさんのアイデアがあります。

*  `Material.opacity` でフェードする

   この解決策の問題点はキューブが完全に重なっているため、Z軸の戦いの問題を意味します。
   depth関数に変えてブレンディングを使えば直る可能性はあります。調べてみた方が良さそうですね。

*  見たいセットをスケールアップして他のセットをスケールダウンする

   全てのボックスは惑星の中心に位置しているので、1.0以下に縮小すると惑星の中に沈んでしまいます。
   最初は良いアイデアのように聞こえますが、高さの低いボックスはほとんどすぐに消えてしまい、新しいデータセットが1.0までスケールアップするまで置き換えられないという事です。
   このため、アニメーションの遷移があまり気持ち良くありません。派手なカスタムシェーダーで修正できるかもしれません。

*  モーフターゲットを使用する

   モーフターゲットはジオメトリ内の各頂点に複数の値を与え、それらの間を *モーフ* または lerp (線形補間) する方法です。
   モーフターゲットは3Dキャラクターの表情アニメーションに最も一般的に使用されていますがそれだけではありません。

モーフターゲットを使ってみましょう。

これまで通りにデータセットごとにジオメトリを作成しますが、それぞれのデータから `position` 属性を抜き出してモーフターゲットとして使用します。

まず、`addBoxes` を変更してマージされたジオメトリを作成して返すだけにしてみましょう。

```js
-function addBoxes(file, hueRange) {
+function makeBoxes(file, hueRange) {
  const {min, max, data} = file;
  const range = max - min;
  
  ...

-  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
-      geometries, false);
-  const material = new THREE.MeshBasicMaterial({
-    vertexColors: THREE.VertexColors,
-  });
-  const mesh = new THREE.Mesh(mergedGeometry, material);
-  scene.add(mesh);
-  return mesh;
+  return BufferGeometryUtils.mergeBufferGeometries(
+     geometries, false);
}
```

There's one more thing we need to do here though. Morphtargets are required to
all have exactly the same number of vertices. Vertex #123 in one target needs
have a corresponding Vertex #123 in all other targets. But, as it is now
different data sets might have some data points with no data so no box will be
generated for that point which would mean no corresponding vertices for another
set. So, we need to check across all data sets and either always generate
something if there is data in any set or, generate nothing if there is data
missing in any set. Let's do the latter.

```js
+function dataMissingInAnySet(fileInfos, latNdx, lonNdx) {
+  for (const fileInfo of fileInfos) {
+    if (fileInfo.file.data[latNdx][lonNdx] === undefined) {
+      return true;
+    }
+  }
+  return false;
+}

-function makeBoxes(file, hueRange) {
+function makeBoxes(file, hueRange, fileInfos) {
  const {min, max, data} = file;
  const range = max - min;

  ...

  const geometries = [];
  data.forEach((row, latNdx) => {
    row.forEach((value, lonNdx) => {
+      if (dataMissingInAnySet(fileInfos, latNdx, lonNdx)) {
+        return;
+      }
      const amount = (value - min) / range;

  ...
```

Now we'll change the code that was calling `addBoxes` to use `makeBoxes`
and setup morphtargets

```js
+// make geometry for each data set
+const geometries = fileInfos.map((info) => {
+  return makeBoxes(info.file, info.hueRange, fileInfos);
+});
+
+// use the first geometry as the base
+// and add all the geometries as morphtargets
+const baseGeometry = geometries[0];
+baseGeometry.morphAttributes.position = geometries.map((geometry, ndx) => {
+  const attribute = geometry.getAttribute('position');
+  const name = `target${ndx}`;
+  attribute.name = name;
+  return attribute;
+});
+const material = new THREE.MeshBasicMaterial({
+  vertexColors: THREE.VertexColors,
+  morphTargets: true,
+});
+const mesh = new THREE.Mesh(baseGeometry, material);
+scene.add(mesh);

const uiElem = document.querySelector('#ui');
fileInfos.forEach((info) => {
-  const boxes = addBoxes(info.file, info.hueRange);
-  info.root = boxes;
  const div = document.createElement('div');
  info.elem = div;
  div.textContent = info.name;
  uiElem.appendChild(div);
  function show() {
    showFileInfo(fileInfos, info);
  }
  div.addEventListener('mouseover', show);
  div.addEventListener('touchstart', show);
});
// show the first set of data
showFileInfo(fileInfos, fileInfos[0]);
```

Above we make geometry for each data set, use the first one as the base,
then get a `position` attribute from each geometry and add it as
a morphtarget to the base geometry for `position`.

Now we need to change how we're showing and hiding the various data sets.
Instead of showing or hiding a mesh we need to change the influence of the
morphtargets. For the data set we want to see we need to have an influence of 1
and for all the ones we don't want to see to we need to have an influence of 0.

We could just set them to 0 or 1 directly but if we did that we wouldn't see any
animation, it would just snap which would be no different than what we already
have. We could also write some custom animation code which would be easy but
because the original webgl globe uses 
[an animation library](https://github.com/tweenjs/tween.js/) let's use the same one here.

We need to include the library

```js
import * as THREE from './resources/three/r119/build/three.module.js';
import {BufferGeometryUtils} from './resources/threejs/r119/examples/jsm/utils/BufferGeometryUtils.js';
import {OrbitControls} from './resources/threejs/r119/examples/jsm/controls/OrbitControls.js';
+import {TWEEN} from './resources/threejs/r119/examples/jsm/libs/tween.min.js';
```

And then create a `Tween` to animate the influences.

```js
// show the selected data, hide the rest
function showFileInfo(fileInfos, fileInfo) {
  fileInfos.forEach((info) => {
    const visible = fileInfo === info;
-    info.root.visible = visible;
    info.elem.className = visible ? 'selected' : '';
+    const targets = {};
+    fileInfos.forEach((info, i) => {
+      targets[i] = info === fileInfo ? 1 : 0;
+    });
+    const durationInMs = 1000;
+    new TWEEN.Tween(mesh.morphTargetInfluences)
+      .to(targets, durationInMs)
+      .start();
  });
  requestRenderIfNotRequested();
}
```

We're also suppose to call `TWEEN.update` every frame inside our render loop
but that points out a problem. "tween.js" is designed for continuous rendering
but we are [rendering on demand](threejs-rendering-on-demand.html). We could
switch to continuous rendering but it's sometimes nice to only render on demand
as it well stop using the user's power when nothing is happening
so let's see if we can make it animate on demand.

We'll make a `TweenManager` to help. We'll use it to create the `Tween`s and
track them. It will have an `update` method that will return `true`
if we need to call it again and `false` if all the animations are finished.

```js
class TweenManger {
  constructor() {
    this.numTweensRunning = 0;
  }
  _handleComplete() {
    --this.numTweensRunning;
    console.assert(this.numTweensRunning >= 0);
  }
  createTween(targetObject) {
    const self = this;
    ++this.numTweensRunning;
    let userCompleteFn = () => {};
    // create a new tween and install our own onComplete callback
    const tween = new TWEEN.Tween(targetObject).onComplete(function(...args) {
      self._handleComplete();
      userCompleteFn.call(this, ...args);
    });
    // replace the tween's onComplete function with our own
    // so we can call the user's callback if they supply one.
    tween.onComplete = (fn) => {
      userCompleteFn = fn;
      return tween;
    };
    return tween;
  }
  update() {
    TWEEN.update();
    return this.numTweensRunning > 0;
  }
}
```

To use it we'll create one 

```js
function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
+  const tweenManager = new TweenManger();

  ...
```

We'll use it to create our `Tween`s.

```js
// show the selected data, hide the rest
function showFileInfo(fileInfos, fileInfo) {
  fileInfos.forEach((info) => {
    const visible = fileInfo === info;
    info.elem.className = visible ? 'selected' : '';
    const targets = {};
    fileInfos.forEach((info, i) => {
      targets[i] = info === fileInfo ? 1 : 0;
    });
    const durationInMs = 1000;
-    new TWEEN.Tween(mesh.morphTargetInfluences)
+    tweenManager.createTween(mesh.morphTargetInfluences)
      .to(targets, durationInMs)
      .start();
  });
  requestRenderIfNotRequested();
}
```

Then we'll update our render loop to update the tweens and keep rendering
if there are still animations running.

```js
function render() {
  renderRequested = false;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

+  if (tweenManager.update()) {
+    requestRenderIfNotRequested();
+  }

  controls.update();
  renderer.render(scene, camera);
}
render();
```

And with that we should be animating between data sets.

{{{example url="../threejs-lots-of-objects-morphtargets.html" }}}

That seems to work but unfortunately we lost the colors.

Three.js does not support morphtarget colors and in fact this is an issue
with the original [webgl globe](https://github.com/dataarts/webgl-globe).
Basically it just makes colors for the first data set. Any other datasets
use the same colors even if they are vastly different.

Let's see if we can add support for morphing the colors. This might
be brittle. The least brittle way would probably be to 100% write our own
shaders but I think it would be useful to see how to modify the built
in shaders.

The first thing we need to do is make the code extract color a `BufferAttribute` from
each data set's geometry.

```js
// use the first geometry as the base
// and add all the geometries as morphtargets
const baseGeometry = geometries[0];
baseGeometry.morphAttributes.position = geometries.map((geometry, ndx) => {
  const attribute = geometry.getAttribute('position');
  const name = `target${ndx}`;
  attribute.name = name;
  return attribute;
});
+const colorAttributes = geometries.map((geometry, ndx) => {
+  const attribute = geometry.getAttribute('color');
+  const name = `morphColor${ndx}`;
+  attribute.name = `color${ndx}`;  // just for debugging
+  return {name, attribute};
+});
const material = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
  morphTargets: true,
});
```

We then need to modify the three.js shader. Three.js materials have an
`Material.onBeforeCompile` property we can assign a function. It gives us a
chance to modify the material's shader before it is passed to WebGL. In fact the
shader that is provided is actually a special three.js only syntax of shader
that lists a bunch of shader *chunks* that three.js will substitute with the
actual GLSL code for each chunk. Here is what the unmodified vertex shader code
looks like as passed to `onBeforeCompile`.

```glsl
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <skinbase_vertex>
	#ifdef USE_ENVMAP
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
```

Digging through the various chunks we want to replace
the [`morphtarget_pars_vertex` chunk](https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl.js)
the [`morphnormal_vertex` chunk](https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/morphnormal_vertex.glsl.js)
the [`morphtarget_vertex` chunk](https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js)
the [`color_pars_vertex` chunk](https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/color_pars_vertex.glsl.js)
and the [`color_vertex` chunk](https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/color_vertex.glsl.js)

To do that we'll make a simple array of replacements and apply them in `Material.onBeforeCompile`

```js
const material = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
  morphTargets: true,
});
+const vertexShaderReplacements = [
+  {
+    from: '#include <morphtarget_pars_vertex>',
+    to: `
+      uniform float morphTargetInfluences[8];
+    `,
+  },
+  {
+    from: '#include <morphnormal_vertex>',
+    to: `
+    `,
+  },
+  {
+    from: '#include <morphtarget_vertex>',
+    to: `
+      transformed += (morphTarget0 - position) * morphTargetInfluences[0];
+      transformed += (morphTarget1 - position) * morphTargetInfluences[1];
+      transformed += (morphTarget2 - position) * morphTargetInfluences[2];
+      transformed += (morphTarget3 - position) * morphTargetInfluences[3];
+    `,
+  },
+  {
+    from: '#include <color_pars_vertex>',
+    to: `
+      varying vec3 vColor;
+      attribute vec3 morphColor0;
+      attribute vec3 morphColor1;
+      attribute vec3 morphColor2;
+      attribute vec3 morphColor3;
+    `,
+  },
+  {
+    from: '#include <color_vertex>',
+    to: `
+      vColor.xyz = morphColor0 * morphTargetInfluences[0] +
+                   morphColor1 * morphTargetInfluences[1] +
+                   morphColor2 * morphTargetInfluences[2] +
+                   morphColor3 * morphTargetInfluences[3];
+    `,
+  },
+];
+material.onBeforeCompile = (shader) => {
+  vertexShaderReplacements.forEach((rep) => {
+    shader.vertexShader = shader.vertexShader.replace(rep.from, rep.to);
+  });
+};
```

Three.js also sorts morphtargets and applies only the highest influences. This
lets it allow many more morphtargets as long as only a few are used at a time.
Unfortunately three.js does not provide any way to know how many morph targets
will be used nor which attributes the morph targets will be assigned to. So,
we'll have to look into the code and reproduce what it does here. If that
algorithm changes in three.js we'll need to refactor this code.

First we remove all the color attributes. It doesn't matter if we did not add
them before as it's safe to remove an attribute that was not previously added.
Then we'll compute which targets we think three.js will use and finally assign
those targets to the attributes we think three.js would assign them to.

```js

const mesh = new THREE.Mesh(baseGeometry, material);
scene.add(mesh);

+function updateMorphTargets() {
+  // remove all the color attributes
+  for (const {name} of colorAttributes) {
+    baseGeometry.deleteAttribute(name);
+  }
+
+  // three.js provides no way to query this so we have to guess and hope it doesn't change.
+  const maxInfluences = 8;
+
+  // three provides no way to query which morph targets it will use
+  // nor which attributes it will assign them to so we'll guess.
+  // If the algorithm in three.js changes we'll need to refactor this.
+  mesh.morphTargetInfluences
+    .map((influence, i) => [i, influence])            // map indices to influence
+    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))  // sort by highest influence first
+    .slice(0, maxInfluences)                          // keep only top influences
+    .sort((a, b) => a[0] - b[0])                      // sort by index
+    .filter(a => !!a[1])                              // remove no influence entries
+    .forEach(([ndx], i) => {                          // assign the attributes
+      const name = `morphColor${i}`;
+      baseGeometry.setAttribute(name, colorAttributes[ndx].attribute);
+    });
+}
```

We'll return this function from our `loadAll` function. This way we don't
need to leak any variables.

```js
async function loadAll() {
  ...

+  return updateMorphTargets;
}

+// use a no-op update function until the data is ready
+let updateMorphTargets = () => {};
-loadAll();
+loadAll().then(fn => {
+  updateMorphTargets = fn;
+});
```

And finally we need to call `updateMorphTargets` after we've let the values
be updated by the tween manager and before rendering.

```js
function render() {

  ...

  if (tweenManager.update()) {
    requestRenderIfNotRequested();
  }

+  updateMorphTargets();

  controls.update();
  renderer.render(scene, camera);
}
```

And with that we should have the colors animating as well as the boxes.

{{{example url="../threejs-lots-of-objects-morphtargets-w-colors.html" }}}

I hope going through this was helpful. Using morphtargets either through the
services three.js provides or by writing custom shaders is a common technique to
move lots of objects. As an example we could give every cube a random place in
another target and morph from that to their first positions on the globe. That
might be a cool way to introduce the globe.

Next you might be interested in adding labels to a globe which is covered
in [Aligning HTML Elements to 3D](threejs-align-html-elements-to-3d.html).

Note: We could try to just graph percent of men or percent of women or the raw
difference but based on how we are displaying the info, cubes that grow from the
surface of the earth, we'd prefer most cubes to be low. If we used one of these
other comparisons most cubes would be about 1/2 their maximum height which would
not make a good visualization. Feel free to change the `amountGreaterThan` from
`Math.max(a - b, 0)` to something like `(a - b)` "raw difference" or `a / (a +
b)` "percent" and you'll see what I mean.

