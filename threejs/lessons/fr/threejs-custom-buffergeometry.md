Title: Three.js Custom BufferGeometry
Description: How to make your own BufferGeometry.
TOC: Custom BufferGeometry

`BufferGeometry` is three.js's way of representing all geometry. A `BufferGeometry`
essentially a collection *named* of `BufferAttribute`s.
Each `BufferAttribute` represents an array of one type of data: positions,
normals, colors, uv, etc... Together, the named `BufferAttribute`s represent
*parallel arrays* of all the data for each vertex.

<div class="threejs_center"><img src="../resources/threejs-attributes.svg" style="width: 700px"></div>

Above you can see we have 4 attributes: `position`, `normal`, `color`, `uv`.
They represent *parallel arrays* which means that the Nth set of data in each
attribute belongs to the same vertex. The vertex at index = 4 is highlighted
to show that the parallel data across all attributes defines one vertex.

This brings up a point, here's a diagram of a cube with one corner highlighted.

<div class="threejs_center"><img src="../resources/cube-faces-vertex.svg" style="width: 500px"></div>

Thinking about it that single corner needs a different normal for each face of the
cube. A normal is info about which direction something faces. In the diagram
the normals are presented by the arrows around the corner vertex showing that each
face that shares that vertex position needs a normal that points in a different direction.

That corner needs different UVs for each face as well. UVs are texture coordinates
that specify which part of a texture being drawn on a triangle corresponds to that
vertex position. You can see the green face needs that vertex to have a UV that corresponds
to the top right corner of the F texture, the blue face needs a UV that corresponds to the
top left corner of the F texture, and the red face needs a UV that corresponds to the bottom
left corner of the F texture.

A single *vertex* is the combination of all of its parts. If a vertex needs any
part to be different then it must be a different vertex.

As a simple example let's make a cube using `BufferGeometry`. A cube is interesting
because it appears to share vertices at the corners but really
does not. For our example we'll list out all the vertices with all their data
and then convert that data into parallel arrays and finally use those to make
`BufferAttribute`s and add them to a `BufferGeometry`.

We start with a list of all the data needed for the cube. Remember again
that if a vertex has any unique parts it has to be a separate vertex. As such
to make a cube requires 36 vertices. 2 triangles per face, 3 vertices per triangle,
6 faces = 36 vertices.

```js
const vertices = [
  // front
  { pos: [-1, -1,  1], norm: [ 0,  0,  1], uv: [0, 0], },
  { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], },
  { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], },

  { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], },
  { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], },
  { pos: [ 1,  1,  1], norm: [ 0,  0,  1], uv: [1, 1], },
  // right
  { pos: [ 1, -1,  1], norm: [ 1,  0,  0], uv: [0, 0], },
  { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], },
  { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], },

  { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], },
  { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], },
  { pos: [ 1,  1, -1], norm: [ 1,  0,  0], uv: [1, 1], },
  // back
  { pos: [ 1, -1, -1], norm: [ 0,  0, -1], uv: [0, 0], },
  { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], },
  { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], },

  { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], },
  { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], },
  { pos: [-1,  1, -1], norm: [ 0,  0, -1], uv: [1, 1], },
  // left
  { pos: [-1, -1, -1], norm: [-1,  0,  0], uv: [0, 0], },
  { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], },
  { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], },

  { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], },
  { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], },
  { pos: [-1,  1,  1], norm: [-1,  0,  0], uv: [1, 1], },
  // top
  { pos: [ 1,  1, -1], norm: [ 0,  1,  0], uv: [0, 0], },
  { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], },
  { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], },

  { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], },
  { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], },
  { pos: [-1,  1,  1], norm: [ 0,  1,  0], uv: [1, 1], },
  // bottom
  { pos: [ 1, -1,  1], norm: [ 0, -1,  0], uv: [0, 0], },
  { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], },
  { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], },

  { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], },
  { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], },
  { pos: [-1, -1, -1], norm: [ 0, -1,  0], uv: [1, 1], },
];
```

