Title: Three.js 多个画布，多个场景 Description: 如何利用THREE.js在整个页面上绘制图像 TOC: 多个画布, 多个场景

Three.js中一个老生常谈的问题就是多个场景的渲染。比如当你想制作一个由多个三维图像构成的商业网站时，很容易想到的解决办法就是为每一个三维图像创建一张画布`(Canvas)`，并为每张画布添加一个渲染器`(Renderer)`。

但是，这样你会遇到两个很明显的问题：

> 1. 浏览器限制了WebGL上下文`(WebGL contexts)`的数量。
> >通常浏览器将其限制为 8 个，一旦超出这个数量，最先创建的WebGL上下文就会被自动弃用。
>2. 无法在不同的WebGL上下文中共享资源。
>>不同WebGL上下文无法共享任何资源，这就意味着，假设你想要在两个`Canvas`中各加载一个10Mb的模型，并且每个模型都20Mb的纹理，那么这个模型和纹理将分别被加载两次。因此，初始化、着色器编译等都将运行两次，随着`Canvas`数量的增减，情况会变得与来越糟糕。
        
那么，我们该如何解决这个问题？

## 基本方法

解决办法就是用一张`Canvas`在整个背景中填充视口，并利用一些其他元素来代表每个“虚拟画布”`(virtual canvas)`，即只在一张`Canvas`中加载一个`Renderer`，并为每个`virtual canvas`创建一个场景`(Scene)`。这样我们只需要确保每个`virtual canvas`正确的位置，THREE.js就会将它们渲染在屏幕上相应的位置。

利用这个方法，由于我们只添加了一张`Canvas`，也就仅仅使用了一个`WebGL contexts`，因此不仅解决了资源共享问题，且不会引发WebGL上下文数量限制问题。

以一个只有两个`Scene`的简单demo为例。首先，创建HTML结构：

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

接着为它设置一些基本样式：

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
我们将`Canvas`画幅设置为充满整个屏幕，并将其`z-index`设置为`-1`，使它始终位于其他元素的后面。当然，我们要给`virtual canvas`设置相应的宽高，因为此时还没有任何内容可以撑起它的大小。

现在，创建两个`Scene`，其中一个添加了立方体，另一个为菱形，并分别为这两个`Scene`添加灯光`（Light）`和相机`（Camera）`。

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
  const geometry = new THREE.BoxGeometry(1, 1, 1);
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
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
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

接着创建一个视图信息获取函数`renderSceneInfo()`和视图渲染函数`render()`，用来渲染那些`virtual canvas`所在的元素出现在了可视区域的`Scene`。只需调用THREE.js的剪裁区域检测`Renderer.setScissorTest`方法，THREE.js就能实现仅渲染部分画布内容的功能，同时，我们需要调用`Renderer.setViewport`和`Renderer.setScissor`来分别设定视口大小和剪裁区域。

参数说明如下：
>```js
>Renderer.setScissorTest( boolean : Boolean ) : null;
>// 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响。
>Renderer.setScissor ( x : Integer, y : Integer, width : Integer, height : Integer ) : null;
>//将剪裁区域设为(x, y)到(x + width, y + height)
>Renderer.### [setViewport]() ( x : Integer, y : Integer, width : Integer, height : Integer ) : null
>//将视口大小设置为(x, y)到 (x + width, y + height).
>```

视图信息获取函数如下：

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

视图渲染函数如下：

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
最终效果如下：

{{{example url="../threejs-multiple-scenes-v1.html" }}}

可以看到，两个物体被分别渲染到了对应的位置。

## 同步滚动

虽然我们已经实现了同时渲染多个场景的功能，但是上面的代码依然存在一个问题，如果`Scenes`过于复杂、或者由于其他原因需要更长时间渲染，那么画布中`Scenes`渲染的位置总是会落后于页面的其他元素，如页面滚动时会出现明显的滞后。

为了更直观的观察这个现象，我们给每个`Scene`加上边框，并设置背景颜色：
.diagram {
  display: inline-block;
  width: 5em;
  height: 3em;
+  border: 1px solid black;
}
And we set the background of each scene

const scene = new THREE.Scene();
+scene.background = new THREE.Color('red');

此时，我们快速滚动屏幕，就会发现这个问题。屏幕滚动时的动画放慢十倍后的效果如下：

为了解决这个问题，先将`Canvas`的定位方式由`position: fixed` 改为`position: absolute`。

#c {
-  position: fixed;
+  position: absolute;

为了解决这个问题，先将`Canvas`的定位方式由`position: fixed` 改为`position: absolute`。

