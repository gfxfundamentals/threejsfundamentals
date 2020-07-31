Title: Three.js 빌보드(Billboards)
Description: 물체가 항상 카메라를 바라보도록 하는 법을 알아봅니다
TOC: 빌보드와 파사드

[이전 글](threejs-canvas-textures.html)에서는 `CanvasTexture`를 이용해 캐릭터에 이름표/명찰을 붙이는 법을 알아봤습니다. 때로는 이 이름표가 항상 카메라를 향하게 해야 할 경우도 있겠죠. Three.js의 `Sprite`와 `SpriteMaterial`을 사용하면 이걸 쉽게 구현할 수 있습니다.

[캔버스 텍스처에 관한 글](threejs-canvas-textures.html)의 명찰 예제를 가져와 여기에 `Sprite`와 `SpriteMaterial`을 사용해봅시다.

```js
function makePerson(x, labelWidth, size, name, color) {
  const canvas = makeLabelCanvas(labelWidth, size, name);
  const texture = new THREE.CanvasTexture(canvas);
  // 텍스처용 캔버스는 2D이므로 픽셀이 모자랑 경우 대략적으로
  // 필터링하게끔 설정합니다.
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

-  const labelMaterial = new THREE.MeshBasicMaterial({
+  const labelMaterial = new THREE.SpriteMaterial({
    map: texture,
-    side: THREE.DoubleSide,
    transparent: true,
  });

  const root = new THREE.Object3D();
  root.position.x = x;

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  root.add(body);
  body.position.y = bodyHeight / 2;

  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  root.add(head);
  head.position.y = bodyHeight + headRadius * 1.1;

-  const label = new THREE.Mesh(labelGeometry, labelMaterial);
+  const label = new THREE.Sprite(labelMaterial);
  root.add(label);
  label.position.y = bodyHeight * 4 / 5;
  label.position.z = bodyRadiusTop * 1.01;

```

이제 명찰이 항상 카메라를 바라봅니다.

{{{example url="../threejs-billboard-labels-w-sprites.html" }}}

하지만 특정 각도에서 보니 명찰이 사람과 겹쳐 보입니다.

<div class="threejs_center"><img src="resources/images/billboard-label-z-issue.png" style="width: 455px;"></div>

간단히 명찰의 위치를 옮겨버리면 문제를 해결할 수 있겠죠.

```js
+// 명찰의 크기를 조정합니다.
+const labelBaseScale = 0.01;
const label = new THREE.Sprite(labelMaterial);
root.add(label);
-label.position.y = bodyHeight * 4 / 5;
-label.position.z = bodyRadiusTop * 1.01;
+label.position.y = head.position.y + headRadius + size * labelBaseScale;

-// 명찰의 크기를 조정합니다.
-const labelBaseScale = 0.01;
label.scale.x = canvas.width  * labelBaseScale;
label.scale.y = canvas.height * labelBaseScale;
```

{{{example url="../threejs-billboard-labels-w-sprites-adjust-height.html" }}}

추가로 이 빌보드(billboard, 광고판)*에 파사드를 적용할 수 있습니다.

> ※ 맥락상 명찰이 갑자기 빌보드가 되는 게 이상하지만, 원문의 흐름 자체를 수정할 수 없어 그대로 번역합니다. 또한 광고판으로 번역할 수도 있으나, 우리나라 사람들에게 광고판이라는 게 잘 와닿지 않을 것이기에 그냥 영문을 그대로 옮겨 표기하였습니다. 역주.

3D 물체를 그리는 대신 3D 물체의 이미지로 2D 평면을 렌더링하는 기법입니다. 꽤 많은 경우 3D 물체를 그냥 렌더링하는 것보다 빠르죠.

예제로 나무가 그리드 형태로 배치된 장면(scene)을 만들어봅시다. 각 나무의 줄기는 원통, 윗부분은 원뿔로 만들겠습니다.

먼저 모든 나무가 공통으로 사용할 원뿔, 원통의 geometry와 재질(material)을 만듭니다.

