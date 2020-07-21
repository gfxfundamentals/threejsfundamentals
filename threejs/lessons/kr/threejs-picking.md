Title: Three.js 피킹(Picking)
Description: Three.js에서 마우스로 요소를 선택하는 법을 알아봅니다
TOC: 물체를 마우스로 피킹하기

*피킹(picking)*이란 사용자가 클릭 또는 터치한 물체를 가려내는 작업을 말합니다. 피킹을 구현하는 방법은 수없이 많지만, 각자 단점이 있습니다. 이 글에서는 이 방법 중 흔히 사용하는 2가지 방법만 살펴보겠습니다.

아마 *피킹*을 구현하는 가장 흔한 방법은 광선 투사(ray casting)일 겁니다. 광선 투사란 포인터(커서)에서 장면의 절두체로 광선을 쏴 광선이 닿는 물체를 감지하는 기법을 말하죠. 이론적으로 가장 간단한 방법입니다.

먼저 포인터의 좌표를 구한 뒤, 이 좌표를 카메라의 시선과 방향에 따라 3D 좌표로 변환합니다. 그리고 near 면에서 far 면까지의 광선을 구해 이 광선이 장면 안 각 물체의 삼각형과 교차하는지 확인합니다. 만약 장면 안에 1000개의 삼각형을 가진 물체가 1000개 있다면 백만 개의 삼각형을 일일이 확인해야 하는 셈이죠.

이를 최적화하려면 몇 가지 방법을 시도해볼 수 있습니다. 하나는 먼저 물체를 감싼 경계(bounding) 좌표가 광선과 교차하는지 확인하고, 교차하지 않는다면 해당 물체의 삼각형을 확인하지 않는 것이죠.

Three.js에는 이런 작업을 대신해주는 `RayCaster` 클래스가 있습니다.

한번 물체 100개가 있는 장면을 만들어 여기서 피킹을 구현해봅시다. 예제는 [반응형 디자인](threejs-responsive.html)에서 썼던 예제를 가져와 사용하겠습니다.

우선 카메라를 별도 `Object3D`의 자식으로 추가해 카메라가 셀카봉처럼 장면 주위를 돌 수 있도록 합니다.

```js
*const fov = 60;
const aspect = 2;  // 캔버스 기본값
const near = 0.1;
*const far = 200;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
*camera.position.z = 30;

const scene = new THREE.Scene();
+scene.background = new THREE.Color('white');

+// 카메라를 봉(pole)에 추가합니다.
+// 이러면 봉을 회전시켜 카메라가 장면 주위를 돌도록 할 수 있습니다
+const cameraPole = new THREE.Object3D();
+scene.add(cameraPole);
+cameraPole.add(camera);
```

그리고 `render` 함수 안에서 카메라 봉을 돌립니다.

```js
cameraPole.rotation.y = time * .1;
```

또한 카메라에 조명을 추가해 조명이 카메라와 같이 움직이도록 합니다.

```js
-scene.add(light);
+camera.add(light);
```

정육면체 100개의 위치, 방향, 크기를 무작위로 설정해 생성합니다.

```js
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + (max - min) * Math.random();
}

function randomColor() {
  return `hsl(${ rand(360) | 0 }, ${ rand(50, 100) | 0 }%, 50%)`;
}

const numObjects = 100;
for (let i = 0; i < numObjects; ++i) {
  const material = new THREE.MeshPhongMaterial({
    color: randomColor(),
  });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
  cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
  cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));
}
```

이제 피킹을 구현해봅시다.

피킹을 관리할 간단한 클래스를 만들겠습니다.

```js
class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera, time) {
    // 이미 다른 물체를 피킹했다면 색을 복원합니다
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }

    // 절두체 안에 광선을 쏩니다
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // 광선과 교차하는 물체들을 배열로 만듭니다
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    if (intersectedObjects.length) {
      // 첫 번째 물체가 제일 가까우므로 해당 물체를 고릅니다
      this.pickedObject = intersectedObjects[0].object;
      // 기존 색을 저장해둡니다
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // emissive 색을 빨강/노랑으로 빛나게 만듭니다
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}
```