function render(time) {
  ...

  const transform = `translateY(${window.scrollY}px)`;
  renderer.domElement.style.transform = transform;
`position: fixed` 会完全禁用画布的滚动，无论其他元素是否已经滚动到它的上；
`position: absolute`则会保持画布与页面的其余部分一起滚动，这意味着我们绘制的任何东西都会与页面一起滚动，就算还未完全渲染出来。当场景完成渲染之后，然后移动画布，场景会与页面被滚动后的位置相匹配，并重新渲染，这就意味着，只有窗口的边缘会显示出一些还未被渲染的数据，当时页面中的场景不会出现这种现象。下面时利用以上方法后的效果（动画同样放慢了10倍）。

## 让它更加通用

现在，我们已经实现了在一个`Canvas`中渲染多个场景的功能，接下来就来处理一下让它更加好用些。

我们可以封装一个主渲染函数用来管理整个`Canvas`,并定义一个场景元素列表和他们对应的场景初始化函数。对于每个元素，它将检查该元素是否滚动到了可视区域并调用相应的场景初始化函数。这样我们就构建了一个渲染系统，在这个系统中每个独立的`scenes`都会在它们各自定义的空间内独立渲染且不互相影响。

主渲染函数如下：

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
从中可以看出，这个函数将遍历每一个包含了所有`Scene`元素的数组对象，且每个元素都由各自的`elem`和`fn`属性。

这个函数将检查每个`Scene`元素是否进入可视区域，一旦进入就会调用它的场景初始化函数，并传给它当前的时间和对应的尺寸位置信息。

现在，把每个`Scene`的信息添加到数组列表中：

{
  const elem = document.querySelector('#box');
  const {scene, camera} = makeScene();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
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
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
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
至此，我们不再需要分别定义`sceneInfo1` 和 `sceneInfo2`，但每个场景对应的场景初始化函数都已生效。

{{{example url="../threejs-multiple-scenes-generic.html" }}}

### 使用HTML Dataset

更好用的最后一步就是使用HTML [dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)，这是一种将自己的数据添加到HTML元素中的方法，我们不再使用`id="..."`，而是使用`data-diagram="..."`，就像这样：
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

同时修改CSS选择器

-.diagram
+*[data-diagram] {
  display: inline-block;
  width: 5em;
  height: 3em;
}

现在，我们构建一个对象，用来映射每个场景对应的场景初始化函数，并返回一个场景渲染函数。

const sceneInitFunctionsByName = {
  'box': () => {
    const {scene, camera} = makeScene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
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
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
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
我们还需要获取所有的`diagrams`,并调用初始化函数。

document.querySelectorAll('[data-diagram]').forEach((elem) => {
  const sceneName = elem.dataset.diagram;
  const sceneInitFunction = sceneInitFunctionsByName[sceneName];
  const sceneRenderFunction = sceneInitFunction(elem);
  addScene(elem, sceneRenderFunction);
});
经过这番改造，页面的呈现效果没有发生变化，但代码更加通用了。

{{{examples url="../threejs-multiple-scenes-selector.html" }}}

## 给每个元素增加控制器

当需要交互时，我们需要为每个场景分别添加交互控件，如`TrackballControls`。首先，需要引入该控件。

import {TrackballControls} from './resources/threejs/r132/examples/jsm/controls/TrackballControls.js';

接着给每个元素增加控制器：

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
从中可以看到，我们将`camera`添加到`scene`中，而`light`则添加到`camera`上，这样可以保证`light`始终与`camera`相关联。因此，当我们通过控制器旋转`camera`的视角时，`light`会始终照亮这个视角。

我们还需要在渲染函数中更新这些控件：
const sceneInitFunctionsByName = {
- 'box': () => {
-    const {scene, camera} = makeScene();
+ 'box': (elem) => {
+    const {scene, camera, controls} = makeScene(elem);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
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
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
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
现在，控制器已经生效了，你可以拖动来查看效果：


{{{example url="../threejs-multiple-scenes-controls.html" }}}
上面提到的方法在本网站上可以找到很多实例，比如[Three.js 图元](https://threejsfundamentals.org/threejs/lessons/threejs-primitives.html)和[Three.js 材质](https://threejsfundamentals.org/threejs/lessons/threejs-materials.html) 这两篇文章。

## 另一个方法

还有一个方法也可以实现这种效果，原理是渲染到屏幕外的画布上，并将结果复制到对应的2D画布上。这个方法的优点是对如何组合每个独立区域没有限制，因此只需正常编写HTML即可。而第一种方法则需要在背景设置一个`Canvas`。

但这个方法的缺点就是速度较慢，因为每个区域都必须进行复制，因此速度快慢取决于浏览器本身和GPU的性能。

而这种方法所需改动的代码也很少。

第一步，不再需要HTML上的Canvas元素了：

<body>
-  <canvas id="c"></canvas>
  ...
</body>
画布的样式也需要改一下：

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
这样可以保证所有的`canvas`都能填满他们的容器。

接下来还需要修改一下JavaScript代码，不需要再查找`canvas`元素了，取而代之的是需要创建一个，并且在一开始就要开启可视区域检测功能：


function main() {
-  const canvas = document.querySelector('#c');
+  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
+  renderer.setScissorTest(true);

  ...
然后，对于每个场景，我们创建一个二维渲染上下文，并将其画布添加到该场景对应的元素中:

const sceneElements = [];
function addScene(elem, fn) {
+  const ctx = document.createElement('canvas').getContext('2d');
+  elem.appendChild(ctx.canvas);
-  sceneElements.push({elem, fn});
+  sceneElements.push({elem, ctx, fn});
}
在渲染时，如果渲染器的画布不够大导致无法渲染在这个区域，就增加其大小；如果这个区域的画布大小错误，就改变它的大小。最后，设置剪裁区域和视口大小、渲染该区域的场景并将结果复制到该区域的画布上。

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
最终结果与方法一一样：

{{{example url="../threejs-multiple-scenes-copy-canvas.html" }}}

## 更新的方法

还有一种方法是利用[`OffscreenCanvas`](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)方法，但是截至2020年7月，只有Chrome支持这个方法，感兴趣的小伙伴可以点击查看文档。