```js
const trunkRadius = .2;
const trunkHeight = 1;
const trunkRadialSegments = 12;
const trunkGeometry = new THREE.CylinderBufferGeometry(
    trunkRadius, trunkRadius, trunkHeight, trunkRadialSegments);

const topRadius = trunkRadius * 4;
const topHeight = trunkHeight * 2;
const topSegments = 12;
const topGeometry = new THREE.ConeBufferGeometry(
    topRadius, topHeight, topSegments);

const trunkMaterial = new THREE.MeshPhongMaterial({ color: 'brown' });
const topMaterial = new THREE.MeshPhongMaterial({ color: 'green' });
```

다음으로 함수를 하나 만듭니다. 이 함수는 나무 줄기 `Mesh`와 윗부분 `Mesh`를 만들고 이 둘을 `Object3D`의 자식으로 넣는 역할입니다.

```js
function makeTree(x, z) {
  const root = new THREE.Object3D();
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  root.add(trunk);

  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.y = trunkHeight + topHeight / 2;
  root.add(top);

  root.position.set(x, 0, z);
  scene.add(root);

  return root;
}
```

그리고 반복문을 돌려 나무를 그리드 형태로 배치합니다.

```js
for (let z = -50; z <= 50; z += 10) {
  for (let x = -50; x <= 50; x += 10) {
    makeTree(x, z);
  }
}
```

땅 역할을 할 평면도 배치합니다.

```js
// 땅을 추가합니다.
{
  const size = 400;
  const geometry = new THREE.PlaneBufferGeometry(size, size);
  const material = new THREE.MeshPhongMaterial({ color: 'gray' });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI * -0.5;
  scene.add(mesh);
}
```

배경은 하늘색으로 바꿔줍니다.

```js
const scene = new THREE.Scene();
-scene.background = new THREE.Color('white');
+scene.background = new THREE.Color('lightblue');
```

{{{example url="../threejs-billboard-trees-no-billboards.html" }}}

나무는 11x11, 총 121그루입니다. 각 나무는 12각형 원뿔과 48각형 원통으로 이루어졌으니, 나무 하나 당 삼각형이 60개인 셈입니다. 121 * 60이면 총 삼각형 7260개네요. 물론 그다지 많은 수는 아니지만 더 세밀한 3차원 나무는 하나당 1000-3000개의 삼각형이 필요할 겁니다. 나무 하나당 3000개면 총 36300개의 삼각형을 그려야 하는 셈이죠.

파사드(facade)를 이용하면 삼각형의 양을 줄일 수 있습니다.

그래픽 프로그램으로 파사드를 만들 수도 있지만, 코드를 작성해 직접 하나를 만들어봅시다.

`RenderTarget`을 이용해 3D 물체를 텍스처로 바꾸는 코드를 작성합니다. `RenderTarget`에 렌더링하는 법은 [이전 글](threejs-rendertargets.html)에서 다루었으니 참고 바랍니다.

```js
function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

  camera.position.copy(boxCenter);
  camera.position.z += distance;

  // 절두체가 육면체를 포함하도록 near와 far 값을 조정합니다.
  camera.near = boxSize / 100;
  camera.far = boxSize * 100;

  camera.updateProjectionMatrix();
}

function makeSpriteTexture(textureSize, obj) {
  const rt = new THREE.WebGLRenderTarget(textureSize, textureSize);

  const aspect = 1;  // 렌더 타겟이 정사각형이므로
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  scene.add(obj);

  // 물체를 감싼 육면체를 계산합니다.
  const box = new THREE.Box3().setFromObject(obj);

  const boxSize = box.getSize(new THREE.Vector3());
  const boxCenter = box.getCenter(new THREE.Vector3());

  // 카메라가 육면체를 감싸도록 설정합니다.
  const fudge = 1.1;
  const size = Math.max(...boxSize.toArray()) * fudge;
  frameArea(size, size, boxCenter, camera);

  renderer.autoClear = false;
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.autoClear = true;

  scene.remove(obj);

  return {
    position: boxCenter.multiplyScalar(fudge),
    scale: size,
    texture: rt.texture,
  };
}
```

위 예제에서 주의 깊게 봐야하는 부분:

위 예제는 코드 밖에서 선언한 시야각 (field of view, `fov`)을 사용했습니다.

