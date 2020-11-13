Title: Three.jsの3DLUTポストプロセス
Description: Three.jsでの3DLUTポストプロセスのやり方
TOC: エフェクトにLUTファイルを適用する

前回の記事では[ポストプロセス](threejs-post-processing.html)の説明をしました。
一般的なポストプロセスの方法の1つにLUTや3DLUTと呼ばれるものがあります。
LUTはLookUp Tableの略です。したがって、3DLUTは3次元ルックアップテーブルです。

どのように機能するかというと色の立方体を作る事です。
次にソースとなる画像の色を使用し、立方体にインデックスを作成します。
元の画像の各ピクセルについて、元のピクセルの赤、緑、青の色に基づいて立方体の位置を調べます。
3DLUTから引き出す値が新色になります。

Javascriptでは、次のようにします。
色が0から255までの整数で指定されていて、サイズが256 x 256 x 256の大きな3次元配列があると想像して下さい。
その後、ルックアップテーブルを介して色を変換します。

    const newColor = lut[origColor.red][origColor.green][origColor.bue]

もちろん、256 x 256 x 256 x 256の配列はかなり大きくなりますが、[テクスチャの記事](threejs-textures.html)で指摘したようにテクスチャは0の値から参照されます。
テクスチャの寸法に関係なく、0～1.0の値になります。

8 × 8 × 8 × 8の立方体を想像してみましょう。

<div class="threejs_center"><img src="resources/images/3dlut-rgb.svg" class="noinvertdark" style="width: 500px"></div>

最初に0, 0, 0のコーナーは真っ黒で、反対の1, 1, 1, 1のコーナーは真っ白なので角を埋めるかもしれません。
1, 0, 0は純粋な<span style="color:red;">赤</span>です。
0, 1, 0は純粋な<span style="color:green;">緑</span>で、0, 0, 1は<span style="color:blue;">青</span>です。

<div class="threejs_center"><img src="resources/images/3dlut-axis.svg" class="noinvertdark" style="width: 500px"></div>

各軸の下に色を入れていきます。

<div class="threejs_center"><img src="resources/images/3dlut-edges.svg" class="noinvertdark" style="width: 500px"></div>

2チャンネル以上を使用するエッジの色です。

<div class="threejs_center"><img src="resources/images/3dlut-standard.svg" class="noinvertdark" style="width: 500px"></div>

最後にその間にある色を全て埋めます。
これは"アイデンティティ"の3DLUTです。入力と全く同じ出力を生成します。
調べれば同じ色が出てきます。

<div class="threejs_center"><object type="image/svg+xml" data="resources/images/3dlut-standard-lookup.svg" class="noinvertdark" data-diagram="lookup" style="width: 600px"></object></div>

キューブを琥珀色に変更して色を調べると3Dルックアップテーブルの同じ場所を調べますが、異なる出力が得られます。

<div class="threejs_center"><object type="image/svg+xml" data="resources/images/3dlut-amber-lookup.svg" class="noinvertdark" data-diagram="lookup" style="width: 600px"></object></div>

別のルックアップテーブルを提供して、この技術を使用すると全ての種類の効果を適用する事ができます。
基本的には単一のカラー入力のみに基づいて計算できるエフェクトです。
これらのエフェクトには色相、コントラスト、彩度、カラーキャスト、色合い、明るさ、露出、レベル、カーブ、ポスタライズ、シャドウ、ハイライト、その他多くの調整が含まれます。
さらに優れているのはそれらを全て1つのルックアップテーブルにまとめられます。

