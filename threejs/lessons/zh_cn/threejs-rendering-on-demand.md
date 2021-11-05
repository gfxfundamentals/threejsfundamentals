Title: 按需渲染
Description: 如何节约资源
TOC: 按需渲染

这一章的主题即便已经很明显了, 但... 以防万一, 还是说大多数情况下three.js给出的例子都是连续渲染的. 换言之他们使用了`requestAnimationFrame`循环或者写成*rAF loop*

```js
function render() {
  ...
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

有些场景连续渲染是有意义的, 但是有些情况下不需要一直动呢? 这种情况下不断地渲染会浪费电, 对于移动设备来说属实不能接受. 

显而易见的解决方法是一开始的时候渲染一次, 只有当什么东西改变了以后再次渲染. 这种改变包括纹理的变化, 或者再入了模型, 其他源传来了什么数据, 用户调整了设置或者是动了摄像机. 

我们以[响应式设计](responsive.html)这一章为例, 稍作修改以满足按需渲染.

首先我们添加`OrbitControls`, 这样当摄像机改变之后场景就可以随之渲染

First we'll add in the `OrbitControls` so there is something that could change
that we can render in response to.

```js
import * as THREE from '/build/three.module.js';
+import {OrbitControls} from '/examples/jsm/controls/OrbitControls.js';
```

然后

```js
const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

+const controls = new OrbitControls(camera, canvas);
+controls.target.set(0, 0, 0);
+controls.update();
```
我们不需要在渲染那三个正方体了所以不再追踪

```js
-const cubes = [
-  makeInstance(geometry, 0x44aa88,  0),
-  makeInstance(geometry, 0x8844aa, -2),
-  makeInstance(geometry, 0xaa8844,  2),
-];
+makeInstance(geometry, 0x44aa88,  0);
+makeInstance(geometry, 0x8844aa, -2);
+makeInstance(geometry, 0xaa8844,  2);
```
把这些代码移除, 然后调用`requestAnimationFrame`

```js
-function render(time) {
-  time *= 0.001;
+function render() {

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

-  cubes.forEach((cube, ndx) => {
-    const speed = 1 + ndx * .1;
-    const rot = time * speed;
-    cube.rotation.x = rot;
-    cube.rotation.y = rot;
-  });

  renderer.render(scene, camera);

-  requestAnimationFrame(render);
}

-requestAnimationFrame(render);
```

我们这次只需要渲染一次

```js
render();
```
我们需要在`OrbitControls`改变摄像机设置的时候渲染场景.
幸好`OrbitControls`提供了一个`change`事件来监听变化

```js
controls.addEventListener('change', render);
```

我们同样需要捕捉到用户改变窗口大小的情况. 在之前连续渲染的时候这种情况是自动处理的, 但是现在是按需渲染, 我们需要在窗口改变的时候显式`resize`窗口大小

```js
window.addEventListener('resize', render);
```
然后我们就实现了按需渲染的功能

{{{example url="render-on-demand.html" }}}
`OrbitControls` 有个选项可以增加某种惯性, 让整个画面显得不那么僵硬. 我们启用`enableDamping`来实现它

```js
controls.enableDamping = true;
```
开启`enableDamping`, 我们需要在渲染函数中调用`controls.update`, 让`OrbitControls`可以丝滑地让摄像机移动. 但是, 这就意味着我们不能直接地在`change`事件中调用`render`, 如此这般会导致死循环. 控制器响应一个`change`事件然后调用`render`, 然后`render`调用`controls.update`. 这个方法会再发出另一个`change`事件. 

我们可以通过使用`requestAnimationFrame`调用`render`, 但是需要确保仅仅在需要一个新帧的时候才执行. 如果没有请求

我们可以通过使用`requestAnimationFrame`调用`render`来解决这个问题, 但是我们需要确保我们只在还没有请求一个新帧的情况下请求一个新帧, 我们可以通过一个变量来跟踪我们已经请求的帧

```js
+let renderRequested = false;

function render() {
+  renderRequested = false;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
}
render();

+function requestRenderIfNotRequested() {
+  if (!renderRequested) {
+    renderRequested = true;
+    requestAnimationFrame(render);
+  }
+}

-controls.addEventListener('change', render);
+controls.addEventListener('change', requestRenderIfNotRequested);
```
我们应该会在改变窗口大小的时候用到`requestRenderIfNotRequested`

```js
-window.addEventListener('resize', render);
+window.addEventListener('resize', requestRenderIfNotRequested);
```

可能很难看出来有什么不同. 试着点一下下面的例子, 然后用方向键移动, 或者拖拽旋转. 然后在上面的例子中做同样的事, 你应该能感觉出来区别. 上面的像是一帧帧在放幻灯片, 下面则是丝滑柔顺.

{{{example url="render-on-demand-w-damping.html" }}}

让我们加一个简单的GUI

```js
import * as THREE from '/build/three.module.js';
import {OrbitControls} from '/examples/jsm/controls/OrbitControls.js';
+import {GUI} from '/manual/examples/3rdparty/dat.gui.module.js';
```

这个控制器可以改变每个立方体的颜色和在x方向缩放. 为了设置颜色我们用了`ColorGUIHelper`, 这个在[光线](lights.html)一章提到过


```js
const gui = new GUI();
```
对每一个立方体, 我们建一个折叠菜单, 一个是`material.color`, 另一个是`cube.scale.x`

```js
function makeInstance(geometry, color, x) {
  const material = new THREE.MeshPhongMaterial({color});

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;

+  const folder = gui.addFolder(`Cube${x}`);
+  folder.addColor(new ColorGUIHelper(material, 'color'), 'value')
+      .name('color')
+      .onChange(requestRenderIfNotRequested);
+  folder.add(cube.scale, 'x', .1, 1.5)
+      .name('scale x')
+      .onChange(requestRenderIfNotRequested);
+  folder.open();

  return cube;
}
```

上面的GUI用了一个`onChange`方法, 在数值改变的时候调用传入一个回调函数. 这个例子中, 我们仅仅需要它调用`requestRenderIfNotRequested`. `folder.open`是使折叠菜单展开的方法


{{{example url="render-on-demand-w-gui.html" }}}

我希望这篇文章能在将连续渲染改成按需渲染的时候给你一些启发. 按需渲染不像是连续渲染那么常见, 因为3D游戏或者艺术创作中必须要让场景动出来. 但是有些场合, 例如地图浏览器, 3D编辑器, 3D图产生器等等的, 可能还是按需渲染比较好. 
