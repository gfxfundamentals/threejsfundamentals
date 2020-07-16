Title: Three.js에서 .OBJ 파일 불러오기
Description: .OBJ 파일을 불러오는 법을 배웁니다
TOC: .OBJ 파일 불러오기

Three.js로 프로젝트를 진행할 때, 3D 모델 파일을 불러와 사용하는 것은
아주 흔한 일입니다. 오늘은 주로 사용하는 파일 형식인 .OBJ 파일을
불러오는 법에 대해 알아보겠습니다.

인터넷을 검색해 [CC-BY-NC 3.0 풍자 3D 모델](https://www.blendswap.com/blends/view/69174)을
하나 가져왔습니다(작가: [ahedov](https://www.blendswap.com/user/ahedov)).

<div class="threejs_center"><img src="resources/images/windmill-obj.jpg"></div>

다운받은 파일 형식이 .blend네요. [블렌더(Blender)](https://blender.org)로
파일을 열어 .OBJ 형식으로 변환하겠습니다.

<div class="threejs_center"><img style="width: 827px;" src="resources/images/windmill-export-as-obj.jpg"></div>

> 블렌더는 다른 프로그램과 다른 점이 많아 낯설게 느껴질 수 있습니다.
블렌더를 처음 접한다면, 글 읽기를 잠시 멈추고 블렌더의 기본 UI 가이드를
먼저 읽어보길 권장합니다.

> 추가로 보통 3D 프로그램은 수천 가지 기능을 지원하는 거대 함선과 같습니다.
프로그램들 중에서도 복잡하기로 유명하죠. 1996년, 제가 3D Studio Max를 처음
배우기 시작했을 때 저는 하루에 몇 시간씩 3주를 들여 공식 매뉴얼의 70% 정도를
정독했습니다. 그리고 그게 몇 년 뒤 마야(Maya)를 배울 때 도움이 많이 됐죠. 3D
모델을 만들든, 기존 모델을 수정하든, 3D 프로그램으로 무언가를 하고 싶다면 강의나
튜토리얼에 따로 시간을 투자하기 바랍니다.

특별한 일이 없다면 저는 파일을 내보낼 때 아래의 옵션을 사용합니다.

<div class="threejs_center"><img style="width: 239px;" src="resources/images/windmill-export-options.jpg"></div>

자 이제 한 번 화면에 띄워보죠!

[조명에 관한 글](threejs-lights.html)에서 썼던 예제를 가져와 이 예제를
반구광(hemisphere light) 예제와 합칩니다. 그러면 장면에는 `HemisphereLight`
하나, `DirectionalLight` 하나가 있는 셈입니다. 또 GUI 관련 코드와 정육면체,
구체 관련 코드도 지웁니다.

다음으로 먼저 `OBJLoader2` 모듈을 스크립트에 로드합니다.

```js
import { OBJLoader2 } from './resources/threejs/r115/examples/jsm/loaders/OBJLoader2.js';
```

`OBJLoader2`의 인스턴스를 생성한 뒤 .OBJ 파일의 경로와 콜백 함수를 넘겨
`load` 메서드를 실행합니다. 그리고 콜백 함수에서 불러온 모델을 장면에
추가합니다.

```js
{
  const objLoader = new OBJLoader2();
  objLoader.load('resources/models/windmill/windmill.obj', (root) => {
    scene.add(root);
  });
}
```

어떤 결과가 나올까요?

{{{example url="../threejs-load-obj-no-materials.html" }}}

뭔가 성공한 듯하지만 재질(materials)이 없어 오류가 납니다. .OBJ 파일에도
재질이 없고 따로 재질을 지정하지도 않았기 때문이죠.

위에서 생성한 .OBJ 로더에는 이름 : 재질 쌍을 객체로 지정할 수 있습니다.
.OBJ 파일을 불러올 때, 이름이 지정되었다면 로더에 지정한 재질 중에 이름(키)과
일치하는 재질을 찾아 사용하고, 재질을 찾지 못했다면 기본 재질을 사용하죠.

.OBJ 파일을 생성할 때 재질에 대한 데이터를 담은 .MTL 파일이 같이 생성되기도
합니다. 방금의 경우에도 .MTL 파일이 같이 생성되었죠. MTL 파일은 ASCII 인코딩이므로
일반 텍스트 파일처럼 열어볼 수 있습니다.

```mtl
# Blender MTL File: 'windmill_001.blend'
# Material Count: 2

newmtl Material
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_lopatky_COL.jpg
map_Bump windmill_001_lopatky_NOR.jpg

newmtl windmill
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_base_COL.jpg
map_Bump windmill_001_base_NOR.jpg
map_Ns windmill_001_base_SPEC.jpg
```

파일을 살펴보면 2개의 재질과 5개의 jpg 텍스처가 보이는데, 텍스처 파일은
디렉토리 내에 보이지 않습니다. 대체 어디에 있는 걸까요?

<div class="threejs_center"><img style="width: 757px;" src="resources/images/windmill-exported-files.png"></div>

생성된 거라고는 .OBJ 파일 하나와 .MTL 파일 하나 뿐입니다.

사실 방금 사용한 모델의 텍스처는 .blend 파일에 포함되어 있습니다.
**File->External Data->Unpack All Into Files**를 선택하고

<div class="threejs_center"><img style="width: 828px;" src="resources/images/windmill-export-textures.jpg"></div>

**Write Files to Current Directory**를 선택해 텍스처를 별도 파일로
내보낼 수 있습니다.

<div class="threejs_center"><img style="width: 828px;" src="resources/images/windmill-overwrite.jpg"></div>

이러면 .blend 파일과 같은 경로의 **textures** 폴더 안에 텍스처 파일이
생성됩니다.

<div class="threejs_center"><img style="width: 758px;" src="resources/images/windmill-exported-texture-files.png"></div>

내보낸 텍스처를 복사해 .OBJ 파일과 같은 경로에 두겠습니다.

<div class="threejs_center"><img style="width: 757px;" src="resources/images/windmill-exported-files-with-textures.png"></div>

이제 .MTL 파일에서 사용할 텍스처를 생성했으니 .MTL 파일을 불러오도록 합시다.

`MTLLoader`와 `MTLObjBridge` 모듈을 불러옵니다.

```js
import * as THREE from './resources/three/r115/build/three.module.js';
import { OrbitControls } from './resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from './resources/threejs/r115/examples/jsm/loaders/OBJLoader2.js';
+import { MTLLoader } from './resources/threejs/r115/examples/jsm/loaders/MTLLoader.js';
+import { MtlObjBridge } from './resources/threejs/r115/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';
```

우선 .MTL 파일을 불러와 `MtlObjBridge`로 재질을 만듭니다. 그리고 `OBJLoader2`
인스턴스에 방금 만든 재질을 추가한 뒤 .OBJ 파일을 불러옵니다.

```js
{
+  const mtlLoader = new MTLLoader();
+  mtlLoader.load('resources/models/windmill/windmill.mtl', (mtlParseResult) => {
+    const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
+    objLoader.addMaterials(materials);
    objLoader.load('resources/models/windmill/windmill.obj', (root) => {
      scene.add(root);
    });
+  });
}
```

{{{example url="../threejs-load-obj-materials.html" }}}

얼핏 제대로 불러온 것 같지만 아직 부족한 점이 있습니다. 모델을 이리저리
회전시켜 보면 풍차의 날개 뒷면이 사라지는 것을 볼 수 있을 겁니다.

<div class="threejs_center"><img style="width: 528px;" src="resources/images/windmill-missing-cloth.jpg"></div>

[재질에 관한 글](threejs-materials.html)을 읽었다면 원인이 무엇인지 알
겁니다. 일단 풍차의 날개 양면을 모두 렌더링하도록 설정해야 겠네요. .MTL
파일을 직접 수정하기는 어렵습니다. 그렇다면 쉽게 떠올릴 수 있는 방법은
3가지 정도죠.

1. 모든 재질을 불러온 뒤 반복문으로 처리한다.

        const mtlLoader = new MTLLoader();
        mtlLoader.load('resources/models/windmill/windmill.mtl', (mtlParseResult) => {
          const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
          for (const material of Object.values(materials)) {
            material.side = THREE.DoubleSide;
          }
          ...

  문제가 해결되긴 하겠지만, 양면 렌더링은 단면 렌더링에 비해 성능이 느립니다.
  양면일 필요가 있는 재질만 양면으로 렌더링하는 게 이상적이겠죠.

2. 특정 재질을 골라 설정한다.

  .MTL 파일에는 `"windmill"`, `"Material"` 2개의 재질이 있습니다. 여러 번의 시도와
  에러 끝에 날개가 `"Material"`이라는 이름의 재질을 쓴다는 것을 알아낸 뒤, 이 재질에만
  양면 속성을 설정할 수도 있을 겁니다.

        const mtlLoader = new MTLLoader();
        mtlLoader.load('resources/models/windmill/windmill.mtl', (mtlParseResult) => {
          const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
          materials.Material.side = THREE.DoubleSide;
          ...

3. .MTL 파일의 한계에 굴복하고 직접 재질을 만든다.

        const materials = {
          Material: new THREE.MeshPhongMaterial({...}),
          windmill: new THREE.MeshPhongMaterial({...}),
        };
        objLoader.setMaterials(materials);

뭘 선택하든 그건 여러분의 선택입니다. 1번이 가장 간단하고, 3번이 가장
확장성이 좋죠. 2번은 그 중간입니다. 지금은 2번 해결책을 사용하도록 하죠.

해결책을 적용하면 날개가 제대로 보일 겁니다. 하지만 문제가 하나 더 남았습니다.
모델을 확대해보면 텍스처가 굉장히 각져 보일 거예요.

<div class="threejs_center"><img style="width: 700px;" src="resources/images/windmill-blocky.jpg"></div>

뭐가 문제일까요?

텍스처 파일 중에는 NOR, 법선 맵(NORmal map)이라는 이름이 붙은 파일이 있습니다.
이 파일이 바로 법선 맵이죠. 범프 맵(bump map)이 흑백이라면 법선 맵은 보통
자주색을 띱니다. 범프 맵이 표면의 높이를 나타낸다면 법선 맵은 표면의 방향을
나타내죠.

<div class="threejs_center"><img style="width: 256px;" src="../resources/models/windmill/windmill_001_base_NOR.jpg"></div>

[MTLLoader의 소스 코드](https://github.com/mrdoob/three.js/blob/1a560a3426e24bbfc9ca1f5fb0dfb4c727d59046/examples/js/loaders/MTLLoader.js#L432)를
살펴보면 법선 맵의 키(key)가 `norm`이어야 한다고 합니다. 간단히 .MTL 파일을
수정해보죠.

```mtl
# Blender MTL File: 'windmill_001.blend'
# Material Count: 2

newmtl Material
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_lopatky_COL.jpg
-map_Bump windmill_001_lopatky_NOR.jpg
+norm windmill_001_lopatky_NOR.jpg

newmtl windmill
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_base_COL.jpg
-map_Bump windmill_001_base_NOR.jpg
+norm windmill_001_base_NOR.jpg
map_Ns windmill_001_base_SPEC.jpg
```

이제 법선 맵이 정상적으로 적용되었고, 날개의 뒷면도 제대로 보입니다.

{{{example url="../threejs-load-obj-materials-fixed.html" }}}

다른 파일도 불러와봅시다.

인터넷을 뒤져 [CC-BY-NC](https://creativecommons.org/licenses/by-nc/4.0/)
풍차 3D 모델을 발견했습니다(작가: [Roger Gerzner / GERIZ.3D Art](http://www.gerzi.ch/)).

<div class="threejs_center"><img src="resources/images/windmill-obj-2.jpg"></div>

.OBJ 형식으로 다운 받을 수 있으므로, 해당 형식으로 받아 불러오겠습니다(잠깐
.MTL 로더를 제거했습니다).

```js
-  objLoader.load('resources/models/windmill/windmill.obj', ...
+  objLoader.load('resources/models/windmill-2/windmill.obj', ...
```

{{{example url="../threejs-load-obj-wat.html" }}}

음, 아무것도 나타나지 않습니다. 뭐가 문제일까요? 모델의 원래 크기 때문일까요?
Three.js로부터 모델 사이즈를 구해 카메라를 한 번 업데이트해보겠습니다.

먼저 Three.js가 방금 불러온 모델을 감싸는 육면체를 계산해 모델의 크기와 중심점을
구하는 코드를 작성합니다.

```js
objLoader.load('resources/models/windmill_2/windmill.obj', (root) => {
  scene.add(root);

+  const box = new THREE.Box3().setFromObject(root);
+  const boxSize = box.getSize(new THREE.Vector3()).length();
+  const boxCenter = box.getCenter(new THREE.Vector3());
+  console.log(boxSize);
+  console.log(boxCenter);
```

[자바스크립트 콘솔](threejs-debugging-javascript.html)을 확인해보면 아래와
같은 결과가 보일 겁니다.

```js
size 2123.6499788469982
center p { x: -0.00006103515625, y: 770.0909731090069, z: -3.313507080078125 }
```

이 카메라는 현재 `near` 0.1, `far`가 100 이므로 약 100칸 정도를 투사합니다.
땅도 40x40칸인데 이 모델은 2000칸이죠. 카메라의 시야보다 훨씬 크니 절두체 영역
밖에 있는 게 당연합니다.

<div class="threejs_center"><img style="width: 280px;" src="resources/images/camera-inside-windmill.svg"></div>

수작업으로 고칠 수도 있지만, 카메라가 장면의 크기를 자동으로 감지하도록 만들어보겠습니다.
방금 모델의 크기를 구할 때 썼던 육면체를 이용하면 되겠네요. 카메라의 위치를 정하는 데
*정해진* 방법은 없습니다. 경우에 따라 카메라의 방향과 위치가 다르니 그때 그때 상황에
맞춰 방법을 찾아야 하죠.

[카메라에 관해 배운 내용](threejs-cameras.html)을 떠올려봅시다. 카메라를 만들려면
절두체를 정의해야 하죠. 절두체는 `fov(시야각, field of view)`, `near`, `far` 속성을
지정해 정의합니다. 시야각이 얼마이든, 절두체가 무한히 늘어난다고 가정할 때, 장면을
둘러싼 육면체가 절두체 안에 들어오게 하려면 카메라를 얼마나 멀리 보내야 할까요? 그러니까
`near`가 0.00000001이고 `far`가 무한대라 가정했을 때 말이죠.

다행히 시야각과 육면체의 크기를 아니 다음 그림과 같은 삼각형을 사용할 수 있습니다.

<div class="threejs_center"><img style="width: 600px;" src="resources/images/camera-fit-scene.svg"></div>

그림에서 왼쪽은 카메라이고, 카메라에서 뻗어나온 파란 절두체가 풍차를 투사합니다.
방금 풍차를 둘러싼 육면체의 위치값을 계산했죠. 이제 얼마나 카메라를 멀리 보내야
육면체가 절두체 안에 들어올지 계산해야 합니다.

절두체의 시야각과 육면체의 크기를 구했으니, 기본 삼각함수와 [*SOHCAHTOA](https://www.google.com/search?q=SOHCAHTOA)를
이용해 카메라와 육면체의 *거리(distance)*를 구할 수 있습니다.

※ SOH-CAH-TOA: 한국에서 삼각함수를 배울 때 얼싸안코와 비슷한 식으로 외우듯,
영미권에도 삼각함수를 배울 때 Sin = Opposite(대변) 나누기 Hypotenuse(빗변),
Cos = Adjacent(밑변) 나누기 Hypotenuse, Tan = Oppsite 나누기 Adjacent와 같은
식으로 외웁니다. 이를 줄여서 SOH-CAH-TOA(소-카-토아)라고 부릅니다. 역주.

<div class="threejs_center"><img style="width: 600px;" src="resources/images/field-of-view-camera.svg"></div>

그림을 기반으로 계산식을 짜보겠습니다.

```js
distance = halfSizeToFitOnScreen / tangent(halfFovY) // 거리 = 화면 크기의 반 / 탄젠트(시야각의 절반)
```

이제 위 계산식을 코드로 옮겨야 합니다. 먼저 `distance(거리)`를 구한 뒤
카메라를 육면체의 중심에서 `distance`값만큼 옮깁니다. 그리고 카메라가 육면체의
`center(중심)`을 바라보게 설정합니다.

```js
function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

  // 육면체의 중심에서 카메라가 있는 곳으로 향하는 방향 벡터를 계산합니다
  const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();

  // 방향 벡터에 따라 카메라를 육면체로부터 일정 거리에 위치시킵니다
  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

  // 육면체를 투사할 절두체를 near와 far값으로 정의합니다
  camera.near = boxSize / 100;
  camera.far = boxSize * 100;

  camera.updateProjectionMatrix();

  // 카메라가 육면체의 중심을 바라보게 합니다
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}
```

이 함수는 `boxSize`와 `sizeToFitOnScreen`, 두 개의 크기값을 매개변수로 받습니다.
`boxSize` 값으로 `sizeToFitOnScreen` 값을 대체할 수도 있지만, 이러면 육면체가
화면에 꽉 차게 됩니다. 조금 여유가 있는 편이 보기 편하므로 조금 더 큰 값을 넘겨주도록
하겠습니다.

```js
{
  const objLoader = new OBJLoader2();
  objLoader.load('resources/models/windmill_2/windmill.obj', (root) => {
    scene.add(root);
+    // 모든 요소를 포함하는 육면체를 계산합니다
+    const box = new THREE.Box3().setFromObject(root);
+
+    const boxSize = box.getSize(new THREE.Vector3()).length();
+    const boxCenter = box.getCenter(new THREE.Vector3());
+
+    // 카메라가 육면체를 완전히 감싸도록 설정합니다
+    frameArea(boxSize * 1.2, boxSize, boxCenter, camera);
+
+    // 마우스 휠 이벤트가 큰 크기에 대응하도록 업데이트합니다
+    controls.maxDistance = boxSize * 10;
+    controls.target.copy(boxCenter);
+    controls.update();
  });
}
```

위 예제에서는 `boxSize * 1.2` 값을 넘겨주어 20% 정도 빈 공간을 더 만들었습니다.
또 카메라가 장면의 중심을 기준으로 회전하도록 `OrbitControls`도 업데이트했죠.

이제 코드를 실행하면...

{{{example url="../threejs-load-obj-auto-camera.html" }}}

성공했습니다. 마우스로 장면을 드래그하면 풍차가 보일 거예요. 하지만 카메라가 풍차의
정면이 아닌 아래쪽을 먼저 보여줍니다. 이는 풍차가 너무 커서 육면체의 중심이 약
(0, 770, 0)인데, 카메라를 육면체의 중심에서 기존 위치 (0, 10, 20) 방향으로 `distance`만큼
옮겼기에 풍차의 아래쪽에 카메라가 위치하게 된 것입니다.

<div class="threejs_center"><img style="width: 360px;" src="resources/images/computed-camera-position.svg"></div>

카메라의 기존 위치에 상관없이 육면체의 중심을 기준으로 카메라를 배치해보겠습니다.
단순히 카메라와 육면체 간 벡터의 `y` 요소를 0으로 만들면 됩니다. `y` 요소를 0으로
만든 뒤 벡터를 정규화(normalize)하면, XZ 면에 평행한 벡터, 그러니까 바닥에 평행한
벡터가 되겠죠.

```js
-// 육면체의 중심에서 카메라가 있는 곳으로 향하는 방향 벡터를 계산합니다
-const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).normalize();
+// 카메라와 육면체 사이의 방향 벡터를 항상 XZ 면에 평행하게 만듭니다
+const direction = (new THREE.Vector3())
+    .subVectors(camera.position, boxCenter)
+    .multiply(new THREE.Vector3(1, 0, 1))
+    .normalize();
```

풍차의 아랫면을 보면 작은 정사각형이 하나 보일 겁니다. 원래 땅으로 썼던 평면이죠.

<div class="threejs_center"><img style="width: 365px;" src="resources/images/tiny-ground-plane.jpg"></div>

원래 땅은 40x40칸이었으니 풍차에 비해 훨씬 작은 것이 당연합니다. 풍차의 크기는
2000칸이 넘습니다. 땅을 풍차에 맞게 키워야 겠네요. 또 크기만 키우면 체크무늬가
너무 작아 확대하지 않는 한 보기가 어려울 테니 체스무늬 한 칸의 크기도 키우겠습니다.

```js
-const planeSize = 40;
+const planeSize = 4000;

const loader = new THREE.TextureLoader();
const texture = loader.load('resources/images/checker.png');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.magFilter = THREE.NearestFilter;
-const repeats = planeSize / 2;
+const repeats = planeSize / 200;
texture.repeat.set(repeats, repeats);
```

{{{example url="../threejs-load-obj-auto-camera-xz.html" }}}

이제 재질을 다시 붙여봅시다. 이전 모델과 마찬가지로 텍스처에 대한 데이터를 담은
.MTL 파일이 보입니다. 하지만 동시에 다른 문제도 보이네요.

```shell
 $ ls -l windmill
 -rw-r--r--@ 1 gregg  staff       299 May 20  2009 windmill.mtl
 -rw-r--r--@ 1 gregg  staff    142989 May 20  2009 windmill.obj
 -rw-r--r--@ 1 gregg  staff  12582956 Apr 19  2009 windmill_diffuse.tga
 -rw-r--r--@ 1 gregg  staff  12582956 Apr 20  2009 windmill_normal.tga
 -rw-r--r--@ 1 gregg  staff  12582956 Apr 19  2009 windmill_spec.tga
```

어마어마하게 큰 TARGA (.tga) 파일이 있습니다.

THREE.js에 TGA 로더가 있기는 하나 대부분의 경우 이를 사용하는 건 좋지 않습니다.
아주 소수의 경우, 예를 들어 사용자가 임의의 3D 모델 파일을 불러와 확인할 수 있는
뷰어를 만든다거나 하는 경우라면 TGA 파일을 사용할 수도 있죠.([*](#loading-scenes))

TGA 파일의 문제점 중 하나는 압축을 거의 하지 않는다는 점입니다. TGA는 아주 간단한
압축만 지원하죠. 파일의 크기가 모두 같을 확률은 매우 희박하니, 위 파일들은 아예
압축이 되지 않았다고 볼 수 있습니다. 게다가 파일 하나당 무려 12 메가바이트!! 저
파일을 그대로 사용한다면 사용자는 풍차 하나를 보기 위해 36MB의 데이터를 다운받아야
하는 셈이 됩니다.

또한 브라우저가 TGA를 지원하지 않기에, .JPG나 .PNG 파일보다 로딩 시간이 훨씬 느릴
겁니다.

확신하건데, 이 경우 .JPG 파일로 변환하는 게 가장 좋은 선택입니다. TGA 파일은 알파값이
없는 RGB 3개의 채널로 구성되죠. JPG도 채널 3개만 사용하니 딱 적당합니다. 또 JPG는 손실
압축을 사용하기에 파일 용량을 훨씬 많이 줄일 수 있습니다.

파일을 열어보니 각각 해상도가 2048x2048입니다. 쓰기에 따라 다르겠지만, 저는 이게 다소
낭비라는 생각에 해상도를 1024x1024로 낯추고 포토샵의 퀄리티 설정을 50%로 지정했습니다.
다시 파일 구조를 살펴보죠.

```shell
 $ ls -l ../threejsfundamentals.org/threejs/resources/models/windmill
 -rw-r--r--@ 1 gregg  staff     299 May 20  2009 windmill.mtl
 -rw-r--r--@ 1 gregg  staff  142989 May 20  2009 windmill.obj
 -rw-r--r--@ 1 gregg  staff  259927 Nov  7 18:37 windmill_diffuse.jpg
 -rw-r--r--@ 1 gregg  staff   98013 Nov  7 18:38 windmill_normal.jpg
 -rw-r--r--@ 1 gregg  staff  191864 Nov  7 18:39 windmill_spec.jpg
```

36MB에서 0.55MB가 되었네요! 물론 디자너이너의 생각은 다를 수 있으니 절충안을
찾기 전에 상의를 하는 것이 좋습니다.

이제 .MTL 파일을 열어 .TGA 파일 경로를 .JPG 파일로 바꿉니다. 다행히 .MTL 파일은
텍스트라 수정이 어렵지 않습니다.

```mtl
newmtl blinn1SG
Ka 0.10 0.10 0.10

Kd 0.00 0.00 0.00
Ks 0.00 0.00 0.00
Ke 0.00 0.00 0.00
Ns 0.060000
Ni 1.500000
d 1.000000
Tr 0.000000
Tf 1.000000 1.000000 1.000000 
illum 2
-map_Kd windmill_diffuse.tga
+map_Kd windmill_diffuse.jpg

-map_Ks windmill_spec.tga
+map_Ks windmill_spec.jpg

-map_bump windmill_normal.tga 
-bump windmill_normal.tga 
+map_bump windmill_normal.jpg 
+bump windmill_normal.jpg 
```

텍스처의 용량을 최적화했으니 이제 불러올 일만 남았습니다. 먼저 아까 했던 것처럼
재질을 불러와 `OBJLoader2`에 지정합니다.

```js
{
+  const mtlLoader = new MTLLoader();
+  mtlLoader.load('resources/models/windmill_2/windmill-fixed.mtl', (mtlParseResult) => {
+    const objLoader = new OBJLoader2();
+    const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
+    objLoader.addMaterials(materials);
    objLoader.load('resources/models/windmill/windmill.obj', (root) => {
      root.updateMatrixWorld();
      scene.add(root);
      // 모든 요소를 포함하는 육면체를 계산합니다
      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      // 카메라가 육면체를 완전히 감싸도록 설정합니다
      frameArea(boxSize * 1.2, boxSize, boxCenter, camera);

      // 마우스 휠 이벤트가 큰 크기에 대응하도록 업데이트합니다
      controls.maxDistance = boxSize * 10;
      controls.target.copy(boxCenter);
      controls.update();
    });
+  });
}
```

결과를 확인했는데 문제가 발생했습니다. 여러분에게 직접 보여주기보다 하나하나
짚어보도록 하죠.

문제 #1: 3개의 `MTLLoader`가 각각 디퓨즈(diffuse) 색과 디퓨즈 텍스처 맵으로
혼합하는 재질을 만듬.

이는 유용한 기능이지만, .MTL 파일의 디퓨즈 색상은 0입니다.

```mtl
Kd 0.00 0.00 0.00
```

(텍스처 맵 * 0 = 검정)이죠. 모델링 프로그램에서는 디퓨즈 텍스처 맵과 디퓨즈 색을 혼합하지
않아도 모델이 제대로 보입니다. 이 풍차를 만든 디자이너 입장에서는 이 파일이 문제가
없다고 생각하는 것이 당연하죠.

.MTL 파일을 다음과 같이 수정해 문제를 해결할 수 있습니다.

```mtl
Kd 1.00 1.00 1.00
```

(텍스처 맵 * 1 = 텍스처 맵)이니까요.

문제 #2: 스페큘러(specular) 색이 검정임.

`Ks`로 시작하는 줄은 스페큘러 색을 나타냅니다. 이 역시 디자이너가 사용한 모델링
프로그램이 디퓨즈 맵처럼 뭔가 다른 처리를 해주었을 겁니다. Three.js는 스페큘러
색을 얼마나 많이 반사할지 결정할 때 스페큘러 맵의 빨강(red) 채널만 사용하기는
하나, 3가지 색상 채널을 모두 지정하긴 해야 합니다.

디퓨즈 색과 마찬가지로 .MTL 파일을 다음과 같이 수정하겠습니다.

```mtl
-Ks 0.00 0.00 0.00
+Ks 1.00 1.00 1.00
```

문제 #3: `windmill_normal.jpg`가 법선 맵이 아닌 범프 맵임.

마찬가지로 .MTL 파일을 수정해줍니다.

```mtl
-map_bump windmill_normal.jpg 
-bump windmill_normal.jpg 
+norm windmill_normal.jpg 
```

위 변경 사항을 모두 반영하면 재질이 정상적으로 적용될 겁니다.

{{{example url="../threejs-load-obj-materials-windmill2.html" }}}

모델을 불러올 때 주의해야 하는 점을 몇 가지만 적어보겠습니다.

* 크기를 알아야 한다

  예제에서는 카메라가 장면 전체를 감싸도록 했지만, 이게 항상 최적의 해결책이 될 수는 없습니다.
  직접 모델을 만들거나, 모델을 다운받아 3D 프로그램으로 크기를 조절하는 것이 더 이상적인 방법입니다.

* 잘못된 방향축

  Three.js에서는 보통 Y축이 위쪽입니다. 모델링 프로그램에서는 Z축이 위쪽인 경우, Y축이 위쪽인 경우, 직접
  설정할 수 있는 경우 등 경우가 다양하죠. 모델을 불러왔는데 방향이 잘못되었다면, 모델을 불러온 후 방향을
  바꾸거나(권장하지 않음), 3D 프로그램이나 커맨드 라인 프로그램으로 모델을 원하는 방향으로 맞출 수 있습니다.
  브라우저에서 이미지를 쓸 때와 마찬가지로, 이미지를 수정하는 코드를 넣는 것보다는 이미지를 다운받아 이미지
  자체를 편집하는 게 더 나을 겁니다. 블렌더에서는 아예 파일을 내보낼 때 방향을 바꿀 수 있습니다.

* .MTL 파일이 없거나 재질 또는 지원하지 않는 값이 있는 경우

  위 예제를 만들 때 .MTL 파일 덕에 재질을 만드는 수고는 덜었지만, 몇 가지 문제가 있었습니다. 문제를 해결하기
  위해 직접 .MTL 파일을 수정했고요. 파일을 열어 .OBJ 파일 안에 어떤 재질이 있는지 확인하거나, Three.js로
  .OBJ 파일을 불러와 재질을 전부 출력하도록 하는 것은 꽤 자주 있는 일입니다. 그런 후에 .MTL 파일 대신 직접
  재질을 만들어 적절한 이름/재질 쌍의 객체로 로더에 넘겨주거나, 장면을 렌더링한 뒤 테스트하면서 문제를 수정하는
  것이죠.

* 고용량 텍스처

  3D 모델은 주로 건축, 영화나 광고, 게임 등에서 사용합니다. 건축이나 영화 같은 분야라면 텍스처의 용량을
  신경 쓸 필요는 없죠. 반면 게임의 경우는 메모리도 제한적이고 로컬 환경에서 구동되기에 신경을 꽤 써야 합니다.
  웹 페이지의 경우는 빠르게 불러와야 하니 용량이 퀄리티가 너무 떨어지지 않는 선에서 최대한 작은 게 좋죠.
  첫 번째로 쓴 풍차의 경우, 실제로 사용하려면 텍스처를 손볼 필요가 있습니다. 지금은 총 용량이 무려 10MB가
  넘거든요!!!

  또한 [텍스처에 관한 글](threejs-textures.html)에서 말했듯, 텍스처의 해상도도 고려해야 합니다. 50KB짜리
  4096x4096 JPG 이미지는 불러오는 속도는 빠를지 몰라도 굉장히 많은 메모리를 차지할 테니까요.

마지막으로 풍차가 돌아가는 것을 보여주고 싶지만, .OBJ 파일에는 계층 구조가 없습니다. 다시 말해 풍차의 모든
요소를 기본적으로 1개의 mesh로 취급한다는 것이죠. 풍차의 날개를 건물에서 분리할 수 없기에 날개를 회전시킬
수가 없습니다.

이런 이유로 .OBJ는 그다지 좋은 파일 형식이라고 하기 어렵습니다. 추측하건데 .OBJ 형식을 자주 사용하는 이유는
사용법이 간단하고, 복잡한 기능이 필요 없는 경우가 많기 때문일 겁니다. 예를 들어 건축 디자인을 하는 경우,
대부분 애니메이션이 필요 없기에 장면에 정적 요소를 추가하는 게 더 좋을 수 있죠.

.gLTF는 .OBJ보다 더 많은 기능을 지원합니다. 다음 글에서는 이 gLTF 장면을 불러오는 법에 대해 알아보겠습니다.