これを使用するには、適用するシーンが必要です。
ざっくりとしたシーンをまとめてみましょう。
まずは[glTFを読み込む記事](threejs-load-gltf.html)で取り上げたようにglTFファイルを表示する所から始めてみます。
載せているモデルは[氷の狼](https://sketchfab.com/sarath.irn.kat005)の[このモデル](https://sketchfab.com/models/a1d315908e9f45e5a3bc618bdfd2e7ee)です。
ライトを使わないので外しました。

[背景とスカイボックス](threejs-backgrounds.html)で説明したような背景画像も入れていきます。

{{{example url="../threejs-postprocessing-3dlut-prep.html" }}}

シーンがあるので3DLUTが必要です。
最も単純な3DLUTは、2 x 2 x 2 x 2のアイデンティティーLUTで、*アイデンティティー*は何も起こらない事を意味します。
それは1を掛けるようなもので、LUT内の各色を同じ色にマップしているにも関わらず、1を掛けたり何もしなかったりしているようなものです。

<div class="threejs_center"><img src="resources/images/3dlut-standard-2x2.svg" class="noinvertdark" style="width: 200px"></div>

WebGL1は3Dテクスチャをサポートしていないので、4 x 2の2Dテクスチャを使用し、立方体の各スライスがテクスチャ全体に水平に広がっているカスタムシェーダ内で3Dテクスチャとして扱います。

アイデンティティLUTに必要な色で4 x 2の2Dテクスチャを作るコードです。

```js
const makeIdentityLutTexture = function() {
  const identityLUT = new Uint8Array([
      0,   0,   0, 255,  // black
    255,   0,   0, 255,  // red
      0,   0, 255, 255,  // blue
    255,   0, 255, 255,  // magenta
      0, 255,   0, 255,  // green
    255, 255,   0, 255,  // yellow
      0, 255, 255, 255,  // cyan
    255, 255, 255, 255,  // white
  ]);

  return function(filter) {
    const texture = new THREE.DataTexture(identityLUT, 4, 2, THREE.RGBAFormat);
    texture.minFilter = filter;
    texture.magFilter = filter;
    texture.needsUpdate = true;
    texture.flipY = false;
    return texture;
  };
}();
```

フィルターをかけたもの、かけていないものの2つを作ってみましょう。

```js
const lutTextures = [
  { name: 'identity', size: 2, texture: makeIdentityLutTexture(THREE.LinearFilter) },
  { name: 'identity not filtered', size: 2, texture: makeIdentityLutTexture(THREE.NearestFilter) },
];
```

[ポストプロセスの記事](threejs-post-processing.html)のカスタムシェーダを使った例を参考の代わりに2つのカスタムシェーダーを使ってみましょう。

```js
const lutShader = {
  uniforms: {
    tDiffuse: { value: null },
    lutMap:  { value: null },
    lutMapSize: { value: 1, },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    #include <common>

    #define FILTER_LUT true

    uniform sampler2D tDiffuse;
    uniform sampler2D lutMap;
    uniform float lutMapSize;

    varying vec2 vUv;

    vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
      float sliceSize = 1.0 / size;                  // space of 1 slice
      float slicePixelSize = sliceSize / size;       // space of 1 pixel
      float width = size - 1.0;
      float sliceInnerSize = slicePixelSize * width; // space of size pixels
      float zSlice0 = floor( texCoord.z * width);
      float zSlice1 = min( zSlice0 + 1.0, width);
      float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
      float yRange = (texCoord.y * width + 0.5) / size;
      float s0 = xOffset + (zSlice0 * sliceSize);

      #ifdef FILTER_LUT

        float s1 = xOffset + (zSlice1 * sliceSize);
        vec4 slice0Color = texture2D(tex, vec2(s0, yRange));
        vec4 slice1Color = texture2D(tex, vec2(s1, yRange));
        float zOffset = mod(texCoord.z * width, 1.0);
        return mix(slice0Color, slice1Color, zOffset);

      #else

        return texture2D(tex, vec2( s0, yRange));

      #endif
    }

    void main() {
      vec4 originalColor = texture2D(tDiffuse, vUv);
      gl_FragColor = sampleAs3DTexture(lutMap, originalColor.xyz, lutMapSize);
    }
  `,
};