위 클래스는 먼저 `RayCaster` 인스턴스를 만들고 `pick` 메서드를 호출하면 장면에 광선을 쏠 수 있게 해줍니다. 그리고 광선에 맞는 요소가 있으면 해당 요소 중 가장 첫 번째 요소의 색을 변경합니다.

사용자가 마우스를 눌렀을 때(down)만 이 함수가 작동하도록 할 수도 있지만, 예제에서는 마우스 포인터 아래의 있는 요소를 피킹하도록 하겠습니다. 이를 구현하려면 먼저 포인터를 추적해야 합니다.

```js
const pickPosition = { x: 0, y: 0 };
clearPickPosition();

...

function getCanvasRelativePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}

function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
  pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // Y 축을 뒤집었음
}

function clearPickPosition() {
  /**
   * 마우스의 경우는 항상 위치가 있어 그다지 큰
   * 상관이 없지만, 터치 같은 경우 사용자가 손가락을
   * 떼면 피킹을 멈춰야 합니다. 지금은 일단 어떤 것도
   * 선택할 수 없는 값으로 지정해두었습니다
   **/
  pickPosition.x = -100000;
  pickPosition.y = -100000;
}

window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);
```

위 예제에서는 마우스의 좌표를 정규화(normalize)했습니다. 캔버스의 크기와 상관없이 왼쪽 끝이 -1, 오른쪽 끝이 +1인 벡터값이 필요하기 때문이죠. 마찬가지로 아래쪽 끝은 -1, 위쪽 끝은 +1입니다.

모바일도 환경도 지원하기 위해 리스너를 더 추가하겠습니다.

```js
window.addEventListener('touchstart', (event) => {
  event.preventDefault(); // 스크롤 이벤트 방지
  setPickPosition(event.touches[0]);
}, { passive: false });

window.addEventListener('touchmove', (event) => {
  setPickPosition(event.touches[0]);
});

window.addEventListener('touchend', clearPickPosition);
```

마지막으로 `render` 함수에서 `PickHelper`의 `pick` 메서드를 호출합니다.

```js
+const pickHelper = new PickHelper();

function render(time) {
  time *= 0.001;  // 초 단위로 변환

  ...

+  pickHelper.pick(pickPosition, scene, camera, time);

  renderer.render(scene, camera);

  ...
```

결과를 볼까요?

{{{example url="../threejs-picking-raycaster.html" }}}

딱히 문제는 없어 보입니다. 실제로 사용하는 경우도 대부분 문제 없이 잘 되겠지만, 이 방법에는 몇 가지 문제점이 있습니다.

1. CPU의 자원을 사용한다

    자바스크립트 엔진은 각 요소를 돌며 광선이 요소의 경계 좌표 안에 교차하는지 확인합니다. 만약 교차할 경우, 해당 요소의 삼각형을 전부 돌며 광선과 교차하는 삼각형이 있는지 확인합니다.
    
    이 방식의 장점은 자바스크립트가 교차하는 지점을 정확히 계산해 해당 데이터를 넘겨줄 수 있다는 점입니다. 예를 들어 교차가 발생한 지점에 특정 표시를 할 수 있겠죠.

    대신 CPU가 할 일이 더 늘어난다는 점이 단점입니다. 요소가 가진 삼각형이 많을수록 더 느려지겠죠.

2. 특이한 방식의 쉐이더나 변이를 감지하지 못한다

    만약 장면에서 geometry를 변형하는 쉐이더를 사용한다면, 자바스크립트는 이 변형을 감지하지 못하기에 잘못된 값을 내놓을 겁니다. 제가 테스트해본 결과 스킨이 적용된 요소에는 이 방법이 먹히지 않습니다.

3. 요소의 투명한 구멍을 처리하지 못한다.

예제를 하나 만들어보죠. 아래와 같은 텍스처를 정육면체에 적용해봅시다.

<div class="threejs_center"><img class="checkerboard" src="../resources/images/frame.png"></div>

그다지 추가할 건 많지 않습니다.

```js
+const loader = new THREE.TextureLoader();
+const texture = loader.load('resources/images/frame.png');

const numObjects = 100;
for (let i = 0; i < numObjects; ++i) {
  const material = new THREE.MeshPhongMaterial({
    color: randomColor(),
    +map: texture,
    +transparent: true,
    +side: THREE.DoubleSide,
    +alphaTest: 0.1,
  });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  ...
```

