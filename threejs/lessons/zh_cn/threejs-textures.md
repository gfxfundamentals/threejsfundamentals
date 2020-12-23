Title: Three.js 纹理
Description: 在three.js中使用纹理
TOC: 纹理

本文是关于 three.js 系列文章的一部分。第一篇文章是 [three.js 基础](threejs-fundamentals.html)。上一篇[文章](threejs-setup.html)是关于本文的环境搭建。如果你还没有读过它，建议先从那里开始。

纹理是Three.js中的一种大话题，我还不能100%地确定在什么层面上解释它们，但我会试着去做它。这里面有很多主题，而且很多主题是相互关联的，所以很难一下子解释清楚。下面是本文的快速目录。

<ul>
<li><a href="#hello">你好，纹理</a></li>
<li><a href="#six">6种纹理，在立方体的每个面上都有不同的纹理。</a></li>
<li><a href="#loading">加载纹理</a></li>
<ul>
  <li><a href="#easy">简单的方法</a></li>
  <li><a href="#wait1">等待一个纹理加载</a></li>
  <li><a href="#waitmany">等待多个纹理加载</a></li>
  <li><a href="#cors">从其他源加载纹理</a></li>
</ul>
<li><a href="#memory">内存使用</a></li>
<li><a href="#format">JPG vs PNG</a></li>
<li><a href="#filtering-and-mips">过滤和mips</a></li>
<li><a href="#uvmanipulation">重复，偏移，旋转，包裹</a></li>
</ul>

## <a name="hello"></a> 你好，纹理

纹理一般是指我们常见的在一些第三方程序中创建的图像，如Photoshop或GIMP。比如我们把这张图片放在立方体上。

<div class="threejs_center">
  <img src="../resources/images/wall.jpg" style="width: 600px;" class="border" >
</div>

我们将修改我们的第一个例子中的其中一个。我们需要做的就是创建一个`TextureLoader`。调用它的[`load`](TextureLoader.load)方法，同时传入图像的URL，并将材质的 `map` 属性设置为该方法的返回值，而不是设置它的 `color`属性。

```js
+const loader = new THREE.TextureLoader();

const material = new THREE.MeshBasicMaterial({
-  color: 0xFF8844,
+  map: loader.load('resources/images/wall.jpg'),
});
```
注意，我们使用的是 `MeshBasicMaterial`， 所以没有必要增加光线

{{{example url="../threejs-textured-cube.html" }}}

## <a name="six"></a> 6种纹理，在立方体的每个面上都有不同的纹理。

6个纹理，一个立方体的每个面都有一个，怎么样？

<div class="threejs_center">
  <div>
    <img src="../resources/images/flower-1.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-2.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-3.jpg" style="width: 100px;" class="border" >
  </div>
  <div>
    <img src="../resources/images/flower-4.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-5.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-6.jpg" style="width: 100px;" class="border" >
  </div>
</div>

我们只需制作6种材料，并在创建 `Mesh` 时将它们作为一个数组传递给它们。

```js
const loader = new THREE.TextureLoader();

-const material = new THREE.MeshBasicMaterial({
-  map: loader.load('resources/images/wall.jpg'),
-});
+const materials = [
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-1.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-2.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-3.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-4.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-5.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-6.jpg')}),
+];
-const cube = new THREE.Mesh(geometry, material);
+const cube = new THREE.Mesh(geometry, materials);
```

有效果了！

{{{example url="../threejs-textured-cube-6-textures.html" }}}

但需要注意的是，并不是所有的几何体类型都支持多种材质。`BoxGeometry` 和 `BoxBufferGeometry` 可以使用6种材料，每个面一个。`ConeGeometry` 和 `ConeBufferGeometry` 可以使用2种材料，一种用于底部，一种用于侧面。 `CylinderGeometry` 和 `CylinderBufferGeometry` 可以使用3种材料，分别是底部、顶部和侧面。对于其他情况，你需要建立或加载自定义几何体和（或）修改纹理坐标。

