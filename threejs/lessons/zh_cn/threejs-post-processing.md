Title: 后期处理
Description: 怎么在THREE.js中做后期处理
TOC: 后期处理

*后置处理*通常是指应用到2d图像上的某种特效或者是滤镜。在ThreeJs的场景中,我们有的是由很多网格(mesh)构成的场景(scene)。我们将其渲染成2d图像。一般来说，图像被直接渲染成canvas然后在浏览器中被展示,然而在结果被输出到canvas之前，我们也可以通过另外的一个[render target](rendertargets.html)并应用一些后置效果。这被称为Post Processing，因为它发生在主场景渲染过程之后。

后置处理的示例 比如 Instagram 的滤镜，photoshop的滤镜。

ThreeJs拥有一些案例课程去帮助建立一个后置处理管道。工作方式是你需要创建`EffectComposer`然后增加一些`Pass`对象。

每一个`Pass`阶段都可以增加一些后置处理特效，添加小插图，模糊，添加光晕，添加噪点，调整色相，饱和度，对比度等等。最终把效果渲染到canvas。

理解`EffectComposer`是如何工作的是有一点重要的。它创建两个[render targets](rendertargets.html)。让我们称他们为**rtA**和**rtB**

然后你调用`EffectComposer.addPass`按照你想要应用它们的顺序增加`pass`。然后它们就被向下图所示的被应用。

<div class="threejs_center"><img src="../resources/images/threejs-postprocessing.svg" style="width: 600px"></div>

首先 你传入`RenderPass`的场景被渲染到rtA，不管rta的内容是啥，它继续向下一个`pass`传递。下一个`pass`将它作为输入做一些操作然后将其写入到rtB。然后rtB传到下一个`pass`,将rtB作为输入作一些操作然后在写回rtA。这个过程在整个pass过程中持续发生。

每个`pass`都有4个基础选项

## enabled 
→ 是否使用这个`pass`
## needsSwap 
→ 完成这个`pass`后是否交换rtA和rtB
## clear 
→ 在渲染这个`pass`之前是否需要清除
## renderToScreen 
→ 是否将当前的内容渲染到画布上。通常来说你需要在你最后添加的`pass`设置这一项为`true`

让我们将他们结合起来写一个简单的例子。 我们将从这个例子开始 [the article on responsiveness](responsive.html)

第一步，我们创建一个`EffectComposer`

```js
const composer = new EffectComposer(renderer);
```

然后，作为第一个`pass`，我们添加一个`RenderPass`，它会将我们的场景scene和我们的相机camera渲染到第一个渲染目标

```js
composer.addPass(new RenderPass(scene, camera));
```

接下来，我们添加一个`BloomPass`。`BloomPass`将它的输入放入一个通常来说更小的`render target`然后对这个结果的表面进行模糊处理。这使得scene产生辉光效果。

```js
const bloomPass = new BloomPass(
    1,    // strength
    25,   // kernel size
    4,    // sigma ?
    256,  // blur render target resolution
);
composer.addPass(bloomPass);
```

最后,我们用`FilmPass`来添加噪点和扫描线。

```js
const filmPass = new FilmPass(
    0.35,   // noise intensity
    0.025,  // scanline intensity
    648,    // scanline count
    false,  // grayscale
);
filmPass.renderToScreen = true;
composer.addPass(filmPass);
```

由于filmPass是最后一次传递，我们将其renderToScreen属性设置为true来告诉它渲染到画布。如果不设置它，它将渲染到下一个渲染目标。

为了使用这些类,我们需要导入一些js模块

```js
import {EffectComposer} from '/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/examples/jsm/postprocessing/RenderPass.js';
import {BloomPass} from '/examples/jsm/postprocessing/BloomPass.js';
import {FilmPass} from '/examples/jsm/postprocessing/FilmPass.js';
```

对于几乎所有的后期处理EffectComposer.js，RenderPass.js 都是必需的。

们需要做的最后一件事是使用EffectComposer.render 替代 WebGLRenderer.render 并告诉EffectComposer来匹配画布的大小

```js
-function render(now) {
-  time *= 0.001;
+let then = 0;
+function render(now) {
+  now *= 0.001;  // convert to seconds
+  const deltaTime = now - then;
+  then = now;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
+    composer.setSize(canvas.width, canvas.height);
  }

  cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * .1;
-    const rot = time * speed;
+    const rot = now * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });

-  renderer.render(scene, camera);
+  composer.render(deltaTime);

  requestAnimationFrame(render);
}
```

`EffectComposer.render` 需要花费`deltaTime`自最后一帧渲染后的数秒时间。如果任何一个有动画，它将各种效果传递下去。在这个示例中`FilmPass`被动画化了。

{{{example url="postprocessing.html" }}}

要在运行时更改效果参数，通常需要设置统一的值。让我们添加一个GUI来调整一些参数。为了您可以轻松调整哪些值以及如何调整它们您需要深入了解该效果的代码。