예제를 실행시키면 바로 문제가 보일 겁니다.

{{{example url="../threejs-picking-raycaster-transparency.html" }}}

정육면체의 빈 공간을 통해 무언가를 선택할 수가 없죠.

<div class="threejs_center"><img src="resources/images/picking-transparent-issue.jpg" style="width: 635px;"></div>

이는 자바스크립트가 텍스처나 재질을 보고 해당 요소가 투명한지 판단하기가 어렵기 때문입니다.

이 문제를 해결하려면 GPU 기반 피킹을 구현해야 합니다. 이론적으로는 간단하지만 위에서 사용한 광선 투사법보다는 좀 더 복잡하죠.

GPU 피킹을 구현하려면 각 요소를 별도의 화면에서 고유한 색상으로 렌더링해야 합니다. 그리고 포인터 아래에 있는 픽셀의 색을 가져와 해당 요소가 선택됐는지 확인하는 거죠.

이러면 위에서 언급한 문제점 2, 3번이 해결됩니다. 1번, 성능의 경우는 상황에 따라 천차만별이죠. 눈에 보이는 화면을 위해 한 번, 피킹을 위해 한 번, 이렇게 매 요소를 총 두 번씩 렌더링해야 합니다. 더 복잡한 해결책을 쓰면 렌더링을 한 번만 할 수도 있지만, 이 글에서는 일단 더 간단한 방법을 사용하겠습니다.

성능 최적화를 위해 시도할 수 있는 방법이 하나 있습니다. 어차피 픽셀을 하나만 읽을 것이니, 카메라를 픽셀 하나만 렌더링하도록 설정하는 것이죠. `PerspectiveCamera.setViewOffset` 메서드를 사용하면 카메라의 특정 부분만 렌더링하도록 할 수 있습니다. 이러면 성능 향상에 조금이나마 도움이 되겠죠.

현재 Three.js에서 이 기법을 구현하려면 장면 2개를 사용해야 합니다. 하나는 기존 mesh를 그대로 쓰고, 나머지 하나는 피킹용 재질을 적용한 mesh를 쓸 겁니다.

먼저 두 번째 장면을 추가하고 배경을 검정으로 지정합니다.

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color('white');
const pickingScene = new THREE.Scene();
pickingScene.background = new THREE.Color(0);
```

각 정육면체를 장면에 추가할 때 `pickingScene`의 같은 위치에 "피킹용 정육면체"를 추가합니다. 그리고 각 피킹용 정육면체에는 id로 쓸 고유 색상값을 지정한 뒤, 이 id 색상값으로 재질을 만들어 추가합니다. id 색상값을 정육면체의 키값으로 매핑해 놓으면 나중에 상응하는 정육면체를 바로 불러올 수 있겠죠.

```js
const idToObject = {};
+const numObjects = 100;
for (let i = 0; i < numObjects; ++i) {
+  const id = i + 1;
  const material = new THREE.MeshPhongMaterial({
    color: randomColor(),
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  });

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
+  idToObject[id] = cube;

  cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
  cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
  cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));