We can then translate all of that into 3 parallel arrays

```js
const positions = [];
const normals = [];
const uvs = [];
for (const vertex of vertices) {
  positions.push(...vertex.pos);
  normals.push(...vertex.norm);
  uvs.push(...vertex.uv);
}
```

Finally we can create a `BufferGeometry` and then a `BufferAttribute` for each array
and add it to the `BufferGeometry`.

```js
  const geometry = new THREE.BufferGeometry();
  const positionNumComponents = 3;
  const normalNumComponents = 3;
  const uvNumComponents = 2;
  geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
  geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
  geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
```

Note that the names are significant. You must name your attributes the names
that match what three.js expects (unless you are creating a custom shader).
In this case `position`, `normal`, and `uv`. If you want vertex colors then
name your attribute `color`.

Above we created 3 JavaScript native arrays, `positions`, `normals` and `uvs`.
We then convert those into
[TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)
of type `Float32Array`. A `BufferAttribute` requires a TypedArray not a native
array. A `BufferAttribute` also requires you to tell it how many components there
are per vertex. For the positions and normals we have 3 components per vertex,
x, y, and z. For the UVs we have 2, u and v.

{{{example url="custom-buffergeometry-cube.html"}}}

That's a lot of data. A small thing we can do is use indices to reference
the vertices. Looking back at our cube data, each face is made from 2 triangles
with 3 vertices each, 6 vertices total, but 2 of those vertices are exactly the same;
The same position, the same normal, and the same uv.
So, we can remove the matching vertices and then
reference them by index. First we remove the matching vertices.

```js
const vertices = [
  // front
  { pos: [-1, -1,  1], norm: [ 0,  0,  1], uv: [0, 0], }, // 0
  { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], }, // 1
  { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], }, // 2
-
-  { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], },
-  { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], },
  { pos: [ 1,  1,  1], norm: [ 0,  0,  1], uv: [1, 1], }, // 3
  // right
  { pos: [ 1, -1,  1], norm: [ 1,  0,  0], uv: [0, 0], }, // 4
  { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], }, // 5
-
-  { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], },
-  { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], },
  { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], }, // 6
  { pos: [ 1,  1, -1], norm: [ 1,  0,  0], uv: [1, 1], }, // 7
  // back
  { pos: [ 1, -1, -1], norm: [ 0,  0, -1], uv: [0, 0], }, // 8
  { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], }, // 9
-
-  { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], },
-  { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], },
  { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], }, // 10
  { pos: [-1,  1, -1], norm: [ 0,  0, -1], uv: [1, 1], }, // 11
  // left
  { pos: [-1, -1, -1], norm: [-1,  0,  0], uv: [0, 0], }, // 12
  { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], }, // 13
-
-  { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], },
-  { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], },
  { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], }, // 14
  { pos: [-1,  1,  1], norm: [-1,  0,  0], uv: [1, 1], }, // 15
  // top
  { pos: [ 1,  1, -1], norm: [ 0,  1,  0], uv: [0, 0], }, // 16
  { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], }, // 17
-
-  { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], },
-  { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], },
  { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], }, // 18
  { pos: [-1,  1,  1], norm: [ 0,  1,  0], uv: [1, 1], }, // 19
  // bottom
  { pos: [ 1, -1,  1], norm: [ 0, -1,  0], uv: [0, 0], }, // 20
  { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], }, // 21
-
-  { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], },
-  { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], },
  { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], }, // 22
  { pos: [-1, -1, -1], norm: [ 0, -1,  0], uv: [1, 1], }, // 23
];
```

So now we have 24 unique vertices. Then we specify 36 indices
for the 36 vertices we need drawn to make 12 triangles by calling `BufferGeometry.setIndex` with an array of indices.