const lutNearestShader = {
  uniforms: {...lutShader.uniforms},
  vertexShader: lutShader.vertexShader,
  fragmentShader: lutShader.fragmentShader.replace('#define FILTER_LUT', '//'),
};
```

フラグメントシェーダーの中に次のような行があるのが分かります。

```glsl
#define FILTER_LUT true
```

2番目のシェーダーを生成するためにその行をコメントアウトします。

それらを使用して2つのカスタムエフェクトを作成します。

```js
const effectLUT = new THREE.ShaderPass(lutShader);
effectLUT.renderToScreen = true;
const effectLUTNearest = new THREE.ShaderPass(lutNearestShader);
effectLUTNearest.renderToScreen = true;
```

背景を別のシーンとして描画する既存のコードを変換し、glTFを描画するシーンと背景を描画するシーンの両方に `RenderPass` を適用します。

```js
const renderModel = new THREE.RenderPass(scene, camera);
renderModel.clear = false;  // so we don't clear out the background
const renderBG = new THREE.RenderPass(sceneBG, cameraBG);
```

全てのパスを使用するように `EffectComposer` を設定する事ができます。

```js
const rtParameters = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBFormat,
};
const composer = new THREE.EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, rtParameters));

composer.addPass(renderBG);
composer.addPass(renderModel);
composer.addPass(effectLUT);
composer.addPass(effectLUTNearest);
```

LUTを選択するためのGUIコードを作ってみましょう。

```js
const lutNameIndexMap = {};
lutTextures.forEach((info, ndx) => {
  lutNameIndexMap[info.name] = ndx;
});

const lutSettings = {
  lut: lutNameIndexMap.identity,
};
const gui = new GUI({ width: 300 });
gui.add(lutSettings, 'lut', lutNameIndexMap);
```

最後にフィルタリングするかに応じてエフェクトをオンにし、選択したテクスチャを使用するようにエフェクトを設定して、`EffectComposer` を通してレンダリングします。

```js
const lutInfo = lutTextures[lutSettings.lut];

const effect = lutInfo.filter ? effectLUT : effectLUTNearest;
effectLUT.enabled = lutInfo.filter;
effectLUTNearest.enabled = !lutInfo.filter;

const lutTexture = lutInfo.texture;
effect.uniforms.lutMap.value = lutTexture;
effect.uniforms.lutMapSize.value = lutInfo.size;

composer.render(delta);
```

それが3DLUTのアイデンティティである事を考えると何も変わりません。

{{{example url="../threejs-postprocessing-3dlut-identity.html" }}}

しかし、フィルタリングされていないLUTを選択するとより興味深いものが得られます。

<div class="threejs_center"><img src="resources/images/unfiltered-3dlut.jpg" style="width: 500px"></div>

なぜこのようなことが起こるのでしょうか？
フィルタリングをオンにするとGPUは色の間を直線的に補間するからです。
フィルタリングをオフにすると補間を行わないので、3DLUT内の色を検索しても3DLUT内の正確な色のうちの1つしか得られません。

もっと面白い3DLUTを作るにはどうすれば良いでしょうか？

まず、必要なテーブルの解像度を決定し、簡単なスクリプトを使用してルックアップ・キューブのスライスを生成します。

```js
const ctx = document.querySelector('canvas').getContext('2d');

function drawColorCubeImage(ctx, size) {
  const canvas = ctx.canvas;
  canvas.width = size * size;
  canvas.height = size;

  for (let zz = 0; zz < size; ++zz) {
    for (let yy = 0; yy < size; ++yy) {
      for (let xx = 0; xx < size; ++xx) {
        const r = Math.floor(xx / (size - 1) * 255);
        const g = Math.floor(yy / (size - 1) * 255);
        const b = Math.floor(zz / (size - 1) * 255);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(zz * size + xx, yy, 1, 1);
      }
    }
  }
  document.querySelector('#width').textContent = canvas.width;
  document.querySelector('#height').textContent = canvas.height;
}