+  const pickingMaterial = new THREE.MeshPhongMaterial({
+    emissive: new THREE.Color(id),
+    color: new THREE.Color(0, 0, 0),
+    specular: new THREE.Color(0, 0, 0),
+    map: texture,
+    transparent: true,
+    side: THREE.DoubleSide,
+    alphaTest: 0.5,
+    blending: THREE.NoBlending,
+  });
+  const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
+  pickingScene.add(pickingCube);
+  pickingCube.position.copy(cube.position);
+  pickingCube.rotation.copy(cube.rotation);
+  pickingCube.scale.copy(cube.scale);
}
```

위 코드에서는 `MeshPhongMaterial`로 편법을 사용했습니다. `emissive` 속성을 id 색상값으로, `color`와 `specular` 속성을 0으로 설정하면 텍스처의 알파값이 `alphaTest`보다 큰 부분만 id 색상값으로 보이겠죠. 또 `blending` 속성을 `THREE.NoBlending`으로 설정해 id 색상값이 알파값의 영향을 받지 않도록 했습니다.

제가 사용한 편법이 최적의 해결책은 아닙니다. 여러가지 옵션을 껐다고 해도 여전히 조명 관련 연산을 실행할 테니까요. 코드를 더 최적화하려면 `alphaTest` 값보다 높은 경우에만 id 색상을 렌더링하는 쉐이더를 직접 만들어야 합니다.

광선 투사법을 쓸 때와 달리 픽셀을 하나만 사용하므로 위치값이 픽셀 하나만 가리키게 변경합니다.

```js
function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event);
-  pickPosition.x = (pos.x / canvas.clientWidth ) *  2 - 1;
-  pickPosition.y = (pos.y / canvas.clientHeight) * -2 + 1;  // Y 축을 뒤집었음
+  pickPosition.x = pos.x;
+  pickPosition.y = pos.y;
}
```

`PickHelper` 클래스도 `GPUPickHelper`로 변경합니다. [렌더 타겟(render target)에 관한 글](threejs-rendertargets.html)에서 다룬 `WebGLRenderTarget`을 써 구현하되, 이번 렌더 타겟의 크기는 1x1, 1픽셀입니다.

```js
-class PickHelper {
+class GPUPickHelper {
  constructor() {
-    this.raycaster = new THREE.Raycaster();
+    // 1x1 픽셀 크기의 렌더 타겟을 생성합니다
+    this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
+    this.pixelBuffer = new Uint8Array(4);
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(cssPosition, scene, camera, time) {
+    const {pickingTexture, pixelBuffer} = this;

    // 기존에 선택된 요소가 있는 경우 색을 복원합니다
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }

+    // view offset을 마우스 포인터 아래 1픽셀로 설정합니다
+    const pixelRatio = renderer.getPixelRatio();
+    camera.setViewOffset(
+        renderer.getContext().drawingBufferWidth,   // 전체 너비
+        renderer.getContext().drawingBufferHeight,  // 전체 높이
+        cssPosition.x * pixelRatio | 0,             // 사각 x 좌표
+        cssPosition.y * pixelRatio | 0,             // 사각 y 좌표
+        1,                                          // 사각 좌표 width
+        1,                                          // 사각 좌표 height
+    );
+    // 장면을 렌더링합니다
+    renderer.setRenderTarget(pickingTexture)
+    renderer.render(scene, camera);
+    renderer.setRenderTarget(null);
+
+    // view offset을 정상으로 돌려 원래의 화면을 렌더링하도록 합니다
+    camera.clearViewOffset();
+    // 픽셀을 감지합니다
+    renderer.readRenderTargetPixels(
+        pickingTexture,
+        0,   // x
+        0,   // y
+        1,   // width
+        1,   // height
+        pixelBuffer);
+
+    const id =
+        (pixelBuffer[0] << 16) |
+        (pixelBuffer[1] <<  8) |
+        (pixelBuffer[2]      );

    // 절두체 안에 광선을 쏩니다
-    this.raycaster.setFromCamera(normalizedPosition, camera);
    // 광선과 교차하는 물체들을 배열로 만듭니다
-    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
-    if (intersectedObjects.length) {
      // 첫 번째 물체가 제일 가까우므로 해당 물체를 고릅니다
-      this.pickedObject = intersectedObjects[0].object;

+    const intersectedObject = idToObject[id];
+    if (intersectedObject) {
      // 첫 번째 물체가 제일 가까우므로 해당 물체를 고릅니다
+      this.pickedObject = intersectedObject;
      // 기존 색을 저장해둡니다
      this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // emissive 색을 빨강/노랑으로 빛나게 만듭니다
      this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
    }
  }
}
```

인스턴스를 만드는 쪽도 수정합니다.

```js
-const pickHelper = new PickHelper();
+const pickHelper = new GPUPickHelper();
```

`pick` 메서드를 호출할 때 `scene` 대신 `pickScene`을 넘겨줍니다.

```js
-  pickHelper.pick(pickPosition, scene, camera, time);
+  pickHelper.pick(pickPosition, pickScene, camera, time);
```

이제 투명한 부분을 관통해 요소를 선택할 수 있습니다.

{{{example url="../threejs-picking-gpu.html" }}}

이 글이 피킹을 구현하는 데 도움이 되었으면 좋겠네요. 나중에 요소를 마우스로 조작하는 법에 대해서도 한 번 써보겠습니다.