```js
geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, positionNumComponents));
geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(normals, normalNumComponents));
geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(uvs, uvNumComponents));

+geometry.setIndex([
+   0,  1,  2,   2,  1,  3,  // front
+   4,  5,  6,   6,  5,  7,  // right
+   8,  9, 10,  10,  9, 11,  // back
+  12, 13, 14,  14, 13, 15,  // left
+  16, 17, 18,  18, 17, 19,  // top
+  20, 21, 22,  22, 21, 23,  // bottom
+]);
```

{{{example url="custom-buffergeometry-cube-indexed.html"}}}

`BufferGeometry` has a [`computeVertexNormals`](BufferGeometry.computeVertexNormals) method for computing normals if you
are not supplying them. Unfortunately, 
since positions can not be shared if any other part of a vertex is different,
the results of calling `computeVertexNormals` will generate seams if your
geometry is supposed to connect to itself like a sphere or a cylinder.

<div class="spread">
  <div>
    <div data-diagram="bufferGeometryCylinder"></div>
  </div>
</div>

For the cylinder above the normals were created using `computeVertexNormals`.
If you look closely there is a seam on the cylinder. This is because there
is no way to share the vertices at the start and end of the cylinder since they
require different UVs so the function to compute them has no idea those are
the same vertices to smooth over them. Just a small thing to be aware of.
The solution is to supply your own normals.

We can also use [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) from the start instead of native JavaScript arrays.
The disadvantage to TypedArrays is you must specify their size up front. Of
course that's not that large of a burden but with native arrays we can just
`push` values onto them and look at what size they end up by checking their
`length` at the end. With TypedArrays there is no push function so we need
to do our own bookkeeping when adding values to them.

In this example knowing the length up front is pretty easy since we're using
a big block of static data to start.

```js
-const positions = [];
-const normals = [];
-const uvs = [];
+const numVertices = vertices.length;
+const positionNumComponents = 3;
+const normalNumComponents = 3;
+const uvNumComponents = 2;
+const positions = new Float32Array(numVertices * positionNumComponents);
+const normals = new Float32Array(numVertices * normalNumComponents);
+const uvs = new Float32Array(numVertices * uvNumComponents);
+let posNdx = 0;
+let nrmNdx = 0;
+let uvNdx = 0;
for (const vertex of vertices) {
-  positions.push(...vertex.pos);
-  normals.push(...vertex.norm);
-  uvs.push(...vertex.uv);
+  positions.set(vertex.pos, posNdx);
+  normals.set(vertex.norm, nrmNdx);
+  uvs.set(vertex.uv, uvNdx);
+  posNdx += positionNumComponents;
+  nrmNdx += normalNumComponents;
+  uvNdx += uvNumComponents;
}

geometry.setAttribute(
    'position',
-    new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
+    new THREE.BufferAttribute(positions, positionNumComponents));
geometry.setAttribute(
    'normal',
-    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
+    new THREE.BufferAttribute(normals, normalNumComponents));
geometry.setAttribute(
    'uv',
-    new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
+    new THREE.BufferAttribute(uvs, uvNumComponents));

geometry.setIndex([
   0,  1,  2,   2,  1,  3,  // front
   4,  5,  6,   6,  5,  7,  // right
   8,  9, 10,  10,  9, 11,  // back
  12, 13, 14,  14, 13, 15,  // left
  16, 17, 18,  18, 17, 19,  // top
  20, 21, 22,  22, 21, 23,  // bottom
]);
```

{{{example url="custom-buffergeometry-cube-typedarrays.html"}}}

A good reason to use typedarrays is if you want to dynamically update any
part of the vertices.

I couldn't think of a really good example of dynamically updating the vertices
so I decided to make a sphere and move each quad in and out from the center. Hopefully
it's a useful example.

Here's the code to generate positions and indices for a sphere. The code
is sharing vertices within a quad but it's not sharing vertices between
quads because we want to be able to move each quad separately.

Because I'm lazy I used a small hierarchy of 3 `Object3D` objects to compute
sphere points. How this works is explained in [the article on optimizing lots of objects](optimize-lots-of-objects.html).