查看`BloomPass.js`，我找到了这一行

```js
this.copyUniforms[ "opacity" ].value = strength;
```

所以我们设置`strength`

```js
bloomPass.copyUniforms.opacity.value = someValue;
```

类似地，在`FilmPass.js`中我发现这些代码

```js
if ( grayscale !== undefined )	this.uniforms.grayscale.value = grayscale;
if ( noiseIntensity !== undefined ) this.uniforms.nIntensity.value = noiseIntensity;
if ( scanlinesIntensity !== undefined ) this.uniforms.sIntensity.value = scanlinesIntensity;
if ( scanlinesCount !== undefined ) this.uniforms.sCount.value = scanlinesCount;
```

这样就很清楚如何设置它们。

让我们快速创建一个GUI来设置这些值

```glsl
import {GUI} from '../3rdparty/dat.gui.module.js';
```

和

```glsl
const gui = new GUI();
{
  const folder = gui.addFolder('BloomPass');
  folder.add(bloomPass.copyUniforms.opacity, 'value', 0, 2).name('strength');
  folder.open();
}
{
  const folder = gui.addFolder('FilmPass');
  folder.add(filmPass.uniforms.grayscale, 'value').name('grayscale');
  folder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity');
  folder.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity');
  folder.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count');
  folder.open();
}
```

现在我们可以调整这些设置

{{{example url ="../threejs-postprocessing-gui.html"}}}

这是实现我们自己后期效果的一小步。

后期效果需要使用着色器。着色器用称为GLSL（图形库着色语言）的语言编写 。对于这些文章，讲述整个是一个太大的话题。一些入门的资料 ，可以是[这篇文章](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html) 也可以是这本书 [the books of shaders](https://thebookofshaders.com/)。

我认为用一个例子去帮助你开始是有帮助的，因此让我们创建一个简单的GLSL后处理着色器。我们将制作一个使用某个颜色去改变图像的例子。

对于后期处理，THREE.js提供了一个有用的帮助器，称为ShaderPass。它需要一个对象，该对象的信息定义了顶点着色器，片段着色器和默认输入。它将处理设置要读取的纹理以获取上一遍的结果以及要渲染到 EffectComposers渲染目标之一或画布上的位置。

这是一个简单的后期处理着色器，它将之前的结果乘以颜色。

```js
const colorShader = {
  uniforms: {
    tDiffuse: { value: null },
    color:    { value: new THREE.Color(0x88CCFF) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    void main() {
      vec4 previousPassColor = texture2D(tDiffuse, vUv);
      gl_FragColor = vec4(
          previousPassColor.rgb * color,
          previousPassColor.a);
    }
  `,
};
```

上面`tDiffuse`是`ShaderPass`用来传递上一个`pass`纹理的名称，因此我们几乎总是需要它。然后，我们声明`color` 为一个THREE.js Color。

接下来，我们需要一个顶点着色器。对于后期处理，此处显示的顶点着色器几乎是标准的，几乎不需要更改。变量`uv`没有进入太多细节（见上面链接文章），`projectionMatrix`， `modelViewMatrix`和`position`都奇迹般地被three.js所增加。

最后，我们创建一个片段着色器。在此行中，我们从上一个`pass`获得了该行的像素颜色

```glsl
vec4 previousPassColor =  texture2D（tDiffuse，vUv）;
```

我们用我们的颜色乘它然后设置`gl_FragColor`为计算的结果

```glsl
gl_FragColor = vec4(
    previousPassColor.rgb * color,
    previousPassColor.a);
```

添加一些简单的GUI来设置颜色的3个值

```js

const gui = new GUI();
gui.add(colorPass.uniforms.color.value, 'r', 0, 4).name('red');
gui.add(colorPass.uniforms.color.value, 'g', 0, 4).name('green');
gui.add(colorPass.uniforms.color.value, 'b', 0, 4).name('blue');
```

上述代码帮我们做了一个简单的后处理效果,乘以一种颜色

{{{example url ="../threejs-postprocessing-custom.html"}}}

如前所述，对于这些文章来说，要讲述如何编写GLSL和自定义着色器的所有细节太多了。如果您真的想知道WebGL本身是如何工作的，请查看[这些文章](https://webglfundamentals.org)。另一个很棒的资源是[read through the existing post processing shaders in the THREE.js repo](https://github.com/mrdoob/three.js/tree/master/examples/js/shaders)。有些是较为复杂的，但是如果你从简单开始，你会大概率能够了解它们是如何工作的。

不幸的是，THREE.js存储库中的大多数后期处理效果都没有记录在案，因此要使用它们，你必须通读[示例](https://github.com/mrdoob/three.js/tree/master/examples)或者[源码](https://github.com/mrdoob/three.js/tree/master/examples/js/postprocessing)。希望这些简单的示例以及有关[render targets](notion://www.notion.so/threejs-rendertargets.html)的文章 提供足够的上下文来帮助你开始