Title: 불필요한 렌더링 없애기
Description: 불필요한 렌더링을 제거합니다
TOC: 불필요한 렌더링 없애기

대부분의 개발자에게 이 주제는 너무 뻔할 수 있지만, 필요한 누군가를 위해
글을 써보려 합니다. 대부분의 Three.js 예제는 렌더링 과정을 계속 반복합니다.
그러니까 아래와 같이 재귀적으로 `requestAnimationFrame` 함수를 사용한다는
거죠.

```js
function render() {
  ...
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

계속 애니메이션이 있는 경우에야 별 상관이 없지만, 애니메이션이 없는 경우라면
어떨까요? 이 경우 불필요한 렌더링을 반복하는 것은 연산 낭비일 뿐더러 사용
환경이 모바일이라면 사용자의 배터리까지 낭비하는 셈입니다.

처음 한 번만 렌더링하고, 그 후에 변화가 있을 때만 렌더링하는 것이 가장 정확한
해결책일 겁니다. 여기서 변화란 텍스처나 모델의 로딩이 끝났을 때, 외부에서
데이터를 받았을 때, 사용자가 카메라를 조정하거나, 설정을 바꾸거나, 인풋 값이
변경된 경우 등 다양하겠죠.

[반응형 디자인에 관한 글](threejs-responsive.html)에서 썼던 예제를 수정해
필요에 따른 렌더링을 구현해봅시다.

먼저 뭔가 변화를 일으킬 수 있는 요소가 필요하니 `OrbitControls`를 추가합니다.

```js
import * as THREE from './resources/three/r115/build/three.module.js';
+import { OrbitControls } from './resources/threejs/r115/examples/jsm/controls/OrbitControls.js';

...

const fov = 75;
const aspect = 2;  // canvas 기본값
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

+const controls = new OrbitControls(camera, canvas);
+controls.target.set(0, 0, 0);
+controls.update();
```

정육면체에 애니메이션을 넣지 않을 것이니 이들을 참조할 필요가 없습니다.

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

애니메이션과 `requestAnimationFrame` 관련 코드도 제거합니다.

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

그리고 `render` 함수를 직접 호출합니다.

```js
render();
```

이제 `OrbitControls`가 카메라 설정을 바꿀 때마다 직접 `render` 함수를 호출해야
합니다. 뭔가 복잡할 것 같지만 다행히 `OrbitControls`에는 `change` 이벤트가 있습니다.

```js
controls.addEventListener('change', render);
```

또한 창 크기가 바뀔 때의 동작도 직접 처리해야 합니다. `render` 함수를 계속 호출할
때는 해당 동작을 자동으로 처리했지만, 지금은 `render` 함수를 수동으로 호출하므로
창의 크기가 바뀔 때 `render` 함수를 호출하도록 하겠습니다.

```js
window.addEventListener('resize', render);
```

이제 불필요한 렌더링을 반복하지 않습니다.

{{{example url="../threejs-render-on-demand.html" }}}

`OrbitControls`에는 관성(inertia) 옵션이 있습니다. `enableDamping` 속성을 ture로
설정하면 동작이 좀 더 부드러워지죠.

※ damping: 감쇠.

```js
controls.enableDamping = true;
```

또한 `OrbitControls`가 부드러운 동작을 구현할 때 변경된 카메라 값을 계속 넘겨주도록
`render` 함수 안에서 `controls.update` 메서드를 호출해야 합니다. 하지만 이렇게 하면
`change` 이벤트가 발생했을 때 `render` 함수가 무한정 호출될 겁니다. controls가 `change`
이벤트를 보내면 `render` 함수가 호출되고, `render` 함수는 `controls.update` 메서드를
호출해 다시 `change` 이벤트를 보내게 만들 테니까요.

`requestAnimationFrame`이 직접 `render` 함수를 호출하게 하면 이 문제를 해결 할 수
있습니다. 너무 많은 프레임을 막기 위해 변수 하나를 두어 요청한 프레임이 없을 경우에만
프레임을 요청하도록 하면 되겠네요.

```js
+let renderRequested = false;

function render() {
+  renderRequested = false;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

+ controls.update();
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

창 크기 변화가 일어났을 때도 `requestRenderIfNotRequested`를 호출하도록 합니다.

```js
-window.addEventListener('resize', render);
+window.addEventListener('resize', requestRenderIfNotRequested);
```

차이점을 느끼기 어려울지도 모르겠습니다. 화살표 키를 쓰거나 예제를 드래그해 보고
다시 위 예제를 이리저리 돌려보세요. 차이점이 느껴질 거예요. 위 예제는 화살표 키를
눌렀을 때 일정 거리만큼 순간이동하지만 아래의 예제는 약간 미끄러집니다.

{{{example url="../threejs-render-on-demand-w-damping.html" }}}

간단한 dat.GUI를 추가해 반복 렌더링 여부를 제어할 수 있도록 하겠습니다.

```js
import * as THREE from './resources/three/r115/build/three.module.js';
import { OrbitControls } from './resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
+import { GUI } from '../3rdparty/dat.gui.module.js';
```

먼저 각 정육면체의 색과 x축 스케일을 조정하는 GUI를 추가합니다. [조명에 관한 글](threejs-lights.html)에서
썼던 `ColorGUIHelper`를 가져와 쓰도록 하죠.

먼저 GUI를 생성합니다.

```js
const gui = new GUI();
```

그리고 각 정육면체에 `material.color`, `cube.scale.x` 설정을 폴더로 묶어
추가합니다.

```js
function makeInstance(geometry, color, x) {
  const material = new THREE.MeshPhongMaterial({color});

  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  cube.position.x = x;

+  const folder = gui.addFolder(`Cube${ x }`);
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

dat.GUI 컨트롤(control)의 `onChange` 메서드에 콜백 함수를 넘겨주면 GUI 값이 바뀔
때마다 콜백 함수를 호출합니다. 예제의 경우에는 단순히 `requestRenderIfNotRequested`
함수를 넘겨주면 되죠. 그리고 `folder.open` 메서드를 호출해 폴더를 열어 둡니다.

{{{example url="../threejs-render-on-demand-w-gui.html" }}}

이 글이 불필요한 렌더링 제거에 대한 개념을 조금이라도 잡아주었길 바랍니다. 보통
Three.js를 사용할 때는 이렇게 렌더링 루프를 제어할 일이 없습니다. 대게 게임 또는
애니메이션이 들어간 3D 컨텐츠이기 때문이죠. 하지만 지도나, 3D 에디터, 3D 그래프,
상품 목록 등에서는 이런 기법이 필요할 수도 있습니다.
