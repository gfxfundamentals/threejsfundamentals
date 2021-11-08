Title: Three.js VR - Look to Select
Description: Look to Select을 시행하는 방법
TOC: VR - Look To Select

**NOTE: 이 페이지의 예시에는 VR 지원 기기가 필요합니다. 
VR 기기 없이는 동작하지 않으며 그 이유를 [이전 글](threejs-webvr.html)
에서 확인할 수 있습니다.**

[이전 글](threejs-webvr.html)에서 우리는 three.js를 사용한 매우 간단한 VR 예제를 살펴보고 다양한 종류의 VR 시스템에 대해 이야기했습니다.

가장 간단하고 흔한 것은 기본적으로 5달러에서 50달러의 얼굴 마스크에 넣는 전화기인 VR 구글 카드 보드 스타일입니다.
이런 종류의 VR에는 컨트롤러가 없기 때문에 사람들은 사용자 입력을 허용하기 위한 창의적인 해결책을 생각해 내야 합니다.

이때 가장 일반적인 해결책은 사용자가 무언가를 잠시 동안 가리킬 경우 그것이 선택되는 "Look to Select"입니다.

"Look to Select"를 구현해봅시다! 먼저 [이전 글의 예시](threejs-webvr.html)에서 시작해 [Three.js 피킹](threejs-picking.html)에서 만든 `PickHelper`를 추가할 것입니다.

```js
class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera, time) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }

    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color to flashing red/yellow
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}
```

해당 코드에 대한 설명은 [피킹에 대한 글](threejs-picking.html)을 참조하십시오.

이 기능을 사용하려면 인스턴스를 만들고 render loop에서 호출하기만 하면 됩니다.

```js
+const pickHelper = new PickHelper();

...
function render(time) {
  time *= 0.001;

  ...

+  // 0, 0 is the center of the view in normalized coordinates.
+  pickHelper.pick({x: 0, y: 0}, scene, camera, time);
```

원래의 피킹 예시에서 우리는 마우스 좌표를 CSS 픽셀에서 캔버스를 가로질러 -1에서 +1로 가는 정규화된 좌표로 변환했습니다.

이 경우 우리는 항상 카메라가 마주 보고 있는 화면의 중심을 선택하기 때문에 정규화된 좌표의 중심인 x와 y 모두에 대해 0을 통과합니다.

그리고 우리가 그 물체들을 볼 때 그 물체들은 번쩍거릴 것입니다.

{{{example url="../threejs-webvr-look-to-select.html" }}}

일반적으로 우리는 즉각적인 선택을 원하지 않습니다.

대신 우리는 실수로 어떤 것을 선택하지 않도록 하기 위해 몇 분 동안 카메라를 사용자가 선택하고자 하는 것에 고정시키도록 합니다.

그러기 위해서 사용자가 계속 보고 있었는지, 그리고 얼마나 오래 있었는지를 전달하기 위한 일종의 미터나 게이지나 방법이 필요합니다.

이를 위한 한 가지 쉬운 방법은 2가지 색상의 텍스처를 만들고 텍스처 오프셋을 사용하여 모델을 가로질러 텍스처를 이동시키는 것입니다.

VR 예제에 추가하기 전에 스스로 작동하는지 보도록 합시다.

먼저 `OrthographicCamera`를 만들어 보겠습니다.

```js
const left = -2;    // Use values for left
const right = 2;    // right, top and bottom
const top = 1;      // that match the default
const bottom = -1;  // canvas size.
const near = -1;
const far = 1;
const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
```

그리고 캔버스의 크기가 변경되면 업데이트하는 것을 잊지 마십시오.

```js
function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    const aspect = canvas.clientWidth / canvas.clientHeight;
+    camera.left = -aspect;
+    camera.right = aspect;
    camera.updateProjectionMatrix();
  }
  ...
```

우리는 현재 중앙 위아래 두 유닛과 좌우 측면 유닛을 보여주는 카메라를 가지고 있습니다.

다음으로 2가지 색 텍스처를 만들어 봅시다. 몇 군데 [다른](threejs-indexed-textures.html) [곳에서](threejs-post-processing-3dlut.html) 사용했던 `DataTexture`를 사용할 것입니다.

