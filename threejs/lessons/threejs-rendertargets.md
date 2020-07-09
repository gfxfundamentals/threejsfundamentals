Title: Three.js Render Targets
Description: How to render to a texture.
TOC: Render Targets

A render target in three.js is basically a texture you can render to.
After you render to it you can use that texture like any other texture.

Let's make a simple example. We'll start with an example from [the article on responsiveness](threejs-responsive.html).

Rendering to a render target is almost exactly the same as normal rendering. First we create a `WebGLRenderTarget`.

```js
const rtWidth = 512;
const rtHeight = 512;
const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
```

Then we need a `Camera` and a `Scene`

```js
const rtFov = 75;
const rtAspect = rtWidth / rtHeight;
const rtNear = 0.1;
const rtFar = 5;
const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
rtCamera.position.z = 2;

const rtScene = new THREE.Scene();
rtScene.background = new THREE.Color('red');
```

Notice we set the aspect to the aspect for the render target, not the canvas.
The correct aspect to use depends on what we are rendering for. In this case
we'll use the render target's texture on the side of a cube. Since faces of
the cube are square we want an aspect of 1.0.

We fill the scene with stuff. In this case we're using the light and the 3 cubes [from the previous article](threejs-responsive.html).

```js
{
  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
*  rtScene.add(light);
}

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

function makeInstance(geometry, color, x) {
  const material = new THREE.MeshPhongMaterial({color});

  const cube = new THREE.Mesh(geometry, material);
*  rtScene.add(cube);

  cube.position.x = x;

  return cube;
}

*const rtCubes = [
  makeInstance(geometry, 0x44aa88,  0),
  makeInstance(geometry, 0x8844aa, -2),
  makeInstance(geometry, 0xaa8844,  2),
];
```

The `Scene` and `Camera` from the previous article are still there. We'll use them to render to the canvas.
We just need to add stuff to render.

Let's add a cube that uses the render target's texture.

```js
const material = new THREE.MeshPhongMaterial({
  map: renderTarget.texture,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

Now at render time first we render the render target scene to the render target.

```js
function render(time) {
  time *= 0.001;

  ...

  // rotate all the cubes in the render target scene
  rtCubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * .1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });

  // draw render target scene to render target
  renderer.setRenderTarget(renderTarget);
  renderer.render(rtScene, rtCamera);
  renderer.setRenderTarget(null);
```

Then we render the scene with the single cube that is using the render target's texture to the canvas.

```js
  // rotate the cube in the scene
  cube.rotation.x = time;
  cube.rotation.y = time * 1.1;

  // render the scene to the canvas
  renderer.render(scene, camera);
```

And voilà

{{{example url="../threejs-render-target.html" }}}

The cube is red because we set the `background` of the `rtScene` to red so the
render target's texture is being cleared to red.

Render targets are used for all kinds of things. [Shadows](threejs-shadows.html) use render targets.
[Picking can use a render target](threejs-picking.html). Various kinds of
[post processing effects](threejs-post-processing.html) require render targets.
Rendering a rear view mirror in a car or a live view on a monitor inside a 3D
scene might use a render target.

A few notes about using `WebGLRenderTarget`.

* By default `WebGLRenderTarget` creates 2 textures. A color texture and a depth/stencil texture. If you don't need the depth or stencil textures you can request to not create them by passing in options. Example:

    ```js
    const rt = new THREE.WebGLRenderTarget(width, height, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    ```

* You might need to change the size of a render target

  In the example above we make a render target of a fixed size, 512x512. For things like post processing you generally need to make a render target the same size as your canvas. In our code that would mean when we change the canvas size we would also update both the render target size and the camera we're using when rendering to the render target. Example:

      function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();

      +    renderTarget.setSize(canvas.width, canvas.height);
      +    rtCamera.aspect = camera.aspect;
      +    rtCamera.updateProjectionMatrix();
      }
