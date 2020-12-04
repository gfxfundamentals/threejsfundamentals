Title: Three.jsの霧
Description: Three.jsでの霧
TOC: 霧

この記事はThree.jsの連載記事の1つです。
最初の記事は[Three.jsの基礎知識](threejs-fundamentals.html)です。
まだ読んでいない場合、そこから始めると良いかもしれません。
カメラについて読んだ事がない方は、まずは[この記事]threejs-cameras.html)を読んで見て下さい。

3Dエンジンでの霧は、一般的にカメラからの距離によって特定の色にフェードアウトする方法です。
three.jsでは、`Fog` または `FogExp2` オブジェクトを作成し、シーンの[`fog`](Scene.fog) プロパティに設定する事で霧を追加します。

`Fog` はカメラからの距離を表す `near` と `far` の設定を選択できます。
`near` よりも近いものは霧の影響を受けません。
それ以上の `far` は完全に霧の色です。
`near` と `far` の中間は、マテリアルカラーから霧の色に色があせていきます。

また、カメラからの距離で指数関数的に成長する `FogExp2` もあります。

どちらのタイプの霧も使用するには霧を作成してシーンに割り当てます。

```js
const scene = new THREE.Scene();
{
  const color = 0xFFFFFF;  // white
  const near = 10;
  const far = 100;
  scene.fog = new THREE.Fog(color, near, far);
}
```

また、 `FogExp2` の場合は次のようになります。

```js
const scene = new THREE.Scene();
{
  const color = 0xFFFFFF;
  const density = 0.1;
  scene.fog = new THREE.FogExp2(color, density);
}
```

`FogExp2` は現実に近いですが、`Fog` の方が一般的に使われています。
Fogは霧を適用する場所を選択できるので、ある距離まではクリアなシーンを表示し、その距離を過ぎるとフェードアウトして色をつけられます。

<div class="spread">
  <div>
    <div data-diagram="fog" style="height: 300px;"></div>
    <div class="code">THREE.Fog</div>
  </div>
  <div>
    <div data-diagram="fogExp2" style="height: 300px;"></div>
    <div class="code">THREE.FogExp2</div>
  </div>
</div>

ここで注意すべき事は、霧は *レンダリングされる* ものに適用されます。
オブジェクトの色の各ピクセルの計算の一部です。
つまり、シーンを特定の色にフェードさせたい場合、霧 **と** 背景色を同じ色に設定する必要があります。
背景色は [`scene.background`](Scene.background)プロパティを使って設定します。
背景色を選択するには `THREE.Color` を指定します。例えば

```js
scene.background = new THREE.Color('#F00');  // red
```

<div class="spread">
  <div>
    <div data-diagram="fogBlueBackgroundRed" style="height: 300px;" class="border"></div>
    <div class="code">fog blue, background red</div>
  </div>
  <div>
    <div data-diagram="fogBlueBackgroundBlue" style="height: 300px;" class="border"></div>
    <div class="code">fog blue, background blue</div>
  </div>
</div>

以下は霧を追加した例です。
追加したのはシーンを設定した直後に霧を追加し、シーンの背景色を設定しました。

```js
const scene = new THREE.Scene();

+{
+  const near = 1;
+  const far = 2;
+  const color = 'lightblue';
+  scene.fog = new THREE.Fog(color, near, far);
+  scene.background = new THREE.Color(color);
+}
```

以下の例ではカメラの `near` は 0.1、`far` は 5です。
カメラは `z = 2` にあります。
立方体は1単位の大きさで z = 0 です。
つまり、霧は `near = 1` と `far = 2` にすると、立方体の中心付近でフェードアウトします。

{{{example url="../threejs-fog.html" }}}