```js
function makeDataTexture(data, width, height) {
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const cursorColors = new Uint8Array([
  64, 64, 64, 64,       // dark gray
  255, 255, 255, 255,   // white
]);
const cursorTexture = makeDataTexture(cursorColors, 2, 1);
```

그 다음 `TorusGeometry`에 있는 텍스처를 사용할 것입니다.

```js
const ringRadius = 0.4;
const tubeRadius = 0.1;
const tubeSegments = 4;
const ringSegments = 64;
const cursorGeometry = new THREE.TorusGeometry(
    ringRadius, tubeRadius, tubeSegments, ringSegments);

const cursorMaterial = new THREE.MeshBasicMaterial({
  color: 'white',
  map: cursorTexture,
  transparent: true,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneMinusDstColorFactor,
  blendDst: THREE.OneMinusSrcColorFactor,
});
const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
scene.add(cursor);
```

그 다음 `render`에서 텍스처의 오프셋을 조정하도록 합니다.

```js
function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera.left = -aspect;
    camera.right = aspect;
    camera.updateProjectionMatrix();
  }

+  const fromStart = 0;
+  const fromEnd = 2;
+  const toStart = -0.5;
+  const toEnd = 0.5;
+  cursorTexture.offset.x = THREE.MathUtils.mapLinear(
+      time % 2,
+      fromStart, fromEnd,
+      toStart, toEnd);

  renderer.render(scene, camera);
}
```

`THREE.MathUtils.mapLinear`는 `fromStart`와 `fromEnd` 사이의 값을 취하여 시작과 끝 사이의 값으로 매핑합니다.

위의 경우, 0에서 2까지의 값을 의미하는 `time % 2`를 취하여 -0.5에서 0.5까지의 값에 매핑합니다.

[텍스처](threejs-textures.html)는 0에서 1까지 정규화된 텍스처 좌표를 사용하여 geometry에 매핑됩니다.
즉, 기본 래핑 모드인 `THREE.ClampToEdge`로 설정된 2x1 픽셀 이미지를 의미하며,
텍스처 좌표를 -0.5만큼 조정하면 전체 메시가 첫 번째 색상이 되고 텍스처 좌표를 +0.5만큼 조정하면 전체 메시가 두 번째 색상이 됩니다.
필터링을 `THREE.NearestFilter`로 설정하면 geometry를 통해 두 색상 간의 전환이 가능해집니다.

[배경과 관련된 글](threejs-backgrounds.html)에서 다루었던 것처럼 배경의 질감을 더해봅시다.
2x2 색상 셋을 사용하지만 텍스처의 반복 설정을 8x8 그리드로 설정할 수 있습니다.
이렇게 하면 커서가 렌더링 되어 다른 색상과 대조하여 확인할 수 있습니다.

```js
+const backgroundColors = new Uint8Array([
+    0,   0,   0, 255,  // black
+   90,  38,  38, 255,  // dark red
+  100, 175, 103, 255,  // medium green
+  255, 239, 151, 255,  // light yellow
+]);
+const backgroundTexture = makeDataTexture(backgroundColors, 2, 2);
+backgroundTexture.wrapS = THREE.RepeatWrapping;
+backgroundTexture.wrapT = THREE.RepeatWrapping;
+backgroundTexture.repeat.set(4, 4);

const scene = new THREE.Scene();
+scene.background = backgroundTexture;
```

이제 이것을 실행하면 게이지와 같은 원을 얻을 수 있고 게이지 위치를 설정할 수 있습니다.

{{{example url="../threejs-webvr-look-to-select-selector.html" }}}

몇 가지 주목하고 **시도해야 할 것들**이 있습니다.

* 다음과 같이 `cursorMaterial`의 `blending`, `blendSrc`, `blendDst`
  속성을 설정합니다.

        blending: THREE.CustomBlending,
        blendSrc: THREE.OneMinusDstColorFactor,
        blendDst: THREE.OneMinusSrcColorFactor,
  
  이것은 효과의 *역* 타입으로 주어집니다.
  그 세 줄에 주석을 달면 차이를 알 수 있을 것입니다.
  저는 역효과가 가장 좋다고 생각하는데, 이렇게 하면 커서의 색깔에 상관없이 커서가 보일 수 있기 때문입니다.
  