在其他3D引擎中，如果你想在一个几何体上使用多个图像，使用 [纹理图集（Texture Atlas）](https://en.wikipedia.org/wiki/Texture_atlas) 更为常见，性能也更高。纹理图集是将多个图像放在一个单一的纹理中，然后使用几何体顶点上的纹理坐标来选择在几何体的每个三角形上使用纹理的哪些部分。

什么是纹理坐标？它们是添加到一块几何体的每个顶点上的数据，用于指定该顶点对应的纹理的哪个部分。当我们开始[构建自定义几何体时（building custom geometry）](threejs-custom-geometry.html)，我们会介绍它们。

## <a name="loading"></a> 加载纹理

### <a name="easy"></a> 简单的方法

本文的大部分代码都使用最简单的加载纹理的方法。我们创建一个 `TextureLoader` ，然后调用它的[`load`](TextureLoader.load)方法。
这将返回一个 `Texture` 对象。

```js
const texture = loader.load('resources/images/flower-1.jpg');
```

需要注意的是，使用这个方法，我们的纹理将是透明的，直到图片被three.js异步加载完成，这时它将用下载的图片更新纹理。

这有一个很大的好处，就是我们不必等待纹理加载，我们的页面会立即开始渲染。这对于很多用例来说可能都没问题，但如果我们想要的话，我们可以让three.js告诉我们何时纹理已经下载完毕。

### <a name="wait1"></a> 等待一个纹理加载

为了等待贴图加载，贴图加载器的 `load` 方法会在贴图加载完成后调用一个回调。回到上面的例子，我们可以在创建Mesh并将其添加到场景之前等待贴图加载，就像这样。

```js
const loader = new THREE.TextureLoader();
loader.load('resources/images/wall.jpg', (texture) => {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cubes.push(cube);  // 添加到我们要旋转的立方体数组中
});
```

除非你清除你的浏览器的缓存并且连接缓慢，你不太可能看到任何差异，但放心，它正在等待纹理加载。

{{{example url="../threejs-textured-cube-wait-for-texture.html" }}}

### <a name="waitmany"></a> 等待多个纹理加载

要等到所有纹理都加载完毕，你可以使用 `LoadingManager` 。创建一个并将其传递给 `TextureLoader`，然后将其[`onLoad`](LoadingManager.onLoad)属性设置为回调。

```js
+const loadManager = new THREE.LoadingManager();
*const loader = new THREE.TextureLoader(loadManager);

const materials = [
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-1.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-2.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-3.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-4.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-5.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-6.jpg')}),
];

+loadManager.onLoad = () => {
+  const cube = new THREE.Mesh(geometry, materials);
+  scene.add(cube);
+  cubes.push(cube);  // 添加到我们要旋转的立方体数组中
+};
```

`LoadingManager` 也有一个 [`onProgress`](LoadingManager.onProgress) 属性，我们可以设置为另一个回调来显示进度指示器。

首先，我们在HTML中添加一个进度条

```html
<body>
  <canvas id="c"></canvas>
+  <div id="loading">
+    <div class="progress"><div class="progressbar"></div></div>
+  </div>
</body>
```

然后给它加上CSS

```css
#loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
#loading .progress {
    margin: 1.5em;
    border: 1px solid white;
    width: 50vw;
}
#loading .progressbar {
    margin: 2px;
    background: white;
    height: 1em;
    transform-origin: top left;
    transform: scaleX(0);
}
```

然后在代码中，我们将在 `onProgress` 回调中更新 `progressbar` 的比例。调用它有如下几个参数：最后加载的项目的URL，目前加载的项目数量，以及加载的项目总数。

```js
+const loadingElem = document.querySelector('#loading');
+const progressBarElem = loadingElem.querySelector('.progressbar');

loadManager.onLoad = () => {
+  loadingElem.style.display = 'none';
  const cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);
  cubes.push(cube);  // 添加到我们要旋转的立方体数组中
};

+loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
+  const progress = itemsLoaded / itemsTotal;
+  progressBarElem.style.transform = `scaleX(${progress})`;
+};
```
除非你清除了你的缓存，而且连接速度很慢，否则你可能看不到加载栏。

{{{example url="../threejs-textured-cube-wait-for-all-textures.html" }}}

## <a name="cors"></a> 从其他源加载纹理

要使用其他服务器上的图片，这些服务器需要发送正确的头文件。如果他们不发送，你就不能在three.js中使用这些图片，并且会得到一个错误。如果你运行提供图片的服务器，请确保它[发送正确的头文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).。如果你不控制托管图片的服务器，而且它没有发送权限头文件，那么你就不能使用该服务器上的图片。

例如 [imgur](https://imgur.com)、[flickr](https://flickr.com) 和 [github](https://github.com) 都会发送头文件，允许你在 three.js 中使用他们服务器上托管的图片，使用 three.js。而其他大多数网站则不允许。

## <a name="memory"></a> 内存管理

纹理往往是three.js应用中使用内存最多的部分。重要的是要明白，*一般来说*，纹理会占用 `宽度 * 高度 * 4 * 1.33` 字节的内存。

注意，这里没有提到任何关于压缩的问题。我可以做一个.jpg的图片，然后把它的压缩率设置的超级高。比如说我在做一个房子的场景。在房子里面有一张桌子，我决定在桌子的顶面放上这个木质的纹理

<div class="threejs_center"><img class="border" src="resources/images/compressed-but-large-wood-texture.jpg" align="center" style="width: 300px"></div>

那张图片只有157k，所以下载起来会比较快，但[实际上它的大小是3024×3761像素](resources/images/compressed-but-large-wood-texture.jpg).。按照上面的公式，那就是

    3024 * 3761 * 4 * 1.33 = 60505764.5

在three.js中，这张图片会占用**60兆（meg）的内存！**。只要几个这样的纹理，你就会用完内存。

我之所以提出这个问题，是因为要知道使用纹理是有隐性成本的。为了让three.js使用纹理，必须把纹理交给GPU，而GPU*一般*都要求纹理数据不被压缩。

这个故事的寓意在于，不仅仅要让你的纹理的文件大小小，还得让你的纹理尺寸小。文件大小小=下载速度快。尺寸小=占用的内存少。你应该把它们做得多小？越小越好，而且看起来仍然是你需要的样子。

## <a name="format"></a> JPG vs PNG

这和普通的HTML差不多，JPG有损压缩，PNG有无损压缩，所以PNG的下载速度一般比较慢。但是，PNG支持透明度。PNG可能也适合作为非图像数据（non-image data）的格式，比如法线图，以及其他种类的非图像图，我们后面会介绍。

请记住，在WebGL中JPG使用的内存并不比PNG少。参见上文。

## <a name="filtering-and-mips"></a> 过滤和mips

让我们把这个16x16的纹理应用到

<div class="threejs_center"><img src="resources/images/mip-low-res-enlarged.png" class="nobg" align="center"></div>

一个立方体上。

<div class="spread"><div data-diagram="filterCube"></div></div>

让我们把这个立方体画得非常小

<div class="spread"><div data-diagram="filterCubeSmall"></div></div>

嗯，我想这很难看得清楚。让我们把这个小方块放大

<div class="spread"><div data-diagram="filterCubeSmallLowRes"></div></div>

GPU怎么知道小立方体的每一个像素需要使用哪些颜色？如果立方体小到只有1、2个像素呢？

这就是过滤（filtering）的意义所在。

如果是Photoshop，Photoshop会把几乎所有的像素平均在一起，来计算出这1、2个像素的颜色。这将是一个非常缓慢的操作。GPU用mipmaps解决了这个问题。

Mips 是纹理的副本，每一个都是前一个 mip 的一半宽和一半高，其中的像素已经被混合以制作下一个较小的 mip。Mips一直被创建，直到我们得到1x1像素的Mip。对于上面的图片，所有的Mip最终会变成这样的样子

<div class="threejs_center"><img src="resources/images/mipmap-low-res-enlarged.png" class="nobg" align="center"></div>

现在，当立方体被画得很小，只有1或2个像素大时，GPU可以选择只用最小或次小级别的mip来决定让小立方体变成什么颜色。

在three.js中，当纹理绘制的尺寸大于其原始尺寸时，或者绘制的尺寸小于其原始尺寸时，你都可以做出相应的处理。

当纹理绘制的尺寸大于其原始尺寸时，你可以将 [`texture.magFilter`](Texture.magFilter) 属性设置为 `THREE.NearestFilter` 或 `THREE.LinearFilter` 。`NearestFilter` 意味着只需从原始纹理中选取最接近的一个像素。对于低分辨率的纹理，这给你一个非常像素化的外观，就像Minecraft。

`LinearFilter` 是指从纹理中选择离我们应该选择颜色的地方最近的4个像素，并根据实际点与4个像素的距离，以适当的比例进行混合。

<div class="spread">
  <div>
    <div data-diagram="filterCubeMagNearest" style="height: 250px;"></div>
    <div class="code">Nearest</div>
  </div>
  <div>
    <div data-diagram="filterCubeMagLinear" style="height: 250px;"></div>
    <div class="code">Linear</div>
  </div>
</div>

为了在绘制的纹理小于其原始尺寸时设置过滤器，你可以将 [`texture.minFilter`](Texture.minFilter) 属性设置为下面6个值之一。

* `THREE.NearestFilter`

   同上，在纹理中选择最近的像素。

* `THREE.LinearFilter`

   和上面一样，从纹理中选择4个像素，然后混合它们

* `THREE.NearestMipmapNearestFilter`

   选择合适的mip，然后选择一个像素。

* `THREE.NearestMipmapLinearFilter`

   选择2个mips，从每个mips中选择一个像素，混合这2个像素。

* `THREE.LinearMipmapNearestFilter`

   选择合适的mip，然后选择4个像素并将它们混合。

*  `THREE.LinearMipmapLinearFilter`

   选择2个mips，从每个mips中选择4个像素，然后将所有8个像素混合成1个像素。

下面是一个分别使用上面6个设置的例子

<div class="spread">
  <div data-diagram="filterModes" style="
    height: 450px;
    position: relative;
  ">
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    ">
      <div style="
        background: rgba(255,0,0,.8);
        color: white;
        padding: .5em;
        margin: 1em;
        font-size: small;
        border-radius: .5em;
        line-height: 1.2;
        user-select: none;"
      >click to<br/>change<br/>texture</div>
    </div>
    <div class="filter-caption" style="left: 0.5em; top: 0.5em;">nearest</div>
    <div class="filter-caption" style="width: 100%; text-align: center; top: 0.5em;">linear</div>
    <div class="filter-caption" style="right: 0.5em; text-align: right; top: 0.5em;">nearest<br/>mipmap<br/>nearest</div>
    <div class="filter-caption" style="left: 0.5em; text-align: left; bottom: 0.5em;">nearest<br/>mipmap<br/>linear</div>
    <div class="filter-caption" style="width: 100%; text-align: center; bottom: 0.5em;">linear<br/>mipmap<br/>nearest</div>
    <div class="filter-caption" style="right: 0.5em; text-align: right; bottom: 0.5em;">linear<br/>mipmap<br/>linear</div>
  </div>
</div>

需要注意的是，使用 `NearestFilter` 和 `LinearFilter` 的左上方和中上方没有使用mips。正因为如此，它们在远处会闪烁，因为GPU是从原始纹理中挑选像素。左边只有一个像素被选取，中间有4个像素被选取并混合，但这还不足以得出一个好的代表颜色。其他4条做得比较好，右下角的`LinearMipmapLinearFilter`最好。

如果你点击上面的图片，它将在我们上面一直使用的纹理和每一个mip级别都是不同颜色的纹理之间切换。

<div class="threejs_center">
  <div data-texture-diagram="differentColoredMips"></div>
</div>

这样就更清楚了。在左上角和中上角你可以看到第一个mip一直用到了远处。右上角和中下角你可以清楚地看到哪里使用了不同的mip。

切换回原来的纹理，你可以看到右下角是最平滑的，质量最高的。你可能会问为什么不总是使用这种模式。最明显的原因是有时你希望东西是像素化的，以达到复古的效果或其他原因。其次最常见的原因是，读取8个像素并混合它们比读取1个像素并混合要慢。虽然单个纹理不太可能成为快和慢的区别，但随着我们在这些文章中的进一步深入，我们最终会有同时使用4或5个纹理的材料的情况。4个纹理*每个纹理8个像素，就是查找32个像素的永远渲染的像素。在移动设备上，这一嗲可能需要被重点考虑。

## <a name="uvmanipulation"></a> 重复，偏移，旋转，包裹一个纹理

纹理有重复、偏移和旋转纹理的设置。

默认情况下，three.js中的纹理是不重复的。要设置纹理是否重复，有2个属性，[`wrapS`](Texture.wrapS) 用于水平包裹，[`wrapT`](Texture.wrapT) 用于垂直包裹。

它们可以被设置为一下其中一个：

* `THREE.ClampToEdgeWrapping`

   每条边上的最后一个像素无限重复。

* `THREE.RepeatWrapping`

   纹理重复

* `THREE.MirroredRepeatWrapping`

   在每次重复时将进行镜像

比如说，要开启两个方向的包裹。

```js
someTexture.wrapS = THREE.RepeatWrapping;
someTexture.wrapT = THREE.RepeatWrapping;
```

重复是用[repeat]重复属性设置的。

```js
const timesToRepeatHorizontally = 4;
const timesToRepeatVertically = 2;
someTexture.repeat.set(timesToRepeatHorizontally, timesToRepeatVertically);
```

纹理的偏移可以通过设置 `offset` 属性来完成。纹理的偏移是以单位为单位的，其中1个单位=1个纹理大小。换句话说，0 = 没有偏移，1 = 偏移一个完整的纹理数量。

```js
const xOffset = .5;   // offset by half the texture
const yOffset = .25;  // offset by 1/4 the texture
someTexture.offset.set(xOffset, yOffset);
```

通过设置以弧度为单位的 `rotation` 属性以及用于选择旋转中心的 `center` 属性，可以设置纹理的旋转。它的默认值是0,0，从左下角开始旋转。像偏移一样，这些单位是以纹理大小为单位的，所以将它们设置为 `.5`，`.5` 将会围绕纹理中心旋转。

```js
someTexture.center.set(.5, .5);
someTexture.rotation = THREE.MathUtils.degToRad(45);
```

让我们修改一下上面的示例，来试试这些属性吧

首先，我们要保留一个对纹理的引用，这样我们就可以对它进行操作。

```js
+const texture = loader.load('resources/images/wall.jpg');
const material = new THREE.MeshBasicMaterial({
-  map: loader.load('resources/images/wall.jpg');
+  map: texture,
});
```

然后，我们会再次使用 [dat.GUI](https://github.com/dataarts/dat.gui) 来提供一个简单的界面。

```js
import {GUI} from '../3rdparty/dat.gui.module.js';
```

正如我们在之前的dat.GUI例子中所做的那样，我们将使用一个简单的类来给dat.GUI提供一个可以以度数为单位进行操作的对象，但它将以弧度为单位设置该属性。

```js
class DegRadHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return THREE.MathUtils.radToDeg(this.obj[this.prop]);
  }
  set value(v) {
    this.obj[this.prop] = THREE.MathUtils.degToRad(v);
  }
}
```

我们还需要一个类，将 `"123"` 这样的字符串转换为 `123` 这样的数字，因为three.js的枚举设置需要数字，比如 `wrapS` 和 `wrapT`，但dat.GUI只使用字符串来设置枚举。

```js
class StringToNumberHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return this.obj[this.prop];
  }
  set value(v) {
    this.obj[this.prop] = parseFloat(v);
  }
}
```

利用这些类，我们可以为上面的设置设置一个简单的GUI。

```js
const wrapModes = {
  'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
  'RepeatWrapping': THREE.RepeatWrapping,
  'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping,
};

function updateTexture() {
  texture.needsUpdate = true;
}

const gui = new GUI();
gui.add(new StringToNumberHelper(texture, 'wrapS'), 'value', wrapModes)
  .name('texture.wrapS')
  .onChange(updateTexture);
gui.add(new StringToNumberHelper(texture, 'wrapT'), 'value', wrapModes)
  .name('texture.wrapT')
  .onChange(updateTexture);
gui.add(texture.repeat, 'x', 0, 5, .01).name('texture.repeat.x');
gui.add(texture.repeat, 'y', 0, 5, .01).name('texture.repeat.y');
gui.add(texture.offset, 'x', -2, 2, .01).name('texture.offset.x');
gui.add(texture.offset, 'y', -2, 2, .01).name('texture.offset.y');
gui.add(texture.center, 'x', -.5, 1.5, .01).name('texture.center.x');
gui.add(texture.center, 'y', -.5, 1.5, .01).name('texture.center.y');
gui.add(new DegRadHelper(texture, 'rotation'), 'value', -360, 360)
  .name('texture.rotation');
```

最后需要注意的是，如果你改变了纹理上的 `wrapS` 或 `wrapT`，你还必须设置 [`texture.needsUpdate`](Texture.needsUpdate)，以便three.js知道并应用这些设置。其他的设置会自动应用。

{{{example url="../threejs-textured-cube-adjust.html" }}}

这只是进入纹理主题的一个步骤。在某些时候，我们将介绍纹理坐标以及其他9种可应用于材料的纹理类型。

现在我们继续说说[灯光](threejs-lights.html)。

<!--
alpha
ao
env
light
specular
bumpmap ?
normalmap ?
metalness
roughness
-->

<link rel="stylesheet" href="resources/threejs-textures.css">
<script type="module" src="resources/threejs-textures.js"></script>