インターフェースを追加し、霧を調整できるようにしてみましょう。
ここでも[dat.GUI](https://github.com/dataarts/dat.gui)を使用します。
dat.GUIはオブジェクトとプロパティを受け取り、そのタイプのプロパティのためのインタフェースを自動生成します。
単純な霧の `near` と `far` プロパティを操作できるようにすれば良いのですが、
`near` を `far` より大きくするのは無効です。
dat.GUI で `near` と `far` プロパティを操作できるようにヘルパーを作成しましょう。

```js
// We use this class to pass to dat.gui
// so when it manipulates near or far
// near is never > far and far is never < near
class FogGUIHelper {
  constructor(fog) {
    this.fog = fog;
  }
  get near() {
    return this.fog.near;
  }
  set near(v) {
    this.fog.near = v;
    this.fog.far = Math.max(this.fog.far, v);
  }
  get far() {
    return this.fog.far;
  }
  set far(v) {
    this.fog.far = v;
    this.fog.near = Math.min(this.fog.near, v);
  }
}
```

次のように追加できます。

```js
{
  const near = 1;
  const far = 2;
  const color = 'lightblue';
  scene.fog = new THREE.Fog(color, near, far);
  scene.background = new THREE.Color(color);
+
+  const fogGUIHelper = new FogGUIHelper(scene.fog);
+  gui.add(fogGUIHelper, 'near', near, far).listen();
+  gui.add(fogGUIHelper, 'far', near, far).listen();
}
```

`near` と `far` のパラメーターは、霧を調整するための最小値と最大値を設定します。
カメラのセットアップ時に設定します。

最後の2行の `.listen()` はdat.GUIに変更し、 *listen* するようにします。
編集のために `near` を `far` に変更時にdat.GUIが他のプロパティのUIを更新してくれます。

また、霧の色を変更できるのはいいかもしれませんが、好きでした。
上記で述べたように、霧の色と背景色の両方を同期させる必要があります。
dat.GUIが操作時に両方の色を設定するための *virtual* プロパティをヘルパーに追加してみましょう。

dat.GUIではCSSの6桁の16進数文字列(例: `#112233`)で、4つの方法で色を操作できます。
色相、彩度、値、オブジェクトは (例: `{h: 60, s: 1, v: }`)です。
RGB配列として (例: `[255, 128, 64]`)。または、RGBA配列（例：`[127, 200, 75, 0.3]`） です。

dat.GUIが単一の値を操作するので、16進文字列バージョンを使うのが1番簡単です。
幸運な事に `THREE.Color` を [`getHexString`](Color.getHexString) として使用でき、文字列を簡単に取得できます。

```js
// We use this class to pass to dat.gui
// so when it manipulates near or far
// near is never > far and far is never < near
+// Also when dat.gui manipulates color we'll
+// update both the fog and background colors.
class FogGUIHelper {
*  constructor(fog, backgroundColor) {
    this.fog = fog;
+    this.backgroundColor = backgroundColor;
  }
  get near() {
    return this.fog.near;
  }
  set near(v) {
    this.fog.near = v;
    this.fog.far = Math.max(this.fog.far, v);
  }
  get far() {
    return this.fog.far;
  }
  set far(v) {
    this.fog.far = v;
    this.fog.near = Math.min(this.fog.near, v);
  }
+  get color() {
+    return `#${this.fog.color.getHexString()}`;
+  }
+  set color(hexString) {
+    this.fog.color.set(hexString);
+    this.backgroundColor.set(hexString);
+  }
}
```

次に `gui.addColor` を呼び出し、ヘルパーのvirtualプロパティに色のUIを追加します。

```js
{
  const near = 1;
  const far = 2;
  const color = 'lightblue';
  scene.fog = new THREE.Fog(color, near, far);
  scene.background = new THREE.Color(color);

*  const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
  gui.add(fogGUIHelper, 'near', near, far).listen();
  gui.add(fogGUIHelper, 'far', near, far).listen();
+  gui.addColor(fogGUIHelper, 'color');
}
```

{{{example url="../threejs-fog-gui.html" }}}

`near` を1.9にし、`far` を2.0に設定すると以下のようになります。
曇っていない状態と完全に曇っている状態との中間で非常にシャープな遷移をしています。
ここで `near` = 1.1 と `far` = 2.9 はほぼ同じになるはずです。
最も滑らかなキューブはカメラから2ユニット離れて回転しています。

最後にもう1つ、レンダリングされたオブジェクトがマテリアル上にあるかはブーリアンの[`fog`](Material.fog)プロパティがあります。
そのマテリアルを使用している場合は、霧の影響を受けます。
ほとんどのマテリアルのデフォルトは `true` です。
霧を消したい理由として、運転席やコックピットからの眺めで3Dビークルシミュレータを作っている事を想像してみて下さい。
車内から見るとkは、車内の全てのものに霧を外しておきたいと思うでしょう。

良い例としては、家の外に家と濃い霧が出ている事が挙げられるかもしれません。
例えば、霧が2m先（近＝2）から始まり、4m先（遠＝4）で完全に霧が出るとします。
部屋の長さは2メートル以上、家の長さは4メートル以上あると思われるので、家の中に霧がかからないように家の中の素材を設定しておかないと、家の中に立っているときに部屋の奥の壁の外を見たときに、霧の中にいるように見えてしまいます。

<div class="spread">
  <div>
    <div data-diagram="fogHouseAll" style="height: 300px;" class="border"></div>
    <div class="code">fog: true, all</div>
  </div>
</div>

部屋の奥の壁と天井に霧がかかっています。
家のマテリアルの霧をオフにし、その問題を解決できます。

<div class="spread">
  <div>
    <div data-diagram="fogHouseInsideNoFog" style="height: 300px;" class="border"></div>
    <div class="code">fog: true, only outside materials</div>
  </div>
</div>

<canvas id="c"></canvas>
<script type="module" src="resources/threejs-fog.js"></script>