* `RingGeometry`가 아닌 `TorusGeometry`를 사용해 봅시다.

  어떤 이유로든 `RingGeometry`는 평평한 UV 매핑 방식을 사용합니다.
  이 때문에 `RingGeometry`를 사용하면 위에서처럼 링 주위가 아닌 수평으로 링을 가로질러 텍스처가 미끄러집니다.

  이걸 시도해 보고 `TorusGeometry`를 `RingGeometry`(위 예시에서 설명한 대로)로 바꾸면 무슨 뜻인지 알 수 있을 것입니다.
  
  *적절한* 정의를 위한 *적절한* 할 것은 `RingGeometry`를 사용하되 링 주위를 돌도록 텍스처 좌표를 고정하는 것입니다.
  아니면, 자신만의 링 지오메트리를 생성하세요. 그래도 torus는 잘 작동합니다.
  `MeshBasicMaterial`과 함께 카메라 바로 앞에 배치하면 링과 똑같이 보이고 텍스처 좌표가 링 주위를 돌기 때문에 우리가 원하는 대로 작동합니다.
  
이제 이것을 위의 VR 코드와 통합해 봅시다.

```js
class PickHelper {
-  constructor() {
+  constructor(camera) {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
-    this.pickedObjectSavedColor = 0;

+    const cursorColors = new Uint8Array([
+      64, 64, 64, 64,       // dark gray
+      255, 255, 255, 255,   // white
+    ]);
+    this.cursorTexture = makeDataTexture(cursorColors, 2, 1);
+
+    const ringRadius = 0.4;
+    const tubeRadius = 0.1;
+    const tubeSegments = 4;
+    const ringSegments = 64;
+    const cursorGeometry = new THREE.TorusGeometry(
+        ringRadius, tubeRadius, tubeSegments, ringSegments);
+
+    const cursorMaterial = new THREE.MeshBasicMaterial({
+      color: 'white',
+      map: this.cursorTexture,
+      transparent: true,
+      blending: THREE.CustomBlending,
+      blendSrc: THREE.OneMinusDstColorFactor,
+      blendDst: THREE.OneMinusSrcColorFactor,
+    });
+    const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
+    // add the cursor as a child of the camera
+    camera.add(cursor);
+    // and move it in front of the camera
+    cursor.position.z = -1;
+    const scale = 0.05;
+    cursor.scale.set(scale, scale, scale);
+    this.cursor = cursor;
+
+    this.selectTimer = 0;
+    this.selectDuration = 2;
+    this.lastTime = 0;
  }
  pick(normalizedPosition, scene, camera, time) {
+    const elapsedTime = time - this.lastTime;
+    this.lastTime = time;

-    // restore the color if there is a picked object
-    if (this.pickedObject) {
-      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
-      this.pickedObject = undefined;
-    }

+    const lastPickedObject = this.pickedObject;
+    this.pickedObject = undefined;

    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
-      // save its color
-      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
-      // set its emissive color to flashing red/yellow
-      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }

+    // show the cursor only if it's hitting something
+    this.cursor.visible = this.pickedObject ? true : false;
+
+    let selected = false;
+
+    // if we're looking at the same object as before
+    // increment time select timer
+    if (this.pickedObject && lastPickedObject === this.pickedObject) {
+      this.selectTimer += elapsedTime;
+      if (this.selectTimer >= this.selectDuration) {
+        this.selectTimer = 0;
+        selected = true;
+      }
+    } else {
+      this.selectTimer = 0;
+    }
+
+    // set cursor material to show the timer state
+    const fromStart = 0;
+    const fromEnd = this.selectDuration;
+    const toStart = -0.5;
+    const toEnd = 0.5;
+    this.cursorTexture.offset.x = THREE.MathUtils.mapLinear(
+        this.selectTimer,
+        fromStart, fromEnd,
+        toStart, toEnd);
+
+    return selected ? this.pickedObject : undefined;
  }
}
```