drawColorCubeImage(ctx, 8);
```

キャンバスが必要です。

```html
<canvas></canvas>
```

これで任意のサイズのアイデンティティー3Dルックアップテーブルを生成する事ができます。

{{{example url="../3dlut-base-cube-maker.html" }}}

解像度が大きいほど微調整が可能ですが、データの立方体であるため必要なサイズはすぐに大きくなります。
サイズ8のキューブでは2kしか必要ありませんが、サイズ64のキューブでは1MBが必要です。
したがって、あなたが望む効果を再現する最小のものを使用して下さい。

サイズを16に設定し保存をクリックするとこのようなファイルができあがります。

<div class="threejs_center"><img src="resources/images/identity-lut-s16.png"></div>

また、LUTを適用したいもののイメージをキャプチャする必要があります。
通常は上のシーンを右クリックして "名前を付けて保存... "を選択する事ができますが、`OrbitControls` がOSによっては右クリックを妨げているかもしれない事に注意して下さい。
私の場合は、スクリーンショットを取得するためにOSのスクリーンキャプチャ機能を使用しています。

<div class="threejs_center"><img src="resources/images/3dlut-screen-capture.jpg" style="width: 600px"></div>

次に画像エディタ（私の場合はPhotoshop）でサンプル画像を読み込み、左上隅に3DLUTを貼り付けます。

> メモ: 最初にPhotoshop上でLUTファイルをドラッグ＆ドロップしてみましたが、上手くいきませんでした。
> Photoshopで画像を2倍にしてしまいました。
> DPIか何かに合わせようとしているのだろう。
> LUTファイルを個別に読み込み、コピーしてスクリーンキャプチャに貼り付けると上手くいきました。

<div class="threejs_center"><img src="resources/images/3dlut-photoshop-before.jpg" style="width: 600px"></div>

次にカラーベースのフルイメージ調整を使って画像を調整します。
Photoshopの場合、使用できる調整のほとんどは画像 → 調整メニューにあります。

<div class="threejs_center"><img src="resources/images/3dlut-photoshop-after.jpg" style="width: 600px"></div>

好みに合わせて画像を調整後、左上に配置した3DLUTスライスにも同じ調整が適用されているのが分かります。

分かったけど、どうやって使うのでしょうか？

最初にpngを`3dlut-red-only-s16.png`として保存しました。
メモリを節約するために、LUTテーブルの16 x 256の左上隅だけにトリミングできましたが、楽しむためにロード後にトリミングしておきます。
この方法の良い点はpngファイルを見るだけで、LUTの効果をある程度把握できます。
悪い点はもちろん帯域幅を無駄にしてしまいます。

ロードするためのコードです。
このコードはテクスチャをすぐに使用できるようにアイデンティティLUTから始まります。
次に画像をロードし3DLUT部分だけをキャンバスにコピーします。
キャンバスからデータを取得してテクスチャに設定し、`needsUpdate` をtrueに設定してThree.jsに新しいデータを取得させます。

```js
const makeLUTTexture = function() {
  const imgLoader = new THREE.ImageLoader();
  const ctx = document.createElement('canvas').getContext('2d');

  return function(info) {
    const texture = makeIdentityLutTexture(
        info.filter ? THREE.LinearFilter : THREE.NearestFilter);

    if (info.url) {
      const lutSize = info.size;

      // set the size to 2 (the identity size). We'll restore it when the
      // image has loaded. This way the code using the lut doesn't have to
      // care if the image has loaded or not
      info.size = 2;

      imgLoader.load(info.url, function(image) {
        const width = lutSize * lutSize;
        const height = lutSize;
        info.size = lutSize;
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);

        texture.image.data = new Uint8Array(imageData.data.buffer);
        texture.image.width = width;
        texture.image.height = height;
        texture.needsUpdate = true;
      });
    }

    return texture;
  };
}();
```

先ほど作成したLUTのpngを読み込むのに使ってみましょう。

```js
const lutTextures = [
  { name: 'identity',           size: 2, filter: true , },
  { name: 'identity no filter', size: 2, filter: false, },
+  { name: 'custom',          url: 'resources/images/lut/3dlut-red-only-s16.png' },
];