[.obj 파일 불러오기](threejs-load-obj.html)에서 썼던 방법을 약간 수정해 나무를 감싼 육면체를 계산했습니다.

[.obj 파일 불러오기](threejs-load-obj.html)에서 썼던 `frameArea`도 가져왔습니다. 이번에는 주어진 시아갹에 해당 물체가 포함되게 하려면 얼마나 떨어져야 하는지 계산할 때 사용했죠. 그리고 이 결과값으로 카메라를 물체를 감싼 육면체 중심에서 -z축 방향으로 옮겼습니다.

절두체의 크기를 1.1 (`fudge(속임수)`)만큼 키워 나무가 렌더 타겟에 완전히 들어가도록 했습니다. 물체가 절두체 안에 있는지 계산한 결과는 물체의 가장자리를 포함하지 않기에 그대로 뒀다면 물체가 카메라 밖으로 벗어나 보였을 겁니다. 카메라가 완전히 물체를 담는 값을 계산할 수도 있지만, 그건 공간 낭비이기도 하기에 단순히 *속임수*를 사용한 것이죠.

그리고 렌더 타겟에 장면을 렌더링한 뒤 나무를 장면에서 제거했습니다.

여기서 중요한 건 조명은 따로 넣어야 하나, 다른 요소는 없도록 해야 한다는 겁니다.

일단 장면에서 배경색도 제거합니다.

```js
const scene = new THREE.Scene();
-scene.background = new THREE.Color('lightblue');
```

마지막으로 함수에서 받은 텍스처의 위치와 스케일을 조정해 파사드가 같은 위치에 나타나도록 해야 합니다.

먼저 나무를 만들어 위에서 만든 함수에 넘겨줍니다.

```js
// 빌보드 텍스처를 만듭니다.
const tree = makeTree(0, 0);
const facadeSize = 64;
const treeSpriteInfo = makeSpriteTexture(facadeSize, tree);
```

다음으로 나무 대신 파사드를 그리드 형태로 배치합니다.

```js
+function makeSprite(spriteInfo, x, z) {
+  const { texture, offset, scale } = spriteInfo;
+  const mat = new THREE.SpriteMaterial({
+    map: texture,
+    transparent: true,
+  });
+  const sprite = new THREE.Sprite(mat);
+  scene.add(sprite);
+  sprite.position.set(
+      offset.x + x,
+      offset.y,
+      offset.z + z);
+  sprite.scale.set(scale, scale, scale);
+}

for (let z = -50; z <= 50; z += 10) {
  for (let x = -50; x <= 50; x += 10) {
-    makeTree(x, z);
+    makeSprite(treeSpriteInfo, x, z);
  }
}
```

위 코드에서는 파사드에 위치값과 스케일값을 지정해 원래 나무가 있어야할 위치에 파사드가 나타나도록 했습니다.

이제 파사드가 제자리에 위치했으니 배경색을 다시 지정합니다.

```js
scene.background = new THREE.Color('lightblue');
```

나무 파사드로 이루어진 장면을 완성했습니다.

{{{example url="../threejs-billboard-trees-static-billboards.html" }}}

아까 만들었던 예제와 비교해보면 꽤 비슷할 겁니다. 예제에서는 저-해상도 텍스처, 64x64 픽셀 텍스처를 사용했기에 파사드가 각져 보입니다. 해상도를 높일 수도 있지만, 파사드는 대게 먼 거리에서 작게 보이는 물체에 사용하기에 저-해상도로 사용해도 그다지 문제가 없습니다. 게다가 몇 픽셀되지도 않는 나무를 렌더링하는 데 낭비되는 자원을 절약할 수 있죠.

다른 문제는 나무를 한 각도에서 밖에 볼 수 없다는 겁니다. 이 문제는 대게 더 많은 파사드를 렌더링해 해결할 수 있죠. 예를 들어 8개의 파사드를 만들어 카메라가 물체를 바라보는 각도에 따라 다른 파사드를 보여줄 수 있을 겁니다.

파사드를 쓸 지는 전적으로 선택이지만, 이 글이 파사드의 활용에 도움이 되었으면 합니다.