위의 코드를 보시면 커서 형상, 텍스처, 매테리얼을 만들기 위해 모든 코드를 추가한 것을 볼 수 있습니다.
그리고 카메라의 자식으로 추가해서 항상 카메라 앞에 놓이게 합니다.
커서가 렌더링 되지 않을 경우 카메라를 장면에 추가해야 합니다.

```js
+scene.add(camera);
```

이 다음 이번에 피킹 할 것이 지난번과 같은지 확인합니다.
타이머에 경과 시간을 추가하고 타이머가 한계치에 도달하면 선택한 항목을 반환합니다.

이제 큐브들을 고르는데 그것을 사용해 봅시다.
간단한 예로 3개의 구도 추가하겠습니다.
큐브를 선택하여 큐브를 숨기고 해당 구의 숨기기를 취소합니다.

먼저 구면 geometry를 만들어보겠습니다.

```js
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
-const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
+const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
+
+const sphereRadius = 0.5;
+const sphereGeometry = new THREE.SphereGeometry(sphereRadius);
```

그리고 세 쌍의 박스와 구 `Mesh`를 만들어 봅시다. 각 `Mesh`를 파트너와 연결할 수 있도록 [`맵`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)을 사용할 것입니다.

```js
-const cubes = [
-  makeInstance(geometry, 0x44aa88,  0),
-  makeInstance(geometry, 0x8844aa, -2),
-  makeInstance(geometry, 0xaa8844,  2),
-];
+const meshToMeshMap = new Map();
+[
+  { x:  0, boxColor: 0x44aa88, sphereColor: 0xFF4444, },
+  { x:  2, boxColor: 0x8844aa, sphereColor: 0x44FF44, },
+  { x: -2, boxColor: 0xaa8844, sphereColor: 0x4444FF, },
+].forEach((info) => {
+  const {x, boxColor, sphereColor} = info;
+  const sphere = makeInstance(sphereGeometry, sphereColor, x);
+  const box = makeInstance(boxGeometry, boxColor, x);
+  // hide the sphere
+  sphere.visible = false;
+  // map the sphere to the box
+  meshToMeshMap.set(box, sphere);
+  // map the box to the sphere
+  meshToMeshMap.set(sphere, box);
+});
```

큐브를 회전하는 `render`에서 `cubes` 대신 `meshToMeshMap`를 반복해야 합니다.

```js
-cubes.forEach((cube, ndx) => {
+let ndx = 0;
+for (const mesh of meshToMeshMap.keys()) {
  const speed = 1 + ndx * .1;
  const rot = time * speed;
-  cube.rotation.x = rot;
-  cube.rotation.y = rot;
-});
+  mesh.rotation.x = rot;
+  mesh.rotation.y = rot;
+  ++ndx;
+}
```

이제 새로운 `PickHelper` 구현을 사용하여 개체 중 하나를 선택할 수 있습니다. 이 옵션을 선택하면 개체를 숨기고 그 파트너를 드러냅니다.

```js
// 0, 0 is the center of the view in normalized coordinates.
-pickHelper.pick({x: 0, y: 0}, scene, camera, time);
+const selectedObject = pickHelper.pick({x: 0, y: 0}, scene, camera, time);
+if (selectedObject) {
+  selectedObject.visible = false;
+  const partnerObject = meshToMeshMap.get(selectedObject);
+  partnerObject.visible = true;
+}
```

그리고 이를 통해 우리는 꽤 괜찮은 *look to select*를 구현해야 합니다.

{{{example url="../threejs-webvr-look-to-select-w-cursor.html" }}}

이 예제가 구글 카드 보드 레벨 UX의 "look to select"를 구현하는 방법에 대한 아이디어를 주었기를 바랍니다.
텍스쳐 좌표 오프셋을 사용한 슬라이딩 텍스쳐도 일반적으로 유용한 기법입니다.

다음으로는 [VR 컨트롤러가 있는 사용자가 사물을 가리키고 이동할 수 있는 방법을 알아보겠습니다.](threejs-webvr-point-to-select.html).
