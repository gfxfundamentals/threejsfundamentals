Title: Three.js의 텍스처(Textures)
Description: Three.js에서 텍스처(Textures)를 사용하는 법을 알아봅니다.
TOC: 텍스처(Textures)

※ 이 글은 Three.js의 튜토리얼 시리즈로서,
먼저 [Three.js의 기본 구조에 관한 글](threejs-fundamentals.html)과
[개발 환경 설정하는 법](threejs-setup.html)을 읽고 오길 권장합니다.

※ 텍스처, Texture는 "질감"으로 번역할 수 있으나, 그대로 표기하는 쪽이
직관적이라 판단하여 **텍스처**로 번역하였습니다.


Three.js에서 텍스처를 이야기하기란 쉽지 않습니다. 텍스처는 워낙 방대한
주제이고, 각 주제끼리도 서로 연결되어 있어 한 번에 설명하는 것이 거의
불가능에 가깝기 때문이죠. 어떻게 설명해야 잘 설명했다고 할 수 있을지
확신은 없지만, 일단 해보기로 합시다. 다음은 이 글의 간략한 목차입니다.

<ul>
<li><a href="#hello">하이, 텍스처</a></li>
<li><a href="#six">육면체 각 면에 다른 텍스처 지정하기</a></li>
<li><a href="#loading">텍스처 불러오기</a></li>
<ul>
  <li><a href="#easy">간단한 방법</a></li>
  <li><a href="#wait1">텍스처를 불러온 후 처리하기</a></li>
  <li><a href="#waitmany">다수의 텍스처를 불러온 후 처리하기</a></li>
  <li><a href="#cors">다른 도메인(origin)에서 텍스처 불러오기</a></li>
</ul>
<li><a href="#memory">메모리 관리</a></li>
<li><a href="#format">JPG vs PNG</a></li>
<li><a href="#filtering-and-mips">필터링과 Mips</a></li>
<li><a href="#uvmanipulation">텍스처의 반복(repeating), 위치 조절(offseting), 회전(rotating), 래핑(wrapping)</a></li>
</ul>

## <a name="hello"></a> 하이, 텍스처

텍스처는 *일반적으로* 포토샵이나 김프 등의 프로그램으로 만든 이미지입니다.
예를 들어 아래 이미지를 정육면체에 씌워보죠.

<div class="threejs_center">
  <img src="../resources/images/wall.jpg" style="width: 600px;" class="border" >
</div>

예제는 처음 만들었던 것을 사용하겠습니다. 추가로 `TextureLoader`를 새로 생성한
뒤, 인스턴스의 [`load`](TextureLoader.load) 메서드에 이미지의 URL을 넘겨주어 호출하고,
반환 받은 값을 재질(material)의 `map` 속성에 지정합니다(`color` 속성은 지정하지
않습니다).

```js
+const loader = new THREE.TextureLoader();

const material = new THREE.MeshBasicMaterial({
-  color: 0xFF8844,
+  map: loader.load('resources/images/wall.jpg'),
});
```

※ `MeshBasicMaterial`을 사용했으므로 광원을 사용할 필요가 없습니다.

{{{example url="../threejs-textured-cube.html" }}}

## <a name="six"></a> 육면체 각 면에 다른 텍스처 지정하기

이번에는 육면체의 각 면에 다른 텍스처를 넣어볼까요?

<div class="threejs_center">
  <div>
    <img src="../resources/images/flower-1.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-2.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-3.jpg" style="width: 100px;" class="border" >
  </div>
  <div>
    <img src="../resources/images/flower-4.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-5.jpg" style="width: 100px;" class="border" >
    <img src="../resources/images/flower-6.jpg" style="width: 100px;" class="border" >
  </div>
</div>

단순히 재질을 6개 만들어 `Mesh`를 생성할 때 배열로 넘겨주기만 하면 됩니다.