```js
function makeSpherePositions(segmentsAround, segmentsDown) {
  const numVertices = segmentsAround * segmentsDown * 6;
  const numComponents = 3;
  const positions = new Float32Array(numVertices * numComponents);
  const indices = [];

  const longHelper = new THREE.Object3D();
  const latHelper = new THREE.Object3D();
  const pointHelper = new THREE.Object3D();
  longHelper.add(latHelper);
  latHelper.add(pointHelper);
  pointHelper.position.z = 1;
  const temp = new THREE.Vector3();

  function getPoint(lat, long) {
    latHelper.rotation.x = lat;
    longHelper.rotation.y = long;
    longHelper.updateMatrixWorld(true);
    return pointHelper.getWorldPosition(temp).toArray();
  }

  let posNdx = 0;
  let ndx = 0;
  for (let down = 0; down < segmentsDown; ++down) {
    const v0 = down / segmentsDown;
    const v1 = (down + 1) / segmentsDown;
    const lat0 = (v0 - 0.5) * Math.PI;
    const lat1 = (v1 - 0.5) * Math.PI;

    for (let across = 0; across < segmentsAround; ++across) {
      const u0 = across / segmentsAround;
      const u1 = (across + 1) / segmentsAround;
      const long0 = u0 * Math.PI * 2;
      const long1 = u1 * Math.PI * 2;

      positions.set(getPoint(lat0, long0), posNdx);  posNdx += numComponents;
      positions.set(getPoint(lat1, long0), posNdx);  posNdx += numComponents;
      positions.set(getPoint(lat0, long1), posNdx);  posNdx += numComponents;
      positions.set(getPoint(lat1, long1), posNdx);  posNdx += numComponents;

      indices.push(
        ndx, ndx + 1, ndx + 2,
        ndx + 2, ndx + 1, ndx + 3,
      );
      ndx += 4;
    }
  }
  return {positions, indices};
}
```

We can then call it like this

```js
const segmentsAround = 24;
const segmentsDown = 16;
const {positions, indices} = makeSpherePositions(segmentsAround, segmentsDown);
```

Because positions returned are unit sphere positions so they are exactly the same
values we need for normals so we can just duplicated them for the normals.

```js
const normals = positions.slice();
```

And then we setup the attributes like before

```js
const geometry = new THREE.BufferGeometry();
const positionNumComponents = 3;
const normalNumComponents = 3;

+const positionAttribute = new THREE.BufferAttribute(positions, positionNumComponents);
+positionAttribute.setUsage(THREE.DynamicDrawUsage);
geometry.setAttribute(
    'position',
+    positionAttribute);
geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(normals, normalNumComponents));
geometry.setIndex(indices);
```

I've highlighted a few differences. We save a reference to the position attribute.
We also mark it as dynamic. This is a hint to THREE.js that we're going to be changing
the contents of the attribute often.

In our render loop we update the positions based off their normals every frame.

```js
const temp = new THREE.Vector3();

...

for (let i = 0; i < positions.length; i += 3) {
  const quad = (i / 12 | 0);
  const ringId = quad / segmentsAround | 0;
  const ringQuadId = quad % segmentsAround;
  const ringU = ringQuadId / segmentsAround;
  const angle = ringU * Math.PI * 2;
  temp.fromArray(normals, i);
  temp.multiplyScalar(THREE.MathUtils.lerp(1, 1.4, Math.sin(time + ringId + angle) * .5 + .5));
  temp.toArray(positions, i);
}
positionAttribute.needsUpdate = true;
```

And we set `positionAttribute.needsUpdate` to tell THREE.js to use our changes.

{{{example url="custom-buffergeometry-dynamic.html"}}}

I hope these were useful examples of how to use `BufferGeometry` directly to
make your own geometry and how to dynamically update the contents of a
`BufferAttribute`.

<!-- needed in English only to prevent warning from outdated translations -->
<a href="resources/threejs-geometry.svg"></a>
<a href="custom-geometry.html"></a>

<canvas id="c"></canvas>
<script type="module" src="../resources/threejs-custom-buffergeometry.js"></script>