+lutTextures.forEach((info) => {
+  // if not size set get it from the filename
+  if (!info.size) {
+    // assumes filename ends in '-s<num>[n]'
+    // where <num> is the size of the 3DLUT cube
+    // and [n] means 'no filtering' or 'nearest'
+    //
+    // examples:
+    //    'foo-s16.png' = size:16, filter: true
+    //    'bar-s8n.png' = size:8, filter: false
+    const m = /-s(\d+)(n*)\.[^.]+$/.exec(info.url);
+    if (m) {
+      info.size = parseInt(m[1]);
+      info.filter = info.filter === undefined ? m[2] !== 'n' : info.filter;
+    }
+  }
+
+  info.texture = makeLUTTexture(info);
+});
```

上の図ではLUTのサイズをファイル名の最後にエンコードしているのが分かります。
これでLUTをpngとして渡すのが簡単になります。

今のうちに、既存のLUTのpngファイルをたくさん追加しておきましょう。

```js
const lutTextures = [
  { name: 'identity',           size: 2, filter: true , },
  { name: 'identity no filter', size: 2, filter: false, },
  { name: 'custom',          url: 'resources/images/lut/3dlut-red-only-s16.png' },
+  { name: 'monochrome',      url: 'resources/images/lut/monochrome-s8.png' },
+  { name: 'sepia',           url: 'resources/images/lut/sepia-s8.png' },
+  { name: 'saturated',       url: 'resources/images/lut/saturated-s8.png', },
+  { name: 'posterize',       url: 'resources/images/lut/posterize-s8n.png', },
+  { name: 'posterize-3-rgb', url: 'resources/images/lut/posterize-3-rgb-s8n.png', },
+  { name: 'posterize-3-lab', url: 'resources/images/lut/posterize-3-lab-s8n.png', },
+  { name: 'posterize-4-lab', url: 'resources/images/lut/posterize-4-lab-s8n.png', },
+  { name: 'posterize-more',  url: 'resources/images/lut/posterize-more-s8n.png', },
+  { name: 'inverse',         url: 'resources/images/lut/inverse-s8.png', },
+  { name: 'color negative',  url: 'resources/images/lut/color-negative-s8.png', },
+  { name: 'high contrast',   url: 'resources/images/lut/high-contrast-bw-s8.png', },
+  { name: 'funky contrast',  url: 'resources/images/lut/funky-contrast-s8.png', },
+  { name: 'nightvision',     url: 'resources/images/lut/nightvision-s8.png', },
+  { name: 'thermal',         url: 'resources/images/lut/thermal-s8.png', },
+  { name: 'b/w',             url: 'resources/images/lut/black-white-s8n.png', },
+  { name: 'hue +60',         url: 'resources/images/lut/hue-plus-60-s8.png', },
+  { name: 'hue +180',        url: 'resources/images/lut/hue-plus-180-s8.png', },
+  { name: 'hue -60',         url: 'resources/images/lut/hue-minus-60-s8.png', },
+  { name: 'red to cyan',     url: 'resources/images/lut/red-to-cyan-s8.png' },
+  { name: 'blues',           url: 'resources/images/lut/blues-s8.png' },
+  { name: 'infrared',        url: 'resources/images/lut/infrared-s8.png' },
+  { name: 'radioactive',     url: 'resources/images/lut/radioactive-s8.png' },
+  { name: 'goolgey',         url: 'resources/images/lut/googley-s8.png' },
+  { name: 'bgy',             url: 'resources/images/lut/bgy-s8.png' },
];
```

そして、ここにはたくさんのLUTがあります。

{{{example url="../threejs-postprocessing-3dlut.html" }}}

最後にもう1つ、ちょっとした楽しい事としてAdobeが定義した標準LUTフォーマットがあることが分かりました。
[ネットで検索するとたくさんのLUTファイル](https://www.google.com/search?q=lut+files)が見つかります。

クイックローダーを書いてみました。
残念ながらフォーマットのバリエーションは4つありますが、私は1つのバリエーションの例しか見つけられなかったので、全てのバリエーションが動作するかどうかを簡単にテストする事はできませんでした。

クイックドラッグ＆ドロップライブラリも書いています。
両方を使って、Adobe LUTファイルをドラッグ＆ドロップして効果を確認できるようにしてみましょう。

まず2つのライブラリが必要です。

```js
import * as lutParser from './resources/lut-reader.js';
import * as dragAndDrop from './resources/drag-and-drop.js';
```

そして次のように使用する事ができます。

```js
dragAndDrop.setup({msg: 'Drop LUT File here'});
dragAndDrop.onDropFile(readLUTFile);