```js
const loader = new THREE.TextureLoader();

-const material = new THREE.MeshBasicMaterial({
-  map: loader.load('resources/images/wall.jpg'),
-});
+const materials = [
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-1.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-2.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-3.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-4.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-5.jpg')}),
+  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-6.jpg')}),
+];
-const cube = new THREE.Mesh(geometry, material);
+const cube = new THREE.Mesh(geometry, materials);
```

껌이네요.

{{{example url="../threejs-textured-cube-6-textures.html" }}}

주의해야할 점은 모든 `geometry`가 재질을 배열로 받진 않는다는 점입니다.
`BoxGeometry`나 `BoxBufferGeometry`는 최대 6개, `ConeGeometry`와
`ConeBufferGeometry`는 밑면과 뿔 부분에 하나씩 최대 2개, `CylinderGeometry`와
`CylinderBufferGeometry`는 아래, 위, 옆면 하나씩 최대 3개를 지정할 수 있죠.
다른 경우에는 `geometry`를 따로 만들거나, 텍스처의 좌표를 직접 수정해야 합니다.

다른 3D 엔진에서나 Three.js에서나, 하나의 `geometry`에서 여러 텍스처를 쓰고 싶을 때는
보통 [텍스처 아틀라스](https://en.wikipedia.org/wiki/Texture_atlas)를 사용합니다.
텍스처 아틀라스란 여러 이미지로 구성된 하나의 텍스처로, `geometry`의 정점에 따라 텍스처의
좌표를 조절해 `geometry`의 각 삼각형이 텍스처의 일정 부분을 표현하도록 할 수 있습니다.

그렇다면 텍스처의 좌표란 무엇일까요? 이는 `geometry`의 각 정점에 추가되는 데이터로, 특정
정점에 텍스처의 어느 부분을 써야하는지를 나타냅니다. 자세한 사용법은 나중에
[사용자 지정 geometry 만들기](threejs-custom-geometry.html)에서 살펴보겠습니다.

## <a name="loading"></a> 텍스처 불러오기

### <a name="easy"></a> 간단한 방법

이 사이트의 예제는 대부분 텍스처를 로딩할 때 간단한 메서드를 사용했습니다.
`TextureLoader`를 생성하고, 인스턴스의 [`load`](TextureLoader.load) 메서드를
호출하는 거죠. 이 `load` 메서드는 `Texture` 객체를 반환합니다.

```js
const texture = loader.load('resources/images/flower-1.jpg');
```

알아둬야 할 건 이 메서드는 비동기로 작동한다는 점입니다. 이미지를 완전히
불러온 후 이미지로 텍스처를 업데이트하기 전까지, 텍스처는 투명하게 보일 겁니다.

텍스처를 전부 불러오지 않아도 브라우저가 페이지 렌더링을 시작할 것이므로 이는
속도면에서 꽤 큰 장점입니다. 텍스처를 언제 다 불러왔는지 알아야 하는 경우가
아니라면, 대부분 큰 문제가 되지 않겠죠.

### <a name="wait1"></a> 텍스처를 불러온 후 처리하기

텍스처를 불러온 후 후처리를 위해 `load` 메서드는 두 번째 인자로 콜백(callback)
함수를 받습니다. 이 함수는 텍스처를 전부 불러온 후 호출되죠. 글의 첫 번째 예제를
조금 수정해보겠습니다.

```js
const loader = new THREE.TextureLoader();
loader.load('resources/images/wall.jpg', (texture) => {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  cubes.push(cube);  // 회전 애니메이션을 위해 배열에 추가
});
```

브라우저의 캐시를 비우거나 인터넷 연결 속도가 느리지 않는 한 차이를 느끼기
어렵긴 하지만, 텍스처를 불러온 뒤 화면을 렌더링합니다.

{{{example url="../threejs-textured-cube-wait-for-texture.html" }}}

### <a name="waitmany"></a> 다수의 텍스처를 불러온 후 처리하기

다수의 텍스처를 한 번에 불러와야 할 경우 `LoadingManager`를 사용할 수 있습니다.
`TextureLoader`를 생성할 때 미리 생성한 `LoadingManager`의 인스턴스를 인자로
넘겨주고, `LoadingManager` 인스턴스의 [`onLoad`](LoadingManager.onLoad) 속성에
콜백 함수를 설정해주는 거죠.

```js
+const loadManager = new THREE.LoadingManager();
*const loader = new THREE.TextureLoader(loadManager);

const materials = [
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-1.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-2.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-3.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-4.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-5.jpg')}),
  new THREE.MeshBasicMaterial({map: loader.load('resources/images/flower-6.jpg')}),
];

+loadManager.onLoad = () => {
+  const cube = new THREE.Mesh(geometry, materials);
+  scene.add(cube);
+  cubes.push(cube);  // 회전 애니메이션을 위해 배열에 추가
+};
```

`LoadingManager`의 [`onProgress`](LoadingManager.onProgress)에 콜백 함수를 지정하면
현재 진행 상태를 추적할 수 있습니다.

일단 HTML로 프로그래스 바(progress bar)를 만들겠습니다.

```html
<body>
  <canvas id="c"></canvas>
+  <div id="loading">
+    <div class="progress"><div class="progressbar"></div></div>
+  </div>
</body>
```

스타일도 추가하죠.

```css
#loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
#loading .progress {
    margin: 1.5em;
    border: 1px solid white;
    width: 50vw;
}
#loading .progressbar {
    margin: 2px;
    background: white;
    height: 1em;
    transform-origin: top left;
    transform: scaleX(0);
}
```

다음으로 `onProgress` 콜백에서 `.progressbar`의 X축 크기를 조정하겠습니다.
콜백 함수는 마지막으로 불러온 자원의 URL, 현재까지 불러온 자원의 수, 총 지원의
수를 매개변수로 받습니다.

```js
+const loadingElem = document.querySelector('#loading');
+const progressBarElem = loadingElem.querySelector('.progressbar');

loadManager.onLoad = () => {
+  loadingElem.style.display = 'none';
  const cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);
  cubes.push(cube);  // 회전 애니메이션을 위해 배열에 추가
};

+loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => { // 마지막으로 불러온 자원의 URL, 현재까지 불러온 자원의 수, 총 지원의 수
+  const progress = itemsLoaded / itemsTotal;
+  progressBarElem.style.transform = `scaleX(${progress})`;
+};
```

캐시를 비우거나 인터넷 속도가 느리지 않다면 프로그래스 바가 보이지 않을
수도 있습니다.

{{{example url="../threejs-textured-cube-wait-for-all-textures.html" }}}

## <a name="cors"></a> 다른 도메인(origin)에서 텍스처 불러오기

다른 서버에서 이미지를 불러오려면 해당 서버가 [CORS 헤더](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)를
보내줘야 합니다. CORS 헤더가 없다면 Three.js가 이미지를 불러오지 않을 것이고,
에러가 발생할 겁니다. 만약 이미지 호스팅 서버를 운영한다면 해당 서버가 CORS 헤더를
보내는지 확인해보세요.

[imgur](https://imgur.com), [flickr](https://flickr.com), [github](https://github.com)
등의 사이트는 자신이 호스팅하는 이미지를 사용해도 좋다는 헤더를 보냅니다.
대부분의 웹사이트는 이를 허용하지 않죠.

## <a name="memory"></a> 메모리 관리

텍스처는 Three.js 앱에서 메모리를 가장 많이 사용하는 요소 중 하나입니다.
*대체로* 텍스처는 약 `너비 * 높이 * 4 * 1.33` 바이트의 메모리를 사용합니다.

여기서 압축은 그다지 중요한 요소가 아닙니다. 예를 들어 집이 포함된 장면(scene)을
만든다고 해보죠. 집 안에는 탁자가 있고, 탁자의 윗면에 나무 텍스처를 씌우려고
합니다.

<div class="threejs_center"><img class="border" src="resources/images/compressed-but-large-wood-texture.jpg" align="center" style="width: 300px"></div>

이 이미지는 매우 고 배율로 압축되어 157kb 밖에 되지 않습니다. 상대적으로
다운 속도는 빠를 것이나, 이 [이미지의 실제 크기는 3024 x 3761 픽셀입니다](resources/images/compressed-but-large-wood-texture.jpg).
위 공식에 따라 이 이미지를 적용해보면,

    3024 * 3761 * 4 * 1.33 = 60505764.5

무려 **약 60 메가바이트의 메모리**를 사용합니다. 이런 텍스처가 몇 개만 더
있어도 메모리 부족으로 앱을 사용하지 못할 수 있죠(OUT_OF_MEMORY).

극단적인 예제이기는 하나, 이 예제는 텍스처를 사용하는데 숨겨진 비용을 고려해야
한다는 것을 잘 알려줍니다. Three.js가 텍스처를 사용하려면 GPU에 텍스처를
넘겨주어야 하는데, GPU는 *일반적으로* 압축하지 않은 데이터를 사용하죠.

이 예시의 교훈은 파일의 용량이 아니라 파일의 해상도를 줄어야 한다는 것입니다.
파일의 용량이 작다면 불러오는 속도가 빠를 것이고, 해상도가 낮다면 메모리를
그만큼 적게 사용하겠죠. 얼마나 낮게 만들어야 할까요? 필요한 만큼 퀄리티를
유지한 선에서 가능한 낮게 만드는 게 좋습니다.

## <a name="format"></a> JPG vs PNG

이는 HTML과 마찬가지입니다. JPG는 손실 압축을 사용하고, PNG는 비손실 압축을
사용하는 대신 보통 PNG가 더 용량이 크죠. 하지만 PNG는 투명도를 지원합니다.
PNG는 비-이미지 데이터인 법선 맵(normal maps), 그리고 나중에 살펴볼 다른
비-이미지 데이터를 사용하기에 현재로써는 가장 적당한 파일 형식입니다.

위에서 말했듯, WebGL에서는 JPG가 용량이 더 작긴 해도 
PNG 형식보다 메모리 점유율이 낮진 않습니다.

## <a name="filtering-and-mips"></a> 필터링과 Mips

이 16x16 텍스처를

<div class="threejs_center"><img src="resources/images/mip-low-res-enlarged.png" class="nobg" align="center"></div>

아래의 정육면체에 적용해보죠.

<div class="spread"><div data-diagram="filterCube"></div></div>

그리고 정육면체를 아주 작게 렌더링합니다.

<div class="spread"><div data-diagram="filterCubeSmall"></div></div>

음, 보기가 어렵네요. 확대해봅시다.

<div class="spread"><div data-diagram="filterCubeSmallLowRes"></div></div>

GPU는 작은 정육면체를 표현할 때 어떻게 각 픽셀의 색상을 결정할까요? 정육면체가
작아도 너무 작아서 1, 2 픽셀 정도라면요?

이게 바로 필터링(filtering)이 있는 이유입니다.

포토샵이라면 근처 픽셀의 평균을 내 해당 1, 2 픽셀의 형태를 결정할 겁니다.
이는 매우 무거운 작업이죠. GPU는 이 문제를 해결하기 위해 [밉맵(mipmaps)](https://ko.wikipedia.org/wiki/%EB%B0%89%EB%A7%B5)을
사용합니다.

밉(mips)은 텍스처의 복사본으로, 각 밉은 축소된 이전 밉보다 반만큼 작습니다.
밉은 1x1 픽셀 밉을 생성할 때까지 계속 생성되죠. 위 이미지의 경우 밉은 다음처럼
생성될 겁니다.

<div class="threejs_center"><img src="resources/images/mipmap-low-res-enlarged.png" class="nobg" align="center"></div>

이제 1, 2 픽셀 정도로 작은 정육면체를 렌더링할 때 GPU는 가장 작거나, 두 번째로
작은 밉을 선택해 텍스처를 적용하기만 하면 되죠.

Three.js에서는 텍스처의 크기가 원본보다 클 때와 작을 때 각각 어떻게 표현할지를
설정할 수 있습니다.

텍스처의 크기가 원본보다 클 때의 필터는 [`texture.magFilter`](Texture.magFilter)
속성을 `THREE.NearestFilter`나 `THREE.LinearFilter`로 지정해 설정합니다.

`NearestFilter`는 말 그대로 텍스처에서 가장 가까운 픽셀을 고르는 것입니다.
낮은 해상도라면 텍스처가 픽셀화되어 마인크래프트 같은 느낌을 주겠죠.

`LinearFilter`는 가장 가까운 4개의 픽셀을 골라 각 픽셀의 실제 거리에 따라 적절한
비율로 섞는 것을 말합니다.

<div class="spread">
  <div>
    <div data-diagram="filterCubeMagNearest" style="height: 250px;"></div>
    <div class="code">Nearest</div>
  </div>
  <div>
    <div data-diagram="filterCubeMagLinear" style="height: 250px;"></div>
    <div class="code">Linear</div>
  </div>
</div>

텍스처가 원본 크기보다 작을 때의 필터는 [`texture.minFilter`](Texture.minFilter)
속성을 다음 6가지 값 중 하나로 지정해 사용합니다.

* `THREE.NearestFilter`

   원본보다 클 때와 마찬가지로 가장 가까운 픽셀을 선택합니다

* `THREE.LinearFilter`

   원본보다 클 때와 마찬가지로 주변의 가까운 픽셀 4개를 골라 섞습니다

* `THREE.NearestMipmapNearestFilter`

   적절한 밉을 고른 뒤 밉에서 픽셀 하나를 선택합니다

* `THREE.NearestMipmapLinearFilter`

   두 개의 밉을 골라 픽셀을 하나씩 선택한 후, 두 픽셀을 섞습니다

* `THREE.LinearMipmapNearestFilter`

   적절한 밉을 고른 뒤 픽셀 4개를 골라 섞습니다

*  `THREE.LinearMipmapLinearFilter`

   두 개의 밉을 골라 각각 픽셀을 4개씩 선택하고, 선택한 8개의 픽셀을 하나의 픽셀로 혼합합니다

아래는 6개의 필터를 각각 적용한 예제입니다.

<div class="spread">
  <div data-diagram="filterModes" style="
    height: 450px;
    position: relative;
  ">
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    ">
      <div style="
        background: rgba(255,0,0,.8);
        color: white;
        padding: .5em;
        margin: 1em;
        font-size: small;
        border-radius: .5em;
        line-height: 1.2;
        user-select: none;"
      >클릭해<br/>텍스처를<br/>변경</div>
    </div>
    <div class="filter-caption" style="left: 0.5em; top: 0.5em;">nearest</div>
    <div class="filter-caption" style="width: 100%; text-align: center; top: 0.5em;">linear</div>
    <div class="filter-caption" style="right: 0.5em; text-align: right; top: 0.5em;">nearest<br/>mipmap<br/>nearest</div>
    <div class="filter-caption" style="left: 0.5em; text-align: left; bottom: 0.5em;">nearest<br/>mipmap<br/>linear</div>
    <div class="filter-caption" style="width: 100%; text-align: center; bottom: 0.5em;">linear<br/>mipmap<br/>nearest</div>
    <div class="filter-caption" style="right: 0.5em; text-align: right; bottom: 0.5em;">linear<br/>mipmap<br/>linear</div>
  </div>
</div>

여기서 주의깊게 봐야할 건 상단 왼쪽 `NearestFilter`와 상단 중앙의 `LinearFilter`는
밉을 사용하지 않는다는 점입니다. 두 텍스처를 보면 멀리 떨어질수록 픽셀이 깜빡이는 증상이
보이죠. 이는 GPU가 픽셀을 원본 텍스처에서 선택하기 때문입니다. `NearestFilter`는 하나의
픽셀을 선택하고, `LinearFilter`는 4개의 픽셀을 선택하기는 하나, 픽셀을 제대로 표현하진
못합니다. 다른 4개 예제는 그나마 낫고, 그 중 `LinearMipmapLinearFilter`가 제일 깔끔해
보이네요.

위 캔버스를 클릭해보면 텍스처를 바꿀 수 있습니다. 하나는 여태까지 사용하던 텍스처이고,
또 하나는 밉의 각 단계가 다른 색으로 나타나는 텍스처이죠.

<div class="threejs_center">
  <div data-texture-diagram="differentColoredMips"></div>
</div>

이 텍스처는 필터의 동작 원리를 이해하기 쉽도록 해줍니다. 위 예제에서 `NearestFilter`와
`LinearFilter`는 아주 멀리까지도 첫 번째 밉을 사용합니다. 반면 상단 오른쪽과 하단 중앙을
보면 밉의 경계가 뚜렷이 보이죠.

다시 원래 텍스처로 바꿔보면 하단 오른쪽이 가장 매끄러운 것이 보일 겁니다. 왜 항상 이
필터를 쓰지 않는 걸까요? 뭐, 레트로 감성을 표현한다든가 하는 이유로 물체들이 픽셀화된
것을 원할 수도 있죠. 하지만 보다 흔한 이유는 성능입니다. 8개의 픽셀 데이터를 처리하는
것보다는 당연히 1개의 픽셀 데이터를 처리하는 게 훨씬 빠르겠죠. 하나의 텍스처로 이런
성능 차이를 체감하기는 어렵지만, Three.js를 사용하다보면 하나의 물체에 4, 5개의 텍스처가
들어가는 경우도 빈번합니다. 4개의 텍스처에서 각각 8개의 픽셀을 처리해야 하니, 이는 한
프레임당 32개의 픽셀을 처리해야 함을 의미하죠. 이는 저사양 기기를 고려할 때 특히 중요히
여겨야 하는 요소입니다.

## <a name="uvmanipulation"></a> 텍스처의 반복(repeating), 위치 조절(offseting), 회전(rotating), 래핑(wrapping)

텍스처에는 반복, 위치, 회전 설정이 있습니다.

Three.js는 기본적으로 텍스처를 반복하지 않습니다. 반복 여부를 설정하는
2가지 속성이 있는데, 하나는 수평 래핑을 설정하는 [`wrapS`](Texture.wrapS)이고,
또 하나는 수직 래핑을 설정하는 [`wrapT`](Texture.wrapT)입니다.

두 속성은 다음 중 하나로 지정할 수 있습니다.

* `THREE.ClampToEdgeWrapping`

   텍스처의 가장자리 픽셀을 계속해서 반복합니다

* `THREE.RepeatWrapping`

   텍스처 자체를 반복합니다

* `THREE.MirroredRepeatWrapping`

   텍스처 자체를 반복하되, 매번 뒤집습니다.

양 방향의 래핑을 키려면 다음과 같이 설정할 수 있습니다.

```js
someTexture.wrapS = THREE.RepeatWrapping;
someTexture.wrapT = THREE.RepeatWrapping;
```

반복은 `repeat` 속성으로 설정할 수 있죠.

```js
const timesToRepeatHorizontally = 4;
const timesToRepeatVertically = 2;
someTexture.repeat.set(timesToRepeatHorizontally, timesToRepeatVertically);
```

텍스처의 위치는 `offset` 속성을 설정해 조절할 수 있습니다. 텍스처 위치의 단위는
텍스처의 크기와 1:1, 즉 0은 위치가 그대로인 것이고 1은 각 축에서 텍스처 크기만큼
이동한 것을 의미하죠.

```js
const xOffset = .5;   // 텍스처 너비의 반만큼 이동
const yOffset = .25;  // 텍스처 높이의 1/4만큼 이동
someTexture.offset.set(xOffset, yOffset);
```

텍스처의 회전은 `rotation` 속성을 라디안(radians) 단위로 지정해 조절할 수 있습니다.
`center` 속성은 회전의 중심을 정하는 데 사용하죠. `center` 속성의 기본값은 `0, 0`으로
왼쪽 상단을 기준으로 회전하고, `offset`과 마찬가지로 텍스처의 크기를 기준으로
단위가 정해지기에 `.5, .5`로 설정하면 텍스처의 중앙을 기준으로 회전합니다.

```js
someTexture.center.set(.5, .5);
someTexture.rotation = THREE.MathUtils.degToRad(45);
```

아까 작성한 예제를 수정해 위 설정을 테스트할 예제를 만들겠습니다.

먼저 텍스처를 별도 변수에 담아 나중에 수정할 수 있도록 합니다.

```js
+const texture = loader.load('resources/images/wall.jpg');
const material = new THREE.MeshBasicMaterial({
-  map: loader.load('resources/images/wall.jpg');
+  map: texture,
});
```

간단한 인터페이스를 만들어보죠.
다시 한 번 [dat.GUI](https://github.com/dataarts/dat.gui)가 등장할 때입니다.

```js
import { GUI } from '../3rdparty/dat.gui.module.js';
```

이전 예제처럼 간단한 헬퍼 클래스를 만들어 각도(degrees)로 값을 조절하면
알아서 호도(radians)로 변환해 지정하게끔 해줍니다.

```js
class DegRadHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return THREE.MathUtils.radToDeg(this.obj[this.prop]);
  }
  set value(v) {
    this.obj[this.prop] = THREE.MathUtils.degToRad(v);
  }
}
```

또 문자열을 숫자형으로 변환시켜줄 클래스도 만듭니다. dat.GUI는 값을 문자열로
넘겨주는데, Three.js는 `wrapS`나 `wrapT` 등 enum 값을 지정할 때 숫자형만
받기 때문이죠.

```js
class StringToNumberHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return this.obj[this.prop];
  }
  set value(v) {
    this.obj[this.prop] = parseFloat(v);
  }
}
```

위에서 만든 클래스를 이용해 설정값을 조절할 GUI를 만듭니다.

```js
const wrapModes = {
  'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
  'RepeatWrapping': THREE.RepeatWrapping,
  'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping,
};

function updateTexture() {
  texture.needsUpdate = true;
}

const gui = new GUI();
gui.add(new StringToNumberHelper(texture, 'wrapS'), 'value', wrapModes)
  .name('texture.wrapS')
  .onChange(updateTexture);
gui.add(new StringToNumberHelper(texture, 'wrapT'), 'value', wrapModes)
  .name('texture.wrapT')
  .onChange(updateTexture);
gui.add(texture.repeat, 'x', 0, 5, .01).name('texture.repeat.x');
gui.add(texture.repeat, 'y', 0, 5, .01).name('texture.repeat.y');
gui.add(texture.offset, 'x', -2, 2, .01).name('texture.offset.x');
gui.add(texture.offset, 'y', -2, 2, .01).name('texture.offset.y');
gui.add(texture.center, 'x', -.5, 1.5, .01).name('texture.center.x');
gui.add(texture.center, 'y', -.5, 1.5, .01).name('texture.center.y');
gui.add(new DegRadHelper(texture, 'rotation'), 'value', -360, 360)
  .name('texture.rotation');
```

텍스처의 `wrapS`나 `wrapT` 속성을 변경할 경우 [`texture.needsUpdate`](Texture.needsUpdate)를
`true`로 설정해줘야 합니다. 나머지 설정만 변경한다면 굳이 이 값을 설정할 필요는 없죠.

{{{example url="../threejs-textured-cube-adjust.html" }}}

뭔가 많은 것을 배운 것 같지만, 이는 맛보기에 불과합니다. 글을 진행하다보면
텍스처의 정렬과 재질에 적용할 수 있는 다른 9가지의 텍스처에 대해 다룰 기회가
있을 거예요.

일단 다음 장에서는 [조명(lights)](threejs-lights.html)에 대해 알아보기로 하죠.

<!--
alpha
ao
env
light
specular
bumpmap ?
normalmap ?
metalness
roughness
-->

<link rel="stylesheet" href="resources/threejs-textures.css">
<script type="module" src="resources/threejs-textures.js"></script>