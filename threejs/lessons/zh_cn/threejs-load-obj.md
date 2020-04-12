Title: Three.js 加载 .OBJ 文件
Description: 加载 .OBJ 文件
TOC: 加载 .OBJ 文件

人们最想用three.js做的事情之一就是加载和显示三维模型。
一个常见的格式是.OBJ 3D格式，我们现在尝试加载一个。

在网上搜索，我找到了[CC-BY-NC 3.0风车3D模型](https://www.blendswap.com/blends/view/69174)，作者是[阿赫多夫](https://www.blendswap.com/user/ahedov)。

<div class="threejs_center"><img src="resources/images/windmill-obj.jpg"></div>

我从那个网站下载了.blend文件，并将其加载到[Blender](https://Blender.org)并将其导出为.OBJ文件。

<div class="threejs_center"><img style="width: 827px;" src="resources/images/windmill-export-as-obj.jpg"></div>

> 注意：如果你从未使用过Blender，你可能会感到意外，Blender里做的事情不同于你用过的其他程序。你可能需要留出一些时间阅读Blender的一些基本操作。

> 我还要补充一点，3D程序通常超过1000个功能。它们是最复杂的软件之一。当我1996年第一次学习3D Studio Max时，我阅读了600页的手册70%内容，每天花几个小时，持续了大约3周。几年后当我学习Maya时，以前学过的都适用于Maya。所以，要知道如果你真的希望能够使用三维软件来构建三维资源或者修改现有的3D模型，把学习3D的计划放在你的日程表上，好好学习。

一般我会使用以下的导出设置：

<div class="threejs_center"><img style="width: 239px;" src="resources/images/windmill-export-options.jpg"></div>

让我们一起来尝试将它展示出来。

基于[光线文章](threejs-lights.html)中的定向光线（`DirectionalLight`）示例，结合半球光线（`HemisphereLight`）示例。相对于示例，我删除了所有与调整灯光相关的GUI内容，还删除了添加到场景中的立方体和球体。

第一件要做的事就是将`OBJLoader2`添加到代码中。

```js
import {OBJLoader2} from './resources/threejs/r115/examples/jsm/loaders/OBJLoader2.js';
```

然后创建`OBJLoader2`的实例并通过URL加载我们的.OBJ文件，并在回调函数中将已加载完的模型添加到场景（scene）里。

```js
{
  const objLoader = new OBJLoader2();
  objLoader.load('resources/models/windmill/windmill.obj', (root) => {
    scene.add(root);
  });
}
```

如果这样跑一下会怎么样？

{{{example url="../threejs-load-obj-no-materials.html" }}}

这已经相当接近，但是材质（material）显示异常。场景里材质显示异常是因为.OBJ文件格式是不包含材质数据的。

.OBJ加载器可以传入 名称/材质对 的对象。当它加载.OBJ文件时，会加载对应名称的材质，若该材质不存在就会使用默认材质。

有时.OBJ文件会带有一个.MTL文件来定义材质。在我们的示例里也会创建一个.MTL文件。.MTL文件是一个ASCII码文件，所以可以直接阅读。

```mtl
# Blender MTL File: 'windmill_001.blend'
# Material Count: 2

newmtl Material
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_lopatky_COL.jpg
map_Bump windmill_001_lopatky_NOR.jpg

newmtl windmill
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_base_COL.jpg
map_Bump windmill_001_base_NOR.jpg
map_Ns windmill_001_base_SPEC.jpg
```

我们能看到2个材质，引用了五张纹理图片，但是这些纹理文件在哪里呢？

<div class="threejs_center"><img style="width: 757px;" src="resources/images/windmill-exported-files.png"></div>

我们只得到一个.OBJ文件以及一个.MTL文件。

我们所下载的.blend文件是包含了模型的纹理，所以我们可以让blender点击**File->External Data->Unpack All Into Files**导出这些文件。

<div class="threejs_center"><img style="width: 828px;" src="resources/images/windmill-export-textures.jpg"></div>

选择 **Write Files to Current Directory**

<div class="threejs_center"><img style="width: 828px;" src="resources/images/windmill-overwrite.jpg"></div>

这样就会在.blend文件的目录下创建出一个**textures**文件夹。

<div class="threejs_center"><img style="width: 758px;" src="resources/images/windmill-exported-texture-files.png"></div>

我复制这些纹理放到我导出的.OBJ目录里。

<div class="threejs_center"><img style="width: 757px;" src="resources/images/windmill-exported-files-with-textures.png"></div>

现在.MTL文件就能加载到这些纹理。

首先要引用 `MTLLoader` 和 `MtlObjBridge`;

```js
import * as THREE from './resources/three/r115/build/three.module.js';
import {OrbitControls} from './resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import {OBJLoader2} from './resources/threejs/r115/examples/jsm/loaders/OBJLoader2.js';
+import {MTLLoader} from './resources/threejs/r115/examples/jsm/loaders/MTLLoader.js';
+import {MtlObjBridge} from './resources/threejs/r115/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';
```

然后我们先加载.MTL文件，在它加载完材质后利用`MtlObjBridge`将材质传给`OBJLoader2`，再加载.OBJ文件。

```js
{
+  const mtlLoader = new MTLLoader();
+  mtlLoader.load('resources/models/windmill/windmill.mtl', (mtlParseResult) => {
+    const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
+    objLoader.addMaterials(materials);
    objLoader.load('resources/models/windmill/windmill.obj', (root) => {
      scene.add(root);
    });
+  });
}
```

尝试一下：

{{{example url="../threejs-load-obj-materials.html" }}}

注意当旋转模型时，会发现风车布是消失了的。

<div class="threejs_center"><img style="width: 528px;" src="resources/images/windmill-missing-cloth.jpg"></div>

我们需要设置这个材质为双面，在[关于材质的文章](threejs-materials.html)有详细说明。
在.MTL里不好修复这个问题，在我脑海里有三个解决办法：

1. 加载模型后，遍历所有材质，设置成双面。

        const mtlLoader = new MTLLoader();
        mtlLoader.load('resources/models/windmill/windmill.mtl', (mtlParseResult) => {
          const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
          for (const material of Object.values(materials)) {
            material.side = THREE.DoubleSide;
          }
          ...

   这样能解决问题，但是最理想的情况下是，仅设置特定的材质为双面，其它无需设置成双面，毕竟渲染双面的效率低于单面。

2. 手动设置一个特定材质。

   看到.MTL里有两个材质，一个是`"windmill"`另一个是`"Material"`。经过反复尝试，发现可以单独设置一个材质。

        const mtlLoader = new MTLLoader();
        mtlLoader.load('resources/models/windmill/windmill.mtl', (mtlParseResult) => {
          const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
          materials.Material.side = THREE.DoubleSide;
          ...

3. 在.MTL文件上无法解决，可以不使用它而使用自行创建的材质。

        const materials = {
          Material: new THREE.MeshPhongMaterial({...}),
          windmill: new THREE.MeshPhongMaterial({...}),
        };
        objLoader.setMaterials(materials);

采用哪个方案取决于你。1是最简单，3是最灵活，2是两者之间，现在我选择2 。

修改之后，当你从后面看的时候，你仍然可以看到风车布，但是还有一个问题。如果我们放大近看，我们看到的东西正在变成块状。

<div class="threejs_center"><img style="width: 700px;" src="resources/images/windmill-blocky.jpg"></div>

发生了什么？

看看纹理，有2个纹理命名包含了NOR，这是法线贴图（NORmal map）。法线贴图通常是紫色的，而凹凸贴图则是黑白的。法线贴图表示表面的方向，而凹凸贴图则表示表面的高度。

<div class="threejs_center"><img style="width: 256px;" src="../resources/models/windmill/windmill_001_base_NOR.jpg"></div>

看[MTLLoader源码](https://github.com/mrdoob/three.js/blob/1a560a3426e24bbfc9ca1f5fb0dfb4c727d59046/examples/js/loaders/MTLLoader.js#L432)，`norm`是标记为法线贴图，我们手动修改一下.MTL文件。

```mtl
# Blender MTL File: 'windmill_001.blend'
# Material Count: 2

newmtl Material
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_lopatky_COL.jpg
-map_Bump windmill_001_lopatky_NOR.jpg
+norm windmill_001_lopatky_NOR.jpg

newmtl windmill
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_base_COL.jpg
-map_Bump windmill_001_base_NOR.jpg
+norm windmill_001_base_NOR.jpg
map_Ns windmill_001_base_SPEC.jpg
```

现在当我们加载它时它将使用法线贴图作为法线贴图，我们可以看到叶片的背面。

{{{example url="../threejs-load-obj-materials-fixed.html" }}}

现在尝试加载不同的模型：

网络搜索我找到[CC-BY-NC](https://creativecommons.org/licenses/by-nc/4.0/) 风车3D模型，由[Roger Gerzner / GERIZ.3D Art](http://www.gerzi.ch/)制作。

<div class="threejs_center"><img src="resources/images/windmill-obj-2.jpg"></div>

它已经有了一个.obj版本。让我们加载它(注意，我现在已经删除了.MTL加载器)

```js
-  objLoader.load('resources/models/windmill/windmill.obj', ...
+  objLoader.load('resources/models/windmill-2/windmill.obj', ...
```

{{{example url="../threejs-load-obj-wat.html" }}}

嗯,没有东西出现。是什么问题?我想知道这个模型的尺寸是多少?我们可以问THREE.js模型的大小，并尝试自动设置相机的参数。

首先，我们可以让THREE.js计算一个包含我们刚刚加载的场景的盒子，并计算出它的大小和中心。

```js
objLoader.load('resources/models/windmill_2/windmill.obj', (root) => {
  scene.add(root);

+  const box = new THREE.Box3().setFromObject(root);
+  const boxSize = box.getSize(new THREE.Vector3()).length();
+  const boxCenter = box.getCenter(new THREE.Vector3());
+  console.log(boxSize);
+  console.log(boxCenter);
```

在[JavaScript控制台](threejs-debugging-javascript.html)能看到：

```js
size 2123.6499788469982
center p {x: -0.00006103515625, y: 770.0909731090069, z: -3.313507080078125}
```

我们的相机目前只显示大约100个单位，最近0.1和最远100。我们的地平面只有40个单位宽，所以这个风车模型是如此之大，达2000个单位，摄像机被包含在模型里面，所有能展示的部分都在截锥体外面。

<div class="threejs_center"><img style="width: 280px;" src="resources/images/camera-inside-windmill.svg"></div>

我们可以手动修复该问题，也可以使相机自动对场景进行构图。 让我们尝试一下，我们可以使用刚计算出的框调整摄像机设置以查看整个场景。 请注意，关于将相机放置在哪里，并没有正确的答案。 我们可以从任何方向，在任何高度面对场景，因此我们只需要选择一些东西即可。

在[关于相机的文章](threejs-cameras.html)讨论提到，相机定义了一个截锥体。该截锥体由视场(`fov`：the field of view)和远(`far`)近(`near`)设置定义。我们想知道的是，给定当前的视场，摄像机需要设置多远，才能使包含场景的盒子在截锥体内，假设截锥体永远延伸，即假设`near`是0.00000001，`far`是无穷大(infinity)。

因为我们知道盒子的大小也知道视野（FOV:the field of view），所以我们有了这个三角形。

<div class="threejs_center"><img style="width: 600px;" src="resources/images/camera-fit-scene.svg"></div>

你可以看到在左边的是相机，在它前方投射出蓝色的截锥体。我们只是计算了包含风车的盒子。我们需要计算相机应该离方框有多远，使得盒子在截锥体内。

利用基本的直角三角形函数和[SOHCAHTOA](https://www.google.com/search?q=SOHCAHTOA)，已知截锥体的视场和方框的大小，就可以计算出距离。

<div class="threejs_center"><img style="width: 600px;" src="resources/images/field-of-view-camera.svg"></div>

根据该图，计算距离的公式为：

```js
distance = halfSizeToFitOnScreen / tangent(halfFovY)
```

我们把它转换成代码。首先做一个函数，计算出距离`distance`。然后移动相机，离盒子中心`distance`远。然后把摄像机对准盒子中心。

```js
function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

  // compute a unit vector that points in the direction the camera is now
  // from the center of the box
  const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();

  // move the camera to a position distance units way from the center
  // in whatever direction the camera was from the center already
  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

  // pick some near and far values for the frustum that
  // will contain the box.
  camera.near = boxSize / 100;
  camera.far = boxSize * 100;

  camera.updateProjectionMatrix();

  // point the camera to look at the center of the box
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}
```

我们传入了两种尺寸：盒子大小`boxSize`和尺寸`sizeToFitOnScreen`。如果我们只是传递`boxSize`并将其用作`sizeToFitOnScreen`，那么数学运算将使这个盒子完美地嵌入到截锥。我们想要在上面和下面留出一点额外的空间，所以我们要传一个稍微大一点的尺寸。

```js
{
  const objLoader = new OBJLoader2();
  objLoader.load('resources/models/windmill_2/windmill.obj', (root) => {
    scene.add(root);
+    // compute the box that contains all the stuff
+    // from root and below
+    const box = new THREE.Box3().setFromObject(root);
+
+    const boxSize = box.getSize(new THREE.Vector3()).length();
+    const boxCenter = box.getCenter(new THREE.Vector3());
+
+    // set the camera to frame the box
+    frameArea(boxSize * 1.2, boxSize, boxCenter, camera);
+
+    // update the Trackball controls to handle the new size
+    controls.maxDistance = boxSize * 10;
+    controls.target.copy(boxCenter);
+    controls.update();
  });
}
```

你可以看到在上面，我们传递了`boxSize * 1.2`，当试图把它放入截锥体时，给了20%额外空间在盒子的上下面。我们还更新了`OrbitControls`，使相机转动时是围绕它进行转动。

现在的效果是：

{{{example url="../threejs-load-obj-auto-camera.html" }}}

这效果已经差不多了。用鼠标旋转照相机，你应该能看到风车。问题是风车很大，盒子中心约为(0,770,0)。所以,当我们把相机从(0,10,20)移到到`distance`单位距离，摄像头是风车的正下方。

<div class="threejs_center"><img style="width: 360px;" src="resources/images/computed-camera-position.svg"></div>

修改代码使摄像头不管在哪个方向，都能对准盒子侧面中心。我们要做的就是把盒子到摄像机的`y`分量归零。然后，当我们标准化这个向量它就会变成一个平行于XZ平面的向量。换句话说，平行于地面。

```js
-// compute a unit vector that points in the direction the camera is now
-// from the center of the box
-const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();
+// compute a unit vector that points in the direction the camera is now
+// in the xz plane from the center of the box
+const direction = (new THREE.Vector3())
+    .subVectors(camera.position, boxCenter)
+    .multiply(new THREE.Vector3(1, 0, 1))
+    .normalize();
```

如果你看风车的底部，你会看到一个小正方形，这是我们的地板。

<div class="threejs_center"><img style="width: 365px;" src="resources/images/tiny-ground-plane.jpg"></div>

它只有40x40个单位，相对于风车来说太小了。由于风车超过2000个单位大，让我们改变地面的大小来适配。我们还需要调整重复次数，否则不能看到棋盘。

```js
-const planeSize = 40;
+const planeSize = 4000;

const loader = new THREE.TextureLoader();
const texture = loader.load('resources/images/checker.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.magFilter = THREE.NearestFilter;
-const repeats = planeSize / 2;
+const repeats = planeSize / 200;
texture.repeat.set(repeats, repeats);
```

现在再看看这个风车：

{{{example url="../threejs-load-obj-auto-camera-xz.html" }}}

现在把材质加回去，就像之前有一个.mtl文件，它引用了一些纹理。但是看了一下这些文件，我很快发现了一个问题。

```shell
 $ ls -l windmill
 -rw-r--r--@ 1 gregg  staff       299 May 20  2009 windmill.mtl
 -rw-r--r--@ 1 gregg  staff    142989 May 20  2009 windmill.obj
 -rw-r--r--@ 1 gregg  staff  12582956 Apr 19  2009 windmill_diffuse.tga
 -rw-r--r--@ 1 gregg  staff  12582956 Apr 20  2009 windmill_normal.tga
 -rw-r--r--@ 1 gregg  staff  12582956 Apr 19  2009 windmill_spec.tga
```

这是TARGA (.tga)文件，并且体积很大！

THREE.js实际上有一个TGA加载器，但是在大多数情况下使用它是错误的。如果你制作一个查看器，你想让用户查看他们在网上找到的随机3D文件，那么可能，只是可能，你可能想加载TGA文件。([*](#loading-scenes))

TGA文件的一个问题是根本不能很好地压缩。TGA只支持非常简单的压缩，在上面我们可以看到文件根本没有被压缩，因为它们的大小完全相同的几率非常低。每个文件12M!!如果我们使用这些文件，用户必须下载36M才能看到风车。

TGA的另一个问题是，浏览器本身不支持它们，所以加载它们可能比加载.jpg和.png等受支持的格式要慢。

我很确定将它们转换成.jpg是最好的选择。看里面，我看到他们是3个通道（RGB），没有阿尔法通道（alpha）。JPG只支持3个频道，所以很适合。JPG也支持有损压缩，所以我们可以使文件更小的下载。

加载文件的大小分别为2048x2048。这对我来说似乎是一种浪费，但当然这取决于您的实际情况。我把它们分别做成1024x1024，并在Photoshop中以50%的质量保存。文件列表：

```shell
 $ ls -l ../threejsfundamentals.org/threejs/resources/models/windmill
 -rw-r--r--@ 1 gregg  staff     299 May 20  2009 windmill.mtl
 -rw-r--r--@ 1 gregg  staff  142989 May 20  2009 windmill.obj
 -rw-r--r--@ 1 gregg  staff  259927 Nov  7 18:37 windmill_diffuse.jpg
 -rw-r--r--@ 1 gregg  staff   98013 Nov  7 18:38 windmill_normal.jpg
 -rw-r--r--@ 1 gregg  staff  191864 Nov  7 18:39 windmill_spec.jpg
```

从36M转到0.55M!当然，艺术家可能不喜欢这种压缩，所以一定要咨询他们，进行权衡。

现在，为了使用.mtl文件，我们需要编辑它来引用.jpg文件，而不是.tga文件。幸运的是，它是一个简单的文本文件，所以很容易编辑。

```mtl
newmtl blinn1SG
Ka 0.10 0.10 0.10

Kd 0.00 0.00 0.00
Ks 0.00 0.00 0.00
Ke 0.00 0.00 0.00
Ns 0.060000
Ni 1.500000
d 1.000000
Tr 0.000000
Tf 1.000000 1.000000 1.000000 
illum 2
-map_Kd windmill_diffuse.tga
+map_Kd windmill_diffuse.jpg

-map_Ks windmill_spec.tga
+map_Ks windmill_spec.jpg

-map_bump windmill_normal.tga 
-bump windmill_normal.tga 
+map_bump windmill_normal.jpg 
+bump windmill_normal.jpg 
```

现在。mtl文件指向一些合理大小的纹理，我们需要加载它，所以我们就像上面做的那样，首先加载材质，然后将它们设置在`OBJLoader2`上。

```js
{
+  const mtlLoader = new MTLLoader();
+  mtlLoader.load('resources/models/windmill_2/windmill-fixed.mtl', (mtlParseResult) => {
+    const objLoader = new OBJLoader2();
+    const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
+    objLoader.addMaterials(materials);
    objLoader.load('resources/models/windmill/windmill.obj', (root) => {
      root.updateMatrixWorld();
      scene.add(root);
      // compute the box that contains all the stuff
      // from root and below
      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      // set the camera to frame the box
      frameArea(boxSize * 1.2, boxSize, boxCenter, camera);

      // update the Trackball controls to handle the new size
      controls.maxDistance = boxSize * 10;
      controls.target.copy(boxCenter);
      controls.update();
    });
+  });
}
```

在我们真正尝试之前，我想到了一些问题，我不想显示出失败，我只是要检查一下。

问题1：三个`MTLLoader`创建的材质会将材质的漫反射颜色，乘以漫反射纹理贴图。

这是一个很有用的特性，但是要查看行上面的.MTL文件

```mtl
Kd 0.00 0.00 0.00
```

将漫反射颜色设置为0。纹理贴图的值* 0 =黑色！ 但可能用于制造风车的建模工具，并没有将漫反射纹理贴图乘以漫反射颜色，所以在艺术家制作模型时仍显示正常。

为了修复它，这样修改：

```mtl
Kd 1.00 1.00 1.00
```

因为 纹理贴图的值 * 1 = 纹理贴图的值.

问题2:高光的颜色也是黑色的

以`Ks`开头的行指定了高光颜色。跟上面漫反射贴图一样，使用高光贴图的颜色来实现高光效果。这里仍需要设置一个高光颜色。

跟上面一样，直接修改.MTL文件：

```mtl
-Ks 0.00 0.00 0.00
+Ks 1.00 1.00 1.00
```

问题3: `windmill_normal.jpg` 是法线贴图而不是凹凸贴图。

跟上面一样修改.MTL文件：

```mtl
-map_bump windmill_normal.jpg 
-bump windmill_normal.jpg 
+norm windmill_normal.jpg 
```

现在试一试附带材质的效果：

{{{example url="../threejs-load-obj-materials-windmill2.html" }}}

加载模型经常遇到这类问题。常见的问题包括

* 需要知道大小

  上图中，我们让摄像机试图将场景框起来，但这并不总是合适的做法。一般来说，最合适的做法是自己制作模型或下载模型，加载到一些3D软件中，查看它们的大小，并在需要时进行调整。

* 方向错误
  Three.js一般是以Y为上（up）。有些建模包默认是Z为上，有些是Y为上。有些是可设置的。如果你遇到这种情况，你加载一个模型，它在它的一边。你可以让代码在加载后旋转模型(不推荐)，或者你可以模型加载到你最喜欢的建模工具里旋转物体至合适的位置,就像你会为您的网站编辑图像而不是使用代码调整它。Blender导出时可以选择改变方向。

* 没有.mtl文件、错误的材质或不兼容的参数

  上面我们使用了一个.MTL文件，该文件可以帮助我们加载材料，但是存在问题。 我们手动编辑了.MTL文件进行修复。 
  通常，也可以在.OBJ文件中查看是否有什么材质，或者将.OBJ文件加载到THREE.js中，然后打印出所有材质。 
  然后，修改代码以制作自定义材质并在适当的位置对其进行调整，比如可以创建一个名称/材质对对象传递给加载器，而不是加载.MTL文件，也可以在场景加载后遍历场景进行调整。

* 纹理过大

  大多数3D模型是为建筑、电影和广告或游戏制作的。对于建筑和电影，没有人真正关心纹理的大小。对于游戏来说，因为游戏内存有限，并且大多数游戏都在本地运行，所以文件也不能太多。网页一般要求加载快，所以你需要看纹理，并尽量使他们尽可能小，但仍然看起来很好。事实上，第一个风车模型也应该调整纹理，它们目前总共是10M。

  还记得我们在[关于纹理的文章](threejs-textures.html)中提到的纹理占用内存，所以一个50k的JPG扩展到4096x4096会下载很快，但仍然需要大量的内存。

我最不想展示的就是旋转风车。不幸的是. obj文件没有层次结构（hierarchy）。这意味着每个风车模型基本上都是一个单独的网格（mesh）。你不能转动风车的叶片，因为它们没有与建筑物的其他部分分开。

这就是为什么.obj不是一个好的3D格式的主要原因之一。如果我猜一下，它比其他格式更常见的原因是它很简单，而且不支持很多特性。特别是如果你在做一些静态的物体，比如建筑图像，没必要动起来。

接下来我们将尝试加载一个gLTF场景。gLTF格式支持更多特性。





