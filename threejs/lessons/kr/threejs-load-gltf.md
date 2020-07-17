Title: Three.js에서 .GLTF 파일 불러오기
Description: .GLTF 파일을 불러오는 법을 배웁니다
TOC: .GLTF 파일 불러오기

이전 글에서는 [.OBJ 파일을 불러오는 법](threejs-load-obj.html)에 대해
배웠습니다. 이전 글을 읽지 않았다면 먼저 읽고 오길 권장합니다.

이전 글에서 말했듯 .OBJ 파일은 굉장히 오래된 파일 형식이고 구성이 간단합니다.
애초에 3D 에디터끼리 간단히 데이터를 주고 받을 것을 목적으로 만들었기에 씬
그래프라는 개념이 없죠. 하나의 거대한 mesh입니다.

[gLTF 형식](https://github.com/KhronosGroup/glTF)은 애초부터 그래픽 요소를
표현하기 위해 설계된 파일 형식입니다. 3D 파일 형식은 크게 3, 4개 형식으로 나눌
수 있죠.

* 3D 에디터 형식

  특정 프로그램을 위한 파일 형식입니다. .blend(블렌더), .max(3D Studio Max),
  .mb, .ma(마야) 등이 있죠.

* 교환 형식

  여기에 .OBJ, .DAE(Collada), .FBX 등이 여기에 속합니다. 3D 에디터끼리 데이터를
  교환하기 위해 고안된 형식으로, 보통 3D 에디터 내부에서 사용하는 것보다 더 많은
  데이터를 포함합니다.

* 앱 형식

  특정 앱이나 게임 등에서 사용하는 파일 형식입니다.

* 전달(transmission) 형식

  glTF가 첫 전달 형식 파일입니다. 굳이 따지자면 VRML이 처음이라고 할 수도 있으나,
  VRML은 부족한 점이 많습니다.

  glTF는 기존 파일 형식에서 부진한 점을 보완한 형식으로, 크게 다음 면에서 기존 형식보다
  뛰어납니다.

  1. 전달 시 파일 용량 최적화

    정점 등의 큰 데이터를 이진수(binary) 형태로 저장하는 것을 의미합니다. glTF 파일을
    사용하면 별도의 가공 과정 없이 데이터를 GPU에 바로 로드할 수 있죠. 반면 VRML, .OBJ,
    .DAE 등의 형식은 이런 데이터를 텍스트로 저장하여 파싱 과정이 필요합니다. 텍스트 기반의
    정점 데이터는 이진수 데이터보다 3배에서 많게는 5배까지 큽니다.

  2. 렌더링 최적화

    앱 형식을 제외한 다른 파일 형식과 다른 점입니다. glTF 형식의 데이터는 수정이 아니라,
    렌더링에 최적화되어 있습니다. 일반적으로 렌더링에 필요없는 데이터를 제거하는데, 예를
    들어 다각형을 glTF 형식으로 저장하면 전부 삼각형으로 변환됩니다. 적용할 재질 데이터도
    전부 지정되어 있죠.

glTF는 특정 목적으로 고안되었기에 대부분의 경우 glTF 파일을 다운받아 사용하는 것은
큰 문제가 없습니다. 다른 형식을 사용할 때는 대부분 조금씩 문제가 있었는데, 이번에는
아니길 빌어봐야겠네요.

사실 예제 하나로는 glTF를 전부 소개하기 어렵습니다. 단순한 glTF 파일은 .OBJ 파일보다
사용하기가 쉬운 경우도 많고, .OBJ 파일과 달리 재질(materials)을 파일 안에 포함하거든요.
그러니 파일을 하나 골라 불러오고, 이 과정에서 발생하는 문제를 해결하는 것이 더 도움이
될 듯합니다.

인터넷 검색으로 [로우-폴리(low-poly) 마을](https://sketchfab.com/models/edd1c604e1e045a0a2a552ddd9a293e6)을
하나 찾았습니다(작가: [antonmoek](https://sketchfab.com/antonmoek)). 뭔가 괜찮은
예제가 나올 것 같은 예감이 드네요.

<div class="threejs_center"><img src="resources/images/cartoon_lowpoly_small_city_free_pack.jpg"></div>

[.OBJ에 관한 글에서 썼던 예제](threejs-load-obj.html)를 가져와 .OBJ 파일을 불러오는
코드를 .GLTF를 불러오는 코드로 바꾸겠습니다.

아래의 기존 코드를

```js
const objLoader = new OBJLoader2();
objLoader.loadMtl('resources/models/windmill/windmill-fixed.mtl', null, (materials) => {
  materials.Material.side = THREE.DoubleSide;
  objLoader.setMaterials(materials);
  objLoader.load('resources/models/windmill/windmill.obj', (event) => {
    const root = event.detail.loaderRootNode;
    scene.add(root);
    ...
  });
});
```

.GLTF를 불러오는 코드로 바꿉니다.

```js
{
  const gltfLoader = new GLTFLoader();
  const url = 'resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf';
  gltfLoader.load(url, (gltf) => {
    const root = gltf.scene;
    scene.add(root);
    ...
  });
```

자동으로 카메라의 시야를 조정하는 코드는 그대로 두었습니다.

모듈이 바뀌었으니 import 문도 변경해야 합니다. `OBJLoader2`를 제거하고 `GLTFLoader`를
추가합니다.

```html
-import { LoaderSupport } from './resources/threejs/r115/examples/jsm/loaders/LoaderSupport.js';
-import { OBJLoader2 } from './resources/threejs/r115/examples/jsm/loaders/OBJLoader2.js';
-import { MTLLoader } from './resources/threejs/r115/examples/jsm/loaders/MTLLoader.js';
+import { GLTFLoader } from './resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
```

이제 실행해보죠.

{{{example url="../threejs-load-gltf.html" }}}

이런 걸 마법이라고 하나봅니다. 텍스처를 비롯해 모든 게 한 번에 완성됐네요.

여기에 자동차가 도로를 따라 달리도록 할 수 있다면 더 멋있겠습니다. 먼저 장면(scene)에서
차가 별도의 요소인지 확인하고, 별도의 요소라면 이 요소를 다룰 수 있는 방법을 찾아야 합니다.

먼저 간단하게 함수를 만들어 씬 그래프를 [자바스크립트 콘솔](threejs-debugging-javascript.html)에
띄워보겠습니다.

```js
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
  const localPrefix = isLast ? '└─' : '├─';
  lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
  const newPrefix = prefix + (isLast ? '  ' : '│ ');
  const lastNdx = obj.children.length - 1;
  obj.children.forEach((child, ndx) => {
    const isLast = ndx === lastNdx;
    dumpObject(child, lines, isLast, newPrefix);
  });
  return lines;
}
```

씬을 전부 불러온 뒤, 만든 함수를 호출합니다.

```js
const gltfLoader = new GLTFLoader();
gltfLoader.load('resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
  const root = gltf.scene;
  scene.add(root);
  console.log(dumpObject(root).join('\n'));
```

[코드를 실행하니](../threejs-load-gltf-dump-scenegraph.html) 아래와 같은 결과가
나왔습니다.

```text
OSG_Scene [Scene]
  └─RootNode_(gltf_orientation_matrix) [Object3D]
    └─RootNode_(model_correction_matrix) [Object3D]
      └─4d4100bcb1c640e69699a87140df79d7fbx [Object3D]
        └─RootNode [Object3D]
          │ ...
          ├─Cars [Object3D]
          │ ├─CAR_03_1 [Object3D]
          │ │ └─CAR_03_1_World_ap_0 [Mesh]
          │ ├─CAR_03 [Object3D]
          │ │ └─CAR_03_World_ap_0 [Mesh]
          │ ├─Car_04 [Object3D]
          │ │ └─Car_04_World_ap_0 [Mesh]
          │ ├─CAR_03_2 [Object3D]
          │ │ └─CAR_03_2_World_ap_0 [Mesh]
          │ ├─Car_04_1 [Object3D]
          │ │ └─Car_04_1_World_ap_0 [Mesh]
          │ ├─Car_04_2 [Object3D]
          │ │ └─Car_04_2_World_ap_0 [Mesh]
          │ ├─Car_04_3 [Object3D]
          │ │ └─Car_04_3_World_ap_0 [Mesh]
          │ ├─Car_04_4 [Object3D]
          │ │ └─Car_04_4_World_ap_0 [Mesh]
          │ ├─Car_08_4 [Object3D]
          │ │ └─Car_08_4_World_ap8_0 [Mesh]
          │ ├─Car_08_3 [Object3D]
          │ │ └─Car_08_3_World_ap9_0 [Mesh]
          │ ├─Car_04_1_2 [Object3D]
          │ │ └─Car_04_1_2_World_ap_0 [Mesh]
          │ ├─Car_08_2 [Object3D]
          │ │ └─Car_08_2_World_ap11_0 [Mesh]
          │ ├─CAR_03_1_2 [Object3D]
          │ │ └─CAR_03_1_2_World_ap_0 [Mesh]
          │ ├─CAR_03_2_2 [Object3D]
          │ │ └─CAR_03_2_2_World_ap_0 [Mesh]
          │ ├─Car_04_2_2 [Object3D]
          │ │ └─Car_04_2_2_World_ap_0 [Mesh]
          ...
```

살펴보니 모든 자동차는 `"Cars"`라는 부모의 자식이네요.

```text
*          ├─Cars [Object3D]
          │ ├─CAR_03_1 [Object3D]
          │ │ └─CAR_03_1_World_ap_0 [Mesh]
          │ ├─CAR_03 [Object3D]
          │ │ └─CAR_03_World_ap_0 [Mesh]
          │ ├─Car_04 [Object3D]
          │ │ └─Car_04_World_ap_0 [Mesh]
```

간단히 테스트를 해봅시다. 먼저 "Cars"의 자식 요소 전부를 Y축을 기준으로
회전시켜보겠습니다.

장면을 불러온 뒤, "Cars" 요소를 참조해 변수로 저장합니다.

```js
+let cars;
{
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
    const root = gltf.scene;
    scene.add(root);
+    cars = root.getObjectByName('Cars');
```

그리고 `render` 함수 안에서 `cars`의 자식 요소를 전부 회전시킵니다.

```js
+function render(time) {
+  time *= 0.001;  // convert to seconds

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

+  if (cars) {
+    for (const car of cars.children) {
+      car.rotation.y = time;
+    }
+  }

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
```

잘 작동하는지 볼까요?

{{{example url="../threejs-load-gltf-rotate-cars.html" }}}

음... 기준축이 제각각인 것을 보니 이 파일을 만든 디자이너가 애니메이션까지
고려하지는 않은 듯합니다. 트럭들이 전부 이상한 방향으로 도네요.

이처럼 3D 프로젝트를 진행할 때는 목적에 따라 개체를 디자인해야 합니다. 그래야
기준축이나, 크기 등이 제대로 적용될 테니까요.

저는 디자이너도 아니고 블렌더를 그다지 잘 하지도 못하기에, 편법을 사용하겠습니다.
각각의 자동차에 별도의 `Object3D`를 만들어 자동차를 이 `Object3D`의 자식으로
지정할 겁니다. 이러면 자동차가 아닌 `Object3D`로 차를 움직일 수 있고, 자동차의
기준축도 별도로 설정할 수 있죠.

아까 봤던 씬 그래프를 다시 보니 자동차의 종류는 총 3개인 듯합니다. "Car_08",
"CAR_03", "Car_04" 이렇게요. 종류별로 조정했을 때 제대로 적용되는지 봅시다.

아래의 코드는 각 자동차를 새로운 `Object3D`의 자식으로 지정하고, 이 `Object3D`를
장면에 추가한 뒤, 자동차의 *종류별로* 기준축을 정렬합니다. 그리고 새로 만든
`Object3D`를 `cars` 배열에 추가하죠.

```js
-let cars;
+const cars = [];
{
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
    const root = gltf.scene;
    scene.add(root);

-    cars = root.getObjectByName('Cars');
+    const loadedCars = root.getObjectByName('Cars');
+    const fixes = [
+      { prefix: 'Car_08', rot: [Math.PI * .5, 0, Math.PI +* .5], },
+      { prefix: 'CAR_03', rot: [0, Math.PI, 0], },
+      { prefix: 'Car_04', rot: [0, Math.PI, 0], },
+    ];
+
+    root.updateMatrixWorld();
+    for (const car of loadedCars.children.slice()) {
+      const fix = fixes.find(fix => car.name.startsWith(fix.prefix));
+      const obj = new THREE.Object3D();
+      car.getWorldPosition(obj.position);
+      car.position.set(0, 0, 0);
+      car.rotation.set(...fix.rot);
+      obj.add(car);
+      scene.add(obj);
+      cars.push(obj);
+    }
     ...
```

이제 기준축이 제대로 정렬되었습니다.

{{{example url="../threejs-load-gltf-rotate-cars-fixed.html" }}}

이제 자동차를 달리게 만들어봅시다.

간단한 이동 시스템이라고 해도 튜토리얼에서 다루기에는 다소 복잡합니다. 대신
도로 전체를 달리는 뒤얽힌 경로를 만들어 자동차를 해당 경로에 놓을 수는 있죠.
아래 스크린샷은 경로를 반쯤 완성했을 때 블렌더의 화면을 캡쳐한 것입니다.

<div class="threejs_center"><img src="resources/images/making-path-for-cars.jpg" style="width: 1094px"></div>

이제 블렌더에서 데이터를 추출해야 합니다. 다행히 경로만을 골라 내보낼 수 있네요.
"write nurbs"를 체크해 경로를 .OBJ 파일로 내보냅니다.

<div class="threejs_center"><img src="resources/images/blender-export-obj-write-nurbs.jpg" style="width: 498px"></div>

.OBJ 파일을 열어보니 각 정점 데이터가 있습니다. 이를 배열로 바꿔 사용하도록
하죠.

```js
const controlPoints = [
  [1.118281, 5.115846, -3.681386],
  [3.948875, 5.115846, -3.641834],
  [3.960072, 5.115846, -0.240352],
  [3.985447, 5.115846, 4.585005],
  [-3.793631, 5.115846, 4.585006],
  [-3.826839, 5.115846, -14.736200],
  [-14.542292, 5.115846, -14.765865],
  [-14.520929, 5.115846, -3.627002],
  [-5.452815, 5.115846, -3.634418],
  [-5.467251, 5.115846, 4.549161],
  [-13.266233, 5.115846, 4.567083],
  [-13.250067, 5.115846, -13.499271],
  [4.081842, 5.115846, -13.435463],
  [4.125436, 5.115846, -5.334928],
  [-14.521364, 5.115846, -5.239871],
  [-14.510466, 5.115846, 5.486727],
  [5.745666, 5.115846, 5.510492],
  [5.787942, 5.115846, -14.728308],
  [-5.423720, 5.115846, -14.761919],
  [-5.373599, 5.115846, -3.704133],
  [1.004861, 5.115846, -3.641834],
];
```

Three.js에는 몇 가지 곡선 클래스가 있습니다. 이 경우 `CatmullRomCurve3`가
적당하겠네요. 이런 곡선은 각 정점을 지나는 부드러운 곡선을 만든다는 것이
특징입니다.

만약 위 정점으로 곡선을 생성하면 다음 그림과 같은 곡선이 생길 겁니다.

<div class="threejs_center"><img src="resources/images/car-curves-before.png" style="width: 400px"></div>

모서리가 각지면 좀 더 깔끔할 듯하네요. 정점을 몇 개 더 추가해 원하는
결과를 만들어봅시다. 각 정점 짝마다 10% 아래에 하나, 두 정점 사이 90%
지점에 하나를 새로 만들어 `CatmullRomCurve3`에 넘겨주겠습니다.

우리가 원하는 곡선은 다음과 같죠.

<div class="threejs_center"><img src="resources/images/car-curves-after.png" style="width: 400px"></div>

아래는 곡선을 생성하는 코드입니다.

```js
let curve;
let curveObject;
{
  const controlPoints = [
    [1.118281, 5.115846, -3.681386],
    [3.948875, 5.115846, -3.641834],
    [3.960072, 5.115846, -0.240352],
    [3.985447, 5.115846, 4.585005],
    [-3.793631, 5.115846, 4.585006],
    [-3.826839, 5.115846, -14.736200],
    [-14.542292, 5.115846, -14.765865],
    [-14.520929, 5.115846, -3.627002],
    [-5.452815, 5.115846, -3.634418],
    [-5.467251, 5.115846, 4.549161],
    [-13.266233, 5.115846, 4.567083],
    [-13.250067, 5.115846, -13.499271],
    [4.081842, 5.115846, -13.435463],
    [4.125436, 5.115846, -5.334928],
    [-14.521364, 5.115846, -5.239871],
    [-14.510466, 5.115846, 5.486727],
    [5.745666, 5.115846, 5.510492],
    [5.787942, 5.115846, -14.728308],
    [-5.423720, 5.115846, -14.761919],
    [-5.373599, 5.115846, -3.704133],
    [1.004861, 5.115846, -3.641834],
  ];
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  curve = new THREE.CatmullRomCurve3(
    controlPoints.map((p, ndx) => {
      p0.set(...p);
      p1.set(...controlPoints[(ndx + 1) % controlPoints.length]);
      return [
        (new THREE.Vector3()).copy(p0),
        (new THREE.Vector3()).lerpVectors(p0, p1, 0.1),
        (new THREE.Vector3()).lerpVectors(p0, p1, 0.9),
      ];
    }).flat(),
    true,
  );
  {
    const points = curve.getPoints(250);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({color: 0xff0000});
    curveObject = new THREE.Line(geometry, material);
    scene.add(curveObject);
  }
}
```

코드의 첫 블럭에서 곡선을 만듭니다. 두 번째 블럭에서는 곡선에서 250개의
정점을 받은 뒤, 이 정점들을 이어 곡선을 시각화합니다.

하지만 [예제](../threejs-load-gltf-car-path.html)를 실행하니 곡선이 보이지
않습니다. 일단 어디에 있는지 확인하기 위해 깊이 테스트(depth test) 옵션을
끄고, 마지막에 렌더링하도록 설정하겠습니다.

```js
    curveObject = new THREE.Line(geometry, material);
+    material.depthTest = false;
+    curveObject.renderOrder = 1;
```

다시 예제를 실행해보니 곡선이 너무 작은 게 문제였네요.

<div class="threejs_center"><img src="resources/images/car-curves-too-small.png" style="width: 498px"></div>

블렌더로 계층 구조를 확인해보니 디자이너가 자동차 부모의 스케일(scale)을
건드렸습니다.

<div class="threejs_center"><img src="resources/images/cars-scale-0.01.png" style="width: 342px;"></div>

실제 3D 앱에서 스케일을 건드리는 것은 좋지 않습니다. 갖은 문제를 일으켜
개발자를 좌절의 굴레에 빠지게 하거든요. 디자이너 입장에서야 각각의 크기를
직접 수정하는 것보다 전체의 스케일을 조정하는 게 훨씬 편하겠지만, 실제 3D
앱 프로젝트에 참여한다면 디자이너에게 스케일을 건드리지 말라고 요청하기
바랍니다. 만약 디자이너가 스케일을 수정해야만 하는 경우라면, 앱을 만들 때
스케일을 무시할 수 있도록 정점에까지 스케일을 적용할 수 있는 방법을 찾아야
합니다.

이 예제의 경우는 스케일뿐만 아니라 자동차들의 회전값과 위치값까지 `Cars`
요소의 영향을 받습니다. 이러면 자동차가 돌아다니게 만들기가 훨씬 어렵죠.
물론 예제의 경우 차를 전역 공간 안에서 움직여야 하기에 어려움이 있지만,
지역 공간에서만 무언가를 조작하는 경우, 예를 들어 지구를 도는 달을 구현하는
경우는 이런 것이 큰 걸림돌이 되진 않습니다.

씬 그래프를 출력하기 위해 썼던 코드를 다시 가져와 이번에는 각 요소의
위치값(position), 회전값(rotation), 크기값(scale)까지 출력해봅시다.

```js
+function dumpVec3(v3, precision = 3) {
+  return `${v3.x.toFixed(precision)}, ${v3.y.toFixed(precision)}, ${v3.z.toFixed(precision)}`;
+}

function dumpObject(obj, lines, isLast = true, prefix = '') {
  const localPrefix = isLast ? '└─' : '├─';
  lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
+  const dataPrefix = obj.children.length
+     ? (isLast ? '  │ ' : '│ │ ')
+     : (isLast ? '    ' : '│   ');
+  lines.push(`${prefix}${dataPrefix}  pos: ${dumpVec3(obj.position)}`);
+  lines.push(`${prefix}${dataPrefix}  rot: ${dumpVec3(obj.rotation)}`);
+  lines.push(`${prefix}${dataPrefix}  scl: ${dumpVec3(obj.scale)}`);
  const newPrefix = prefix + (isLast ? '  ' : '│ ');
  const lastNdx = obj.children.length - 1;
  obj.children.forEach((child, ndx) => {
    const isLast = ndx === lastNdx;
    dumpObject(child, lines, isLast, newPrefix);
  });
  return lines;
}
```

[코드를 실행](../threejs-load-gltf-dump-scenegraph-extra.html)하니
다음과 같은 결과가 나옵니다.

```text
OSG_Scene [Scene]
  │   pos: 0.000, 0.000, 0.000
  │   rot: 0.000, 0.000, 0.000
  │   scl: 1.000, 1.000, 1.000
  └─RootNode_(gltf_orientation_matrix) [Object3D]
    │   pos: 0.000, 0.000, 0.000
    │   rot: -1.571, 0.000, 0.000
    │   scl: 1.000, 1.000, 1.000
    └─RootNode_(model_correction_matrix) [Object3D]
      │   pos: 0.000, 0.000, 0.000
      │   rot: 0.000, 0.000, 0.000
      │   scl: 1.000, 1.000, 1.000
      └─4d4100bcb1c640e69699a87140df79d7fbx [Object3D]
        │   pos: 0.000, 0.000, 0.000
        │   rot: 1.571, 0.000, 0.000
        │   scl: 1.000, 1.000, 1.000
        └─RootNode [Object3D]
          │   pos: 0.000, 0.000, 0.000
          │   rot: 0.000, 0.000, 0.000
          │   scl: 1.000, 1.000, 1.000
          ├─Cars [Object3D]
*          │ │   pos: -369.069, -90.704, -920.159
*          │ │   rot: 0.000, 0.000, 0.000
*          │ │   scl: 1.000, 1.000, 1.000
          │ ├─CAR_03_1 [Object3D]
          │ │ │   pos: 22.131, 14.663, -475.071
          │ │ │   rot: -3.142, 0.732, 3.142
          │ │ │   scl: 1.500, 1.500, 1.500
          │ │ └─CAR_03_1_World_ap_0 [Mesh]
          │ │       pos: 0.000, 0.000, 0.000
          │ │       rot: 0.000, 0.000, 0.000
          │ │       scl: 1.000, 1.000, 1.000
```

이제 보니 기존 장면의 `Cars`에 있던 회전값과 크기값이 자식에게 옮겨갔네요.
파일을 열었을 때와 렌더링했을 때의 데이터가 다른 이유는 아마 디자이너가
.GLTF 파일을 만들 때 쓴 프로그램이 무언가를 건드렸거나, 디자이너가 .blend
파일에서 조금 수정한 버젼으로 .GLTF 파일을 만들었기 때문일 겁니다.

진작 .blend 파일을 받아 직접 .GLTF 파일을 만들었더라면 좋았을 거라는 생각이
듭니다. 내보내기 전에 주요 요소를 점검해 불필요한 설정을 제거했으면 더
좋았을 텐데 말이죠.

아래의 이 요소들도

```text
OSG_Scene [Scene]
  │   pos: 0.000, 0.000, 0.000
  │   rot: 0.000, 0.000, 0.000
  │   scl: 1.000, 1.000, 1.000
  └─RootNode_(gltf_orientation_matrix) [Object3D]
    │   pos: 0.000, 0.000, 0.000
    │   rot: -1.571, 0.000, 0.000
    │   scl: 1.000, 1.000, 1.000
    └─RootNode_(model_correction_matrix) [Object3D]
      │   pos: 0.000, 0.000, 0.000
      │   rot: 0.000, 0.000, 0.000
      │   scl: 1.000, 1.000, 1.000
      └─4d4100bcb1c640e69699a87140df79d7fbx [Object3D]
        │   pos: 0.000, 0.000, 0.000
        │   rot: 1.571, 0.000, 0.000
        │   scl: 1.000, 1.000, 1.000
```

전부 불필요한 것들이고요.

위치값도, 회전값도, 크기값도 없는 하나의 "root" 요소가 있는 게 더 이상적입니다.
런타임에 루트 요소의 자식을 전부 꺼내 장면 자체의 자식으로 지정하는 것은 어떨까요?
"Cars"와 루트 요소가 자동차를 찾는 데 도움이 될 수는 있으나, 이 역시 별도의 위치값,
회전값, 크기값이 없는 게 나으니 간단히 장면을 자동차의 부모로 지정하는 것은요?

가장 최선의 해결책은 아니지만, 곡선 자체의 크기를 키우는 게 가장 빠른 해결책이긴
합니다.

일단 저는 마지막 해결책을 선택하겠습니다.

먼저 곡선의 위치를 옮겨 적당한 위치에 둔 뒤 곡선을 숨깁니다.

```js
{
  const points = curve.getPoints(250);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({color: 0xff0000});
  curveObject = new THREE.Line(geometry, material);
+  curveObject.scale.set(100, 100, 100);
+  curveObject.position.y = -621;
+  curveObject.visible = false;
  material.depthTest = false;
  curveObject.renderOrder = 1;
  scene.add(curveObject);
}
```

다음으로 자동차가 곡선을 따라 달리도록 코드를 작성합니다. 자동차마다 곡선에 비례해
0에서 1사이의 위치를 정한 뒤, `curveObject`를 이용해 전역 공간에서의 위치값을
구합니다. 그리고 곡선의에서 조금 더 낮은 값을 구한 뒤, `looAt` 메서드를 이용해
자동차가 이 점을 바라보도록 설정하고, 자동차를 위치값과 방금 구한 점 중간에 둡니다.

```js
// 경로를 계산할 때 쓸 Vector3 객체를 생성합니다
const carPosition = new THREE.Vector3();
const carTarget = new THREE.Vector3();

function render(time) {
  ...

-  for (const car of cars) {
-    car.rotation.y = time;
-  }

+  {
+    const pathTime = time * .01;
+    const targetOffset = 0.01;
+    cars.forEach((car, ndx) => {
+      // 0에서 1사이의 값으로, 자동차의 간격을 균일하게 배치합니다
+      const u = pathTime + ndx / cars.length;
+
+      // 첫 번째 점을 구합니다
+      curve.getPointAt(u % 1, carPosition);
+      carPosition.applyMatrix4(curveObject.matrixWorld);
+
+      // 곡선을 따라 첫 번째 점보다 조금 낮은 두 번째 점을 구합니다
+      curve.getPointAt((u + targetOffset) % 1, carTarget);
+      carTarget.applyMatrix4(curveObject.matrixWorld);
+
+      // (임시로) 자동차를 첫 번째 점에 둡니다
+      car.position.copy(carPosition);
+      // 자동차가 두 번째 점을 바라보게 합니다
+      car.lookAt(carTarget);
+
+      // 차를 두 점 중간에 둡니다
+      car.position.lerpVectors(carPosition, carTarget, 0.5);
+    });
+  }
```

실행시켜보니 자동차의 높이 기준도 제각기네요. 각 자동차의 위치값을 조금씩 수정하겠습니다.

```js
const loadedCars = root.getObjectByName('Cars');
const fixes = [
-  { prefix: 'Car_08', rot: [Math.PI * .5, 0, Math.PI * .5], },
-  { prefix: 'CAR_03', rot: [0, Math.PI, 0], },
-  { prefix: 'Car_04', rot: [0, Math.PI, 0], },
+  { prefix: 'Car_08', y: 0,  rot: [Math.PI * .5, 0, Math.PI * .5], },
+  { prefix: 'CAR_03', y: 33, rot: [0, Math.PI, 0], },
+  { prefix: 'Car_04', y: 40, rot: [0, Math.PI, 0], },
];

root.updateMatrixWorld();
for (const car of loadedCars.children.slice()) {
  const fix = fixes.find(fix => car.name.startsWith(fix.prefix));
  const obj = new THREE.Object3D();
  car.getWorldPosition(obj.position);
-  car.position.set(0, 0, 0);
+  car.position.set(0, fix.y, 0);
  car.rotation.set(...fix.rot);
  obj.add(car);
  scene.add(obj);
  cars.push(obj);
}
```

{{{example url="../threejs-load-gltf-animated-cars.html" }}}

몇 분 투자한 것 치고는 괜찮은 결과물이네요!

마지막으로 그림자까지 추가하면 완벽할 것 같습니다.

[그림자에 관한 글](threejs-shadows.html)의 `DirectionalLight` 그림자 예제를 가져와
그대로 코드에 붙여 넣습니다.

그리고 파일을 불러온 뒤, 모든 요소의 그림자 설정을 켜줍니다.

```js
{
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
    const root = gltf.scene;
    scene.add(root);

+    root.traverse((obj) => {
+      if (obj.castShadow !== undefined) {
+        obj.castShadow = true;
+        obj.receiveShadow = true;
+      }
+    });
```

그런데 그림자 헬퍼가 하나도 나타나지 않습니다. renderer의 그림자 설정을
켜주지 않았기 때문이죠.

```js
renderer.shadowMap.enabled = true;
```

이 간단한 걸 해결하느라 무려 4시간이 걸렸다는 건 비밀입니다. 😭

그리고 `DirectionLight`의 그림자용 카메라가 장면 전체를 투사하도록 절두체를
조정합니다. 다음과 같이요.

```js
{
  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
+  light.castShadow = true;
*  light.position.set(-250, 800, -850);
*  light.target.position.set(-550, 40, -450);

+  light.shadow.bias = -0.004;
+  light.shadow.mapSize.width = 2048;
+  light.shadow.mapSize.height = 2048;

  scene.add(light);
  scene.add(light.target);
+  const cam = light.shadow.camera;
+  cam.near = 1;
+  cam.far = 2000;
+  cam.left = -1500;
+  cam.right = 1500;
+  cam.top = 1500;
+  cam.bottom = -1500;
...
```

마지막으로 배경색을 옅은 하늘색으로 설정합니다.

```js
const scene = new THREE.Scene();
-scene.background = new THREE.Color('black');
+scene.background = new THREE.Color('#DEFEFF');
```

{{{example url="../threejs-load-gltf-shadows.html" }}}

이 글이 씬 그래프를 포함한 파일을 불러오고, 몇몇 문제를 해결하는 데 도움이
되었으면 합니다.

.blend 파일과 .gltf 파일을 비교해보면 재미있는 점이 하나 있습니다. .blend
파일에는 몇 가지 조명 요소가 있지만 씬 그래프로 변환하면 더 이상 조명의 역할을
하지 못한다는 거죠. .GLTF 파일은 단순한 JSON 형태의 파일이기에 쉽게 내용을
열어 볼 수 있습니다. .GLTF에는 여러 배열이 있고 이 배열의 요소를 참조할 때는
인덱스값을 사용하죠. 기능을 확장하기에 쉬운 형식이라고는 해도, 다른 3D 형식과
마찬가지로 **존재하는 모든 기능을 지원하지는 못합니다**.

때문에 항상 추가 데이터가 필요합니다. 아까 자동차가 따라갈 경로를 따로 내보낸
것도 한 예죠. 경로까지 .GLTF 파일에 포함하는 게 이상적이긴 하나, 그러려면
내보내기 규칙도 작성해야 하고, 규칙을 적용하기 위해 각 요소에 이름을 따로
부여하든지, 네이밍 스키마를 사용하든지, 하여간 데이터를 앱에서 사용하기 위해
무언가 해야 합니다.

어떤 게 가장 좋은 방법일까요? 제 생각에 이건 전적으로 여러분이 풀어나가야 할
숙제입니다. 상황에 따라서 많이 달라질 테니까 말이죠.