function ext(s) {
  const period = s.lastIndexOf('.');
  return s.substr(period + 1);
}

function readLUTFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const type = ext(file.name);
    const lut = lutParser.lutTo2D3Drgb8(lutParser.parse(e.target.result, type));
    const {size, data, name} = lut;
    const texture = new THREE.DataTexture(data, size * size, size, THREE.RGBFormat);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    texture.flipY = false;
    const lutTexture = {
      name: (name && name.toLowerCase().trim() !== 'untitled')
          ? name
          : file.name,
      size: size,
      filter: true,
      texture,
    };
    lutTextures.push(lutTexture);
    lutSettings.lut = lutTextures.length - 1;
    updateGUI();
  };

  reader.readAsText(file);
}
```

新しいファイルを含むようにGUIを更新する必要があります。

```js
const lutSettings = {
  lut: lutNameIndexMap.thermal,
};
const gui = new GUI({ width: 300 });
gui.addFolder('Choose LUT or Drag&Drop LUT File(s)');

let lutGUI;
function updateGUI() {
  makeLutNameIndexMap();
  if (lutGUI) {
    gui.remove(lutGUI);
  }
  lutGUI = gui.add(lutSettings, 'lut', lutNameIndexMap);
}
updateGUI();
```

[Adobe LUTをダウンロード](https://www.google.com/search?q=lut+files)して、下の例の上にドラッグ＆ドロップする事ができるはずです。

{{{example url="../threejs-postprocessing-3dlut-w-loader.html" }}}

Adobe LUTはオンラインでの使用を想定して設計されていません。
これらは大きなファイルです。
下のサンプルの上にドラッグ＆ドロップしてサイズを選択し、"Save... "をクリックする事でより小さなファイルに変換し、当社のPNG形式で保存できます。

以下のサンプルは、上記のコードを改造したものです。
背景絵を描くだけでglTFファイルはありません。

この画像は、上記のスクリプトから作成されたID LUT画像です。
次に読み込まれたLUTファイルを適用するためにエフェクトを使用しているので、結果はLUTファイルをPNGとして再現するために必要な画像になります。

{{{example url="../threejs-postprocessing-adobe-lut-to-png-converter.html" }}}

1つはシェーダ自体がどのように動作するかという事です。
上手くいけば将来的にはもう少しGLSLをカバーできると思います。
今の所は興味があれば[ポストプロセスの記事](threejs-post-processing.html)のリンクをたどったり[この動画を見て下さい](https://www.youtube.com/watch?v=rfQ8rKGTVlg#t=24m30s)。

完全にスキップされているのはシェーダー自体がどのように動作するかです。
願わくば今後もう少しGLSLをカバーできるといいですね。
とりあえず気になる方は[ポストプロセスの記事](threejs-post-processing.html)のリンクをたどってみて下さい。

<script type="module" src="resources/threejs-post-processing-3dlut.js"></script>
