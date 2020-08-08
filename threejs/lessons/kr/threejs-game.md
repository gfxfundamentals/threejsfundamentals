Title: Three.js로 게임 만들기
Description: Three.js로 게임을 만들어봅니다
Category: solutions
TOC: 게임 만들기

제가 꽤 많이 받았던 질문 중 하나가 Three.js로 게임을 만드는 방법에 관한 것이었습니다. 기초적인 것이긴 해도 부디 이 글에 여러분이 원했던 내용이 있다면 좋겠네요.

글을 쓰는 현재를 기준으로, 아마 이 글이 이 시리즈에서 가장 긴 글이 될 것 같습니다. 예제로 쓴 코드가 지나치게 전문적으로 보일 수도 있지만 그건 예제를 만들며 문제가 생길 때마다 이전에 제가 실제로 만들었던 게임의 코드를 가져와서 그렇습니다. 또한 왜 이런 해결책을 썼는지 최대한 적으려고 했으니 길 수밖에 없죠. 물론 만들려는 게임의 규모가 작다면 이런 해결책이 전부 필요 없을 수 있습니다. 하지만 예제로 구현한 것도 굉장히 간단한 게임에 속합니다. 통상적으로 3D 캐릭터가 2D 캐릭터보다 더 복잡하니 처리해줘야 할 것이 많을 수밖에 없죠.

팩맨(PacMan)을 2D로 구현한다면 팩맨이 코너를 돌 때 바로 90도 꺾기만 하면 됩니다. 프레임 사이에 따로 처리해줘야 할 것이 없죠. 하지만 3D의 세계에서는 바로 방향을 틀기보다 몇 프레임에 걸쳐 서서히 방향을 트는 게 일반적입니다. 아주 간단한 차이점이지만, 이것 때문에 작업이 훨씬 복잡해집니다.

이 글에서 다룰 내용은 Three.js에 관한 것이라고 보기 어렵습니다. 왜냐하면 **Three.js는 게임 엔진이 아니기 때문**이죠. Three.js는 3D 라이브러리입니다. 3D 요소를 계열화하는 [씬 그래프](threejs-scenegraph.html)와 3D 요소를 렌더링하도록 도와주는 기능 등을 제공하죠. 하지만 게임과 관련한 기능은 지원하지 않습니다. 충돌(collision), 물리(physics), 입력 시스템, 패스 파인딩(path finding) 등등.. 이런 기능은 직접 만들어야 합니다.

결국 이 글의 *미완성* 게임을 만드는 데 꽤 많은 코드를 썼습니다. 아까 말했듯 제가 코드를 너무 지나치게 짰을 수도 있고, 더 간단한 해결책이 있을 수도 있으나, 저는 글을 마무리한 지금도 충분히 많은 코드를 썼는지, 설명을 빠뜨린 것이 없는지 걱정됩니다.

이 글에서 쓴 방법은 대부분 [유니티(Unity) 엔진](https://unity.com)의 영향을 크게 받았습니다. 하지만 유니티를 잘 모른다고 해서 이 글을 읽는 게 어렵진 않을 겁니다. 1000개의 기능이 있다면 그 중 10개 정도 밖에 쓰지 않았거든요.

먼저 Three.js 부분부터 시작해봅시다. 게임에 쓸 모델들부터 찾아보죠.

[opengameart.org](https://opengameart.org) 사이트에서 [quaternius](https://opengameart.org/users/quaternius) 작가의 [움직이는 기사 모델](https://opengameart.org/content/lowpoly-animated-knight)을 찾았습니다.

<div class="threejs_center"><img src="resources/images/knight.jpg" style="width: 375px;"></div>

[같은 작가](https://opengameart.org/users/quaternius)가 만든 작품 중에 [움직이는 동물들](https://opengameart.org/content/lowpoly-animated-farm-animal-pack)도 있더군요.

<div class="threejs_center"><img src="resources/images/animals.jpg" style="width: 606px;"></div>

이 모델들로 꽤 괜찮은 게임을 만들 수 있을 것 같습니다. 모델들을 불러와보죠.

[glTF 파일 불러오기](threejs-load-gltf.html)에 대해서는 이전에 다뤘었습니다. 동일한 방법을 사용하지만 이번에는 모델이 여러 개이기도 하고, 모델을 전부 불러오기 전에 게임을 시작해선 안 됩니다.

이런 경우를 대비해 Three.js는 `LoadingManager`를 제공합니다. `LoadingManager`의 인스턴스를 생성해 다른 로더(loader)에 넘겨주기면 되죠. `LoadingManager`의 [`onProgress`](LoadingManager.onProgress)와 [`onLoad`](LoadingManager.onLoad) 속성에 콜백 함수를 지정하면 되는데, [`onLoad`](LoadingManager.onLoad)는 모든 파일을 불러온 뒤 호출하고, [`onProgress`](LoadingManager.onProgress)는 각 파일을 불러왔을 때 호출합니다. [`onProgress`](LoadingManager.onProgress)를 이용하면 프로그래스 바를 보여줄 수 있죠.

[glTF 파일 불러오기](threejs-load-gltf.html) 예제를 가져와 카메라 절두체(frustum)를 조정하는 코드를 지우고 아래 코드를 추가합니다.

```js
const manager = new THREE.LoadingManager();
manager.onLoad = init;
const models = {
  pig:    { url: 'resources/models/animals/Pig.gltf' },
  cow:    { url: 'resources/models/animals/Cow.gltf' },
  llama:  { url: 'resources/models/animals/Llama.gltf' },
  pug:    { url: 'resources/models/animals/Pug.gltf' },
  sheep:  { url: 'resources/models/animals/Sheep.gltf' },
  zebra:  { url: 'resources/models/animals/Zebra.gltf' },
  horse:  { url: 'resources/models/animals/Horse.gltf' },
  knight: { url: 'resources/models/knight/KnightCharacter.gltf' },
};
{
  const gltfLoader = new GLTFLoader(manager);
  for (const model of Object.values(models)) {
    gltfLoader.load(model.url, (gltf) => {
      model.gltf = gltf;
    });
  }
}

function init() {
  // 나중에 작성할 예정
}
```

위 코드는 `models` 객체에 있는 파일을 불러오고, `LoadingManager`가 파일을 전부 불러왔을 때 `init` 함수를 호출합니다. `models` 객체를 전역으로 선언한 건 나중에 `GLTFLoader`의 콜백을 이용해 각 모델의 정보를 사용할 때 불러온 각 모델에 접근할 수 있도록 하기 위함입니다.

모든 모델과 모델의 애니메이션 데이터는 현재 약 6.6MB입니다. 꽤 용량이 크네요. 여러분의 서버가 압축을 지원(이 사이트의 웹 서버가 이 기능을 지원합니다)한다면 용량은 약 1.4MB까지 줄어들 겁니다. 6.6MB와 비교하면 확실히 적은 데이터지만 절대 작은 데이터는 아닙니다. 프로그래스 바를 만들어 사용자에게 얼마나 기다려야 하는지를 표시해준다면 좋겠네요.

[`onProgress`](LoadingManager.onProgress)에 콜백 함수를 지정해줍시다. 이 콜백 함수는 호출할 때 3개의 매개변수를 받습니다. 각각 마지막에 불러온 파일의 `url`, 그리고 불러온 파일의 개수, 전체 파일의 개수입니다.

프로그래스 바는 HTML로 간단히 구현하도록 하죠.

```html
<body>
  <canvas id="c"></canvas>
+  <div id="loading">
+    <div>
+      <div>...loading...</div>
+      <div class="progress"><div id="progressbar"></div></div>
+    </div>
+  </div>
</body>
```

`#progressbar`를 참조한 뒤 `width`를 퍼센트(%) 단위로 표시해 현재 진행율을 보여줄 겁니다. 콜백에서 이 스타일만 처리해주면 되겠네요.

```js
const manager = new THREE.LoadingManager();
manager.onLoad = init;

+const progressbarElem = document.querySelector('#progressbar');
+manager.onProgress = (url, itemsLoaded, itemsTotal) => {
+  progressbarElem.style.width = `${ itemsLoaded / itemsTotal * 100 | 0 }%`;
+};
```

이미 모든 모델을 불러왔을 때 `init` 함수를 호출하게 해놓았으니, 여기서 `#loading` 요소를 숨겨 프로그래스 바를 없앱니다.

```js
function init() {
+  // 프로그래스 바를 숨깁니다.
+  const loadingElem = document.querySelector('#loading');
+  loadingElem.style.display = 'none';
}
```

아래는 프로그래스 바를 꾸미기 위한 CSS입니다. `#loading`은 페이지 전체를 꽉 채우고 자식 요소를 가운데 정렬시킵니다. 그리고 `.progress`는 프로그래스 바가 들어갈 영역을 정의하죠. 프로그래스 바에 간단한 애니메이션도 넣어줬습니다.

```css
#loading {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: xx-large;
  font-family: sans-serif;
}
#loading>div>div {
  padding: 2px;
}
.progress {
  width: 50vw;
  border: 1px solid black;
}
#progressbar {
  width: 0;
  transition: width ease-out .5s;
  height: 1em;
  background-color: #888;
  background-image: linear-gradient(
    -45deg, 
    rgba(255, 255, 255, .5) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255, 255, 255, .5) 50%, 
    rgba(255, 255, 255, .5) 75%, 
    transparent 75%, 
    transparent
  );
  background-size: 50px 50px;
  animation: progressanim 2s linear infinite;
}

@keyframes progressanim {
  0% {
    background-position: 50px 50px;
  }
  100% {
    background-position: 0 0;
  }
}
```

이제 프로그래스 바가 생겼으니 모델을 처리할 차례입니다. 이 모델들에는 애니메이션이 있는데, 이 애니메이션을 제어할 수 없다면 애니메이션이 있는 의미가 없겠죠. Three.js는 기본적으로 애니메이션들을 배열 형태로 저장합니다. 하지만 배열이 아닌 이름 형태로 저장하는 게 나중에 쓰기에 편하니 각 모델에 `animation` 속성을 만들겠습니다. 물론 각 애니메이션의 이름은 고유한 값이어야 하겠죠.

```js
+function prepModelsAndAnimations() {
+  Object.values(models).forEach(model => {
+    const animsByName = {};
+    model.gltf.animations.forEach((clip) => {
+      animsByName[clip.name] = clip;
+    });
+    model.animations = animsByName;
+  });
+}

function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

+  prepModelsAndAnimations();
}
```

이제 애니메이션이 들어간 모델을 화면에 띄워봅시다.

[이전 glTF 파일 예제](threejs-load-gltf.html)와 달리 이번에는 각 모델을 하나 이상 배치할 계획입니다. 그러니 파일을 불러온 뒤 바로 장면에 넣는 대신 각 glTF의 씬 그래프(scene), 이 경우에는 움직이는 캐릭터를 복사해야 합니다. 다행히 Three.js에는 `SkeletonUtil.clone`이라는 함수가 있어 이를 쉽게 구현할 수 있죠. 먼저 해당 모듈을 불러오겠습니다.

```js
import * as THREE from './resources/three/r119/build/three.module.js';
import { OrbitControls } from './resources/threejs/r119/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';
+import { SkeletonUtils } from './resources/threejs/r119/examples/jsm/utils/SkeletonUtils.js';
```

그리고 아까 불러왔던 모델을 복사합니다.

```js
function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

  prepModelsAndAnimations();

+  Object.values(models).forEach((model, ndx) => {
+    const clonedScene = SkeletonUtils.clone(model.gltf.scene);
+    const root = new THREE.Object3D();
+    root.add(clonedScene);
+    scene.add(root);
+    root.position.x = (ndx - 3) * 3;
+  });
}
```

위 코드에서는 불러온 각 모델의 `gltf.scene`을 복사해 새로운 `Object3D`의 자식으로 추가했습니다. 부모를 따로 만든 건 모델의 애니메이션이 모델의 각 요소의 위치값에 영향을 미치기에 코드로 직접 위치값을 수정하기도 어렵고, 제대로 반영도 안 될 것이기 때문입니다.

각 모델의 애니메이션을 재생하려면 `AnimationMixer`를 써야 합니다. `AnimationMixer`는 하나 이상의 `AnimationAction`으로 이루어지고, 각 `AnimationAction`에는 하나의 `AnimationClip`이 있습니다. `AnimationAction`에는 여러 액션(action)을 이어서 재생하거나, 다른 애니메이션으로 부드럽게 전환하기 등 다양한 설정이 있죠. 당장은 첫 번째 `AnimationClip`으로 액션을 만들어봅시다. 설정을 바꾸지 않는다면 해당 애니메이션 클립(clip)을 반복해 재생할 겁니다.

```js
+const mixers = [];

function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

  prepModelsAndAnimations();

  Object.values(models).forEach((model, ndx) => {
    const clonedScene = SkeletonUtils.clone(model.gltf.scene);
    const root = new THREE.Object3D();
    root.add(clonedScene);
    scene.add(root);
    root.position.x = (ndx - 3) * 3;

+    const mixer = new THREE.AnimationMixer(clonedScene);
+    const firstClip = Object.values(model.animations)[0];
+    const action = mixer.clipAction(firstClip);
+    action.play();
+    mixers.push(mixer);
  });
}
```

애니메이션을 시작하기 위해 [`play`](AnimationAction.play) 메서드를 호출했습니다. 그리고 생성한 `AnimationMixer`들을 전부 `mixers` 배열에 넣었죠. 마지막으로 렌더링 루프에서 각 `AnimationMixer`의 `AnimationMixer.update` 메서드에 바로 직전 프레임과 현재 프레임의 시간값을 넘겨주어야 합니다.

```js
+let then = 0;
function render(now) {
+  now *= 0.001;  // 초 단위로 변환
+  const deltaTime = now - then;
+  then = now;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

+  for (const mixer of mixers) {
+    mixer.update(deltaTime);
+  }

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
```

이제 각 모델과 모델의 첫 번째 애니메이션이 보일 겁니다.

{{{example url="../threejs-game-load-models.html"}}}

모든 애니메이션을 확인할 수 있도록 예제를 수정해봅시다. 애니메이션 클립을 전부 액션으로 만들어 재생할 수 있도록 만들겠습니다.

```js
-const mixers = [];
+const mixerInfos = [];

function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

  prepModelsAndAnimations();

  Object.values(models).forEach((model, ndx) => {
    const clonedScene = SkeletonUtils.clone(model.gltf.scene);
    const root = new THREE.Object3D();
    root.add(clonedScene);
    scene.add(root);
    root.position.x = (ndx - 3) * 3;

    const mixer = new THREE.AnimationMixer(clonedScene);
-    const firstClip = Object.values(model.animations)[0];
-    const action = mixer.clipAction(firstClip);
-    action.play();
-    mixers.push(mixer);
+    const actions = Object.values(model.animations).map((clip) => {
+      return mixer.clipAction(clip);
+    });
+    const mixerInfo = {
+      mixer,
+      actions,
+      actionNdx: -1,
+    };
+    mixerInfos.push(mixerInfo);
+    playNextAction(mixerInfo);
  });
}

+function playNextAction(mixerInfo) {
+  const { actions, actionNdx } = mixerInfo;
+  const nextActionNdx = (actionNdx + 1) % actions.length;
+  mixerInfo.actionNdx = nextActionNdx;
+  actions.forEach((action, ndx) => {
+    const enabled = ndx === nextActionNdx;
+    action.enabled = enabled;
+    if (enabled) {
+      action.play();
+    }
+  });
+}
```

위 코드에서는 각 모델마다 액션 배열과 `AnimationMixer`를 객체로 만들어 저장했습니다. 액션 배열은 모델의 각 `AnimationClip`마다 `AnimationAction`을 하나씩 생성해 배열로 만든 것이죠. 그리고 하나의 액션을 제외한 나머지 액션의 `enabled` 속성을 끄는 `playNextAction`을 호출했습니다.

데이터 형식이 바뀌었으니 렌더링 루프의 업데이트 쪽 코드도 수정해야 합니다.

```js
-for (const mixer of mixers) {
+for (const { mixer } of mixerInfos) {
  mixer.update(deltaTime);
}
```

숫자키 1-8번을 눌러 각 모델의 애니메이션을 선택할 수 있도록 리스너를 지정합니다.

```js
window.addEventListener('keydown', (e) => {
  const mixerInfo = mixerInfos[e.keyCode - 49];
  if (!mixerInfo) {
    return;
  }
  playNextAction(mixerInfo);
});
```

이제 예제를 클릭한 뒤 숫자키 1-8번을 누르면 각 번호에 해당하는 모델의 애니메이션이 바뀔 겁니다.

{{{example url="../threejs-game-check-animations.html"}}}

Three.js 관련 내용은 여기까지입니다. 여태까지 다수의 파일을 불러오는 법, 텍스처가 씌워진 모델을 복사하는 법, 해당 모델의 애니메이션을 재생하는 법을 알아봤죠. 실제 게임에서는 `AnimationAction` 객체로 다양한 동작을 직접 처리해줘야 합니다.

자, 이제 게임의 기본 틀을 만들어봅시다.

최신 게임을 만들 때는 보통 [Entity Component System(ECS)](https://www.google.com/search?q=entity+component+system)을 많이 사용합니다. Entity Component System에서는 게임의 요소를 여러 개의 *컴포넌트(component)*로 이루어진 *엔티티(entity)*라 부르죠. 새로운 엔티티를 생성할 때는 모든 코드를 새로 쓰는 것이 아닌, 미리 만들어 놓은 컴포넌트들을 엮어 생성합니다.

예제에서는 엔티티를 `GameObject`라 부르겠습니다. 이는 단순히 컴포넌트 배열과 `THREE.Object3D`를 합친 것입니다.

```js
function removeArrayElement(array, element) {
  const ndx = array.indexOf(element);
  if (ndx >= 0) {
    array.splice(ndx, 1);
  }
}

class GameObject {
  constructor(parent, name) {
    this.name = name;
    this.components = [];
    this.transform = new THREE.Object3D();
    parent.add(this.transform);
  }
  addComponent(ComponentType, ...args) {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }
  removeComponent(component) {
    removeArrayElement(this.components, component);
  }
  getComponent(ComponentType) {
    return this.components.find(c => c instanceof ComponentType);
  }
  update() {
    for (const component of this.components) {
      component.update();
    }
  }
}
```

`GameObject.update` 메서드를 호출하면 각 컴포넌트의 `update` 메서드를 호출합니다.

name 속성은 단순히 디버깅을 위한 것입니다. 콘솔에서 `GameObject`를 봤을 때 어떤 요소인지 쉽게 확인할 수 있겠죠.

생소해 보일 수 있는 것들 몇 가지만 집고 넘어가겠습니다.

`GameObject.addComponent`는 컴포넌트를 생성할 때 사용합니다. GameObject 안에서 컴포넌트를 생성하는 게 최선인지는 모르겠으나, 개인적으로 컴포넌트가 GameObject 밖에 존재하는 건 의미가 없어 보였습니다. 그래서 생성한 컴포넌트를 자동으로 GameObject의 배열에 추가하고, GameObject 자체도 컴포넌트의 constructor에 넘겨줄 수 있으면 편하겠다고 생각했죠. 쉽게 말해 지금은 다음처럼 컴포넌트를 추가하지만,

```js
const gameObject = new GameObject(scene, 'foo');
gameObject.addComponent(TypeOfComponent);
```

위와 같은 방식을 선호하지 않는다면 다음처럼 추가할 수도 있습니다.

```js
const gameObject = new GameObject(scene, 'foo');
const component = new TypeOfComponent(gameObject);
gameObject.addComponent(component);
```

첫 번째 코드가 짧고 자동화됐다는 면에서 더 좋을까요, 아니면 기존 형식을 해쳐서 더 별로일까요? 저는 어떻다고 판단하기가 어렵네요.

`GameObject.getComponent`는 컴포넌트의 타입을 이용해 컴포넌트를 찾습니다. 이는 하나의 GameObject가 같은 타입의 컴포넌트를 두 개 이상 사용할 수 없다는 이야기죠. 물론 두 개 이상 사용한다고 에러가 나거나 하진 않겠지만, 별도의 API를 추가하지 않는 한 저 메서드는 항상 같은 타입 중 첫 번째 컴포넌트만을 반환할 겁니다.

컴포넌트가 다른 컴포넌트를 찾는 건 흔한 일입니다. 그리고 컴포넌트를 찾을 때는 잘못 참조하는 일이 없도록 타입을 체크해야 하죠. 그냥 각 컴포넌트에 고유한 이름 속성을 주고 그 이름으로 해당 컴포넌트를 찾을 수도 있습니다. 이렇게 하면 같은 타입의 컴포넌트를 여러 개 쓸 수 있으니 확장성 면에서 유리할 겁니다. 하지만 이 방법은 그다지 일관성이 없습니다. 이번에도 어떤 쪽이 더 좋다고 판단하기가 어렵네요.

아래는 컴포넌트의 기초 클래스입니다.

```js
// 모든 컴포넌트의 기초
class Component {
  constructor(gameObject) {
    this.gameObject = gameObject;
  }
  update() {
  }
}
```

컴포넌트에 기초 클래스가 필요할까요? 자바스크립트는 타입이 느슨한 언어이기에 굳이 기초 클래스를 쓸 필요는 없습니다. 각 컴포넌트의 constructor에서 첫 번째 인자가 GameObject이기만 하면 되죠. 만약 GameObject를 나중에 참조할 필요가 없다면 굳이 저장하지 않아도 될 겁니다. 하지만 저는 왠지 이 형식이 더 좋아 보이네요. 기초 클래스를 두면 부모의 GameObject에 쉽게 접근할 수 있을 뿐만 아니라 다른 컴포넌트를 쉽게 찾을 수 있고, 어떤 차이점이 있는지도 쉽게 알 수 있을 테니까요.

GameObject를 다루려면 GameObject를 관리하는 클래스를 만드는 게 좋을 듯합니다. 얼핏 GameObject를 배열 형식으로 갖고 있어도 괜찮지 않나 싶을 수 있으나, 실제로 게임을 플레이할 때는 요소가 추가되기도 하고, 없어지기도 합니다. 예를 들어 총 GameObject는 총을 발사할 때마다 총알 GameObject를 추가할 겁니다. 몬스터 GameObject가 누군가에 의해 죽는다면 해당 GameObject는 사라지겠죠. GameObject를 배열로 저장한다면 십중팔구 다음과 같은 식의 코드를 쓸 겁니다.

```js
for (const gameObject of globalArrayOfGameObjects) {
  gameObject.update();
}
```

위 반복문은 `globalArrayOfGameObjects`에 GameObject가 추가되거나 제거됐을 경우, 특정 컴포넌트의 `update` 메서드에서 에러를 던지거나 예상 밖의 동작을 할 수 있습니다.

이런 일을 방지하기 위해 안전 장치를 추가해보도록 하죠.

```js
class SafeArray {
  constructor() {
    this.array = [];
    this.addQueue = [];
    this.removeQueue = new Set();
  }
  get isEmpty() {
    return this.addQueue.length + this.array.length > 0;
  }
  add(element) {
    this.addQueue.push(element);
  }
  remove(element) {
    this.removeQueue.add(element);
  }
  forEach(fn) {
    this._addQueued();
    this._removeQueued();
    for (const element of this.array) {
      if (this.removeQueue.has(element)) {
        continue;
      }
      fn(element);
    }
    this._removeQueued();
  }
  _addQueued() {
    if (this.addQueue.length) {
      this.array.splice(this.array.length, 0, ...this.addQueue);
      this.addQueue = [];
    }
  }
  _removeQueued() {
    if (this.removeQueue.size) {
      this.array = this.array.filter(element => !this.removeQueue.has(element));
      this.removeQueue.clear();
    }
  }
}
```

위 클래스는 `SafeArray`의 요소를 더하거나 제거할 수 있도록 해줍니다. 원본 배열의 반복되는 동안 원본 배열을 변경하지 않는다는 게 차이점이죠. 대신 반복 중간에 추가된 요소는 `addQueue`에, 제거된 요소는 `removeQueue`에 들어간 뒤, 반복문이 돌아가지 않을 때 원본 배열에 제거/추가됩니다.

아래는 위 클래스를 이용한 GameObject의 관리 클래스입니다.

```js
class GameObjectManager {
  constructor() {
    this.gameObjects = new SafeArray();
  }
  createGameObject(parent, name) {
    const gameObject = new GameObject(parent, name);
    this.gameObjects.add(gameObject);
    return gameObject;
  }
  removeGameObject(gameObject) {
    this.gameObjects.remove(gameObject);
  }
  update() {
    this.gameObjects.forEach(gameObject => gameObject.update());
  }
}
```

여태까지 만든 요소로 첫 컴포넌트를 만들어봅시다. 이 컴포넌트는 아까 만들었던 것과 같은 Three.js glTF 객체를 관리할 겁니다. 간단히 애니메이션의 이름을 받아 해당 애니메이션을 재생하는 `setAnimation` 메서드만 새로 만들도록 하겠습니다.

```js
class SkinInstance extends Component {
  constructor(gameObject, model) {
    super(gameObject);
    this.model = model;
    this.animRoot = SkeletonUtils.clone(this.model.gltf.scene);
    this.mixer = new THREE.AnimationMixer(this.animRoot);
    gameObject.transform.add(this.animRoot);
    this.actions = {};
  }
  setAnimation(animName) {
    const clip = this.model.animations[animName];
    // 모든 액션을 끕니다.
    for (const action of Object.values(this.actions)) {
      action.enabled = false;
    }
    // 해당 클립에 해당하는 액션을 생성 또는 가져옵니다.
    const action = this.mixer.clipAction(clip);
    action.enabled = true;
    action.reset();
    action.play();
    this.actions[animName] = action;
  }
  update() {
    this.mixer.update(globals.deltaTime);
  }
}
```

이 클래스는 아까 했던 것처럼 불러온 씬 그래프를 복사하고, `AnimationMixer`를 만듭니다. 클래스의 `setAnimation` 메서드는 해당 클립에 대한 액션이 존재하지 않는다면 새로 생성하고, 다른 액션을 전부 끄는 역할을 합니다.

이 코드는 `globals.deltaTime`을 사용합니다. 이 전역 객체도 만들어야겠죠.

```js
const globals = {
  time: 0,
  deltaTime: 0,
};
```

그리고 렌더링 루프에서 전역 객체를 업데이트하도록 합니다.

```js
let then = 0;
function render(now) {
  // 초 단위로 변환
  globals.time = now * 0.001;
  // 시간값이 너무 크지 않도록 제한합니다.
  globals.deltaTime = Math.min(globals.time - then, 1 / 20);
  then = globals.time;
```

위 코드에서는 시간값의 범위가 1/20초를 넘지 않도록 했습니다. 이는 사용자가 탭을 숨기거나 했을 경우 시간값이 너무 커지지 않게 하기 위한 것이죠. 만약 이렇게 제한을 두지 않는다면 사용자가 탭을 몇 초, 또는 몇 분 숨겼다가 다시 탭을 열었을 때 프레임 간 시간값이 너무 커질 테고, 아래와 같이 시간으로 속력을 계산하는 경우 캐릭터가 순간이동하는 것처럼 보일 수 있습니다.

```js
position += velocity * deltaTime;
```

`deltaTime`의 최댓값을 설정하면 이런 문제를 막을 수 있죠.

이제 플레이어 컴포넌트를 만들어봅시다.

```js
class Player extends Component {
  constructor(gameObject) {
    super(gameObject);
    const model = models.knight;
    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.skinInstance.setAnimation('Run');
  }
}
```

플레이어 컴포넌트는 초기화 시에 `'Run'`을 인자로 `setAnimation`을 호출합니다. 개인적으로 미리 어떤 애니메이션이 있는지 보려고 이전 예제를 수정해 애니메이션의 이름을 출력하도록 했죠.

```js
function prepModelsAndAnimations() {
  Object.values(models).forEach(model => {
+    console.log('------->:', model.url);
    const animsByName = {};
    model.gltf.animations.forEach((clip) => {
      animsByName[clip.name] = clip;
+      console.log('  ', clip.name);
    });
    model.animations = animsByName;
  });
}
```

아래는 실제로 [자바스크립트 개발자 콘솔](https://developers.google.com/web/tools/chrome-devtools/console/javascript)에 출력된 결과입니다.

```
 ------->:  resources/models/animals/Pig.gltf
    Idle
    Death
    WalkSlow
    Jump
    Walk
 ------->:  resources/models/animals/Cow.gltf
    Walk
    Jump
    WalkSlow
    Death
    Idle
 ------->:  resources/models/animals/Llama.gltf
    Jump
    Idle
    Walk
    Death
    WalkSlow
 ------->:  resources/models/animals/Pug.gltf
    Jump
    Walk
    Idle
    WalkSlow
    Death
 ------->:  resources/models/animals/Sheep.gltf
    WalkSlow
    Death
    Jump
    Walk
    Idle
 ------->:  resources/models/animals/Zebra.gltf
    Jump
    Walk
    Death
    WalkSlow
    Idle
 ------->:  resources/models/animals/Horse.gltf
    Jump
    WalkSlow
    Death
    Walk
    Idle
 ------->:  resources/models/knight/KnightCharacter.gltf
    Run_swordRight
    Run
    Idle_swordLeft
    Roll_sword
    Idle
    Run_swordAttack
```

운 좋게도 동물들의 애니메이션 이름이 전부 똑같네요. 나중에 편할 듯합니다. 뭐, 그건 나중 얘기고, 지금은 플레이어의 애니메이션 중 `Run`만 신경씁시다.

이제 만든 컴포넌트를 써 보겠습니다. 먼저 `init` 함수를 약간 수정합니다. `init` 함수는 `GameObject`를 만들고 거기에 `Player` 컴포넌트를 추가하는 역할을 할 겁니다.

```js
const globals = {
  time: 0,
  deltaTime: 0,
};
+const gameObjectManager = new GameObjectManager();

function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

  prepModelsAndAnimations();

+  {
+    const gameObject = gameObjectManager.createGameObject(scene, 'player');
+    gameObject.addComponent(Player);
+  }
}
```

렌더링 루프에서 `gameObjectManager.update`를 호출하도록 합니다.

```js
let then = 0;
function render(now) {
  // 초 단위로 변환
  globals.time = now * 0.001;
  // 시간값이 너무 크지 않도록 제한합니다.
  globals.deltaTime = Math.min(globals.time - then, 1 / 20);
  then = globals.time;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

-  for (const { mixer } of mixerInfos) {
-    mixer.update(deltaTime);
-  }
+  gameObjectManager.update();

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
```

예제를 실행하면 플레이어 하나만 보일 겁니다.

{{{example url="../threejs-game-just-player.html"}}}

단순히 Entity Component System을 구현하는 데만 너무 많은 코드를 쓴 게 아닌가 싶지만, 이 정도가 대부분의 게임이 갖춰야할 기본입니다.

이제 사용자 입력 시스템을 추가해봅시다. 단순히 키보드 이벤트에 직접 코드를 작성하기보다 클래스를 만들어 코드의 다른 부분에서도 `왼쪽`, `오른쪽`을 확인할 수 있도록 하겠습니다. 이러면 `왼쪽`, `오른쪽` 등 다양한 키를 다양한 방법으로 지정할 수 있겠죠. 먼저 키보드 이벤트부터 지정합시다.

```js
/**
 * 키 또는 버튼의 상태를 추적합니다.
 * 
 * 왼쪽 방향키가 눌렸는지 확인하려면
 * 
 *     inputManager.keys.left.down
 *
 * 을 확인하고, 현재 프레임에서 왼쪽 키를 눌렀는지 확인하려면
 * 
 *     inputManager.keys.left.justPressed
 *
 * 를 확인하면 됩니다.
 *
 * 현재 등록된 키는 'left', 'right', 'a', 'b', 'up', 'down' 입니다.
 **/
class InputManager {
  constructor() {
    this.keys = {};
    const keyMap = new Map();

    const setKey = (keyName, pressed) => {
      const keyState = this.keys[keyName];
      keyState.justPressed = pressed && !keyState.down;
      keyState.down = pressed;
    };

    const addKey = (keyCode, name) => {
      this.keys[name] = { down: false, justPressed: false };
      keyMap.set(keyCode, name);
    };

    const setKeyFromKeyCode = (keyCode, pressed) => {
      const keyName = keyMap.get(keyCode);
      if (!keyName) {
        return;
      }
      setKey(keyName, pressed);
    };

    addKey(37, 'left');
    addKey(39, 'right');
    addKey(38, 'up');
    addKey(40, 'down');
    addKey(90, 'a');
    addKey(88, 'b');

    window.addEventListener('keydown', (e) => {
      setKeyFromKeyCode(e.keyCode, true);
    });
    window.addEventListener('keyup', (e) => {
      setKeyFromKeyCode(e.keyCode, false);
    });
  }
  update() {
    for (const keyState of Object.values(this.keys)) {
      if (keyState.justPressed) {
        keyState.justPressed = false;
      }
    }
  }
}
```

위 코드는 키가 눌렸는지, 뗐는지를 추적합니다. 특정 키를 눌렀는지 확인하려면 예를 들어 `inputManager.keys.left.down`을 체크하면 되고, 해당 객체에 `justPressed`를 체크하면 사용자가 해당 프레임에서 키를 눌렀는지 확인할 수 있습니다. 예를 들어 점프를 구현할 경우 유저가 키를 누르고 있는지를 추적할 이유는 없겠죠. 단순히 해당 프레임에서 키를 눌렀는지만 확인하면 될 겁니다.

이제 `InputManager`의 인스턴스를 생성합니다.

```js
const globals = {
  time: 0,
  deltaTime: 0,
};
const gameObjectManager = new GameObjectManager();
+const inputManager = new InputManager();
```

그리고 렌더링 루프에서 `update` 메서드를 호출하도록 합니다.

```js
function render(now) {

  ...

  gameObjectManager.update();
+  inputManager.update();

  ...
}
```

`gameObjectManager.update` 전에 이 메서드를 호출하면 `justPressed`가 항상 `false`일 테니 `gameObjectManager.update` 뒤에 메서드를 호출하도록 했습니다.

이제 `Player` 컴포넌트에 사용자 입력을 추가해봅시다.

```js
+const kForward = new THREE.Vector3(0, 0, 1);
const globals = {
  time: 0,
  deltaTime: 0,
+  moveSpeed: 16,
};

class Player extends Component {
  constructor(gameObject) {
    super(gameObject);
    const model = models.knight;
    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.skinInstance.setAnimation('Run');
+    this.turnSpeed = globals.moveSpeed / 4;
  }
+  update() {
+    const { deltaTime, moveSpeed } = globals;
+    const { transform } = this.gameObject;
+    const delta = (inputManager.keys.left.down  ?  1 : 0) +
+                  (inputManager.keys.right.down ? -1 : 0);
+    transform.rotation.y += this.turnSpeed * delta * deltaTime;
+    transform.translateOnAxis(kForward, moveSpeed * deltaTime);
+  }
}
```

위 코드에서는 플레이어를 앞으로 움직이기 위해 `Object3D.transformOnAxis`를 사용했습니다. `Object3D.transformOnAxis`는 지역 공간을 기준으로 하기에 해당 객체가 장면의 루트(root) 요소에 속할 때만 정상적으로 작동합니다. <a class="footnote" href="#parented" id="parented-backref">1</a>

또한 전역 객체에 `moveSpeed`를 추가했고 이를 `turnSpeed`의 기준으로 삼았습니다. 이는 캐릭터가 목표를 향해 상대적으로 빠르게 돌도록 만든 것으로, 이 `turnSpeed`의 값이 너무 작다면 캐릭터는 목표 주위를 빙빙 돌기만 하고 절대 목표에 닿지는 못할 겁니다. 물론 위 값은 어떤 수학적 공식을 사용한 것이 아닙니다. 그냥 대충 때려 넣은 것이죠.

이대로도 예제는 잘 작동할 테지만 플레이어가 화면을 벗어나면 캐릭터가 어디 있는지 찾기가 어려울 겁니다. 일단 화면에서 벗어난 뒤 일정 시간이 지나면 플레이어를 다시 중점으로 순간이동시키기로 합시다. Three.js의 `Frustum` 클래스를 이용하면 특정 점이 카메라의 절두체(frustum) 안에 있는지 알 수 있습니다.

먼저 카메라로 절두체를 만들어야 합니다. 플레이어 컴포넌트에서 이걸 처리할 수도 있지만, 다른 요소도 이 방법을 써야 할 수 있으니 카메라의 절두체를 관리하는 새로운 컴포넌트를 만들겠습니다.

```js
class CameraInfo extends Component {
  constructor(gameObject) {
    super(gameObject);
    this.projScreenMatrix = new THREE.Matrix4();
    this.frustum = new THREE.Frustum();
  }
  update() {
    const { camera } = globals;
    this.projScreenMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }
}
```

다음으로 `init` 함수에서 방금 만든 컴포넌트로 새로운 GameObject를 추가합니다.

```js
function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

  prepModelsAndAnimations();

+  {
+    const gameObject = gameObjectManager.createGameObject(camera, 'camera');
+    globals.cameraInfo = gameObject.addComponent(CameraInfo);
+  }

  {
    const gameObject = gameObjectManager.createGameObject(scene, 'player');
    gameObject.addComponent(Player);
  }
}
```

`Player` 컴포넌트에 방금 만든 GameObject를 사용하는 코드를 추가합니다.

```js
class Player extends Component {
  constructor(gameObject) {
    super(gameObject);
    const model = models.knight;
    this.skinInstance = gameObject.addComponent(SkinInstance, model);
    this.skinInstance.setAnimation('Run');
    this.turnSpeed = globals.moveSpeed / 4;
+    this.offscreenTimer = 0;
+    this.maxTimeOffScreen = 3;
  }
  update() {
-    const { deltaTime, moveSpeed } = globals;
+    const { deltaTime, moveSpeed, cameraInfo } = globals;
    const { transform } = this.gameObject;
    const delta = (inputManager.keys.left.down  ?  1 : 0) +
                  (inputManager.keys.right.down ? -1 : 0);
    transform.rotation.y += this.turnSpeed * delta * deltaTime;
    transform.translateOnAxis(kForward, moveSpeed * deltaTime);

+    const { frustum } = cameraInfo;
+    if (frustum.containsPoint(transform.position)) {
+      this.offscreenTimer = 0;
+    } else {
+      this.offscreenTimer += deltaTime;
+      if (this.offscreenTimer >= this.maxTimeOffScreen) {
+        transform.position.set(0, 0, 0);
+      }
+    }
  }
}
```

예제를 실행하기 전에 모바일 환경을 위한 터치 인터페이스를 추가하겠습니다. 먼저 터치 이벤트를 받을 HTML 요소를 만듭니다.

```html
<body>
  <canvas id="c"></canvas>
+  <div id="ui">
+    <div id="left"><img src="resources/images/left.svg"></div>
+    <div style="flex: 0 0 40px;"></div>
+    <div id="right"><img src="resources/images/right.svg"></div>
+  </div>
  <div id="loading">
    <div>
      <div>...loading...</div>
      <div class="progress"><div id="progressbar"></div></div>
    </div>
  </div>
</body>
```

버튼의 스타일도 작성합니다.

```css
#ui {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-items: center;
  align-content: stretch;
}
#ui>div {
  display: flex;
  align-items: flex-end;
  flex: 1 1 auto;
}
.bright {
  filter: brightness(2);
}
#left {
  justify-content: flex-end;
}
#right {
  justify-content: flex-start;
}
#ui img {
  padding: 10px;
  width: 80px;
  height: 80px;
  display: block;
}
```

제가 사용한 방법은 하나의 div 요소, `#ui`로 화면 전체를 채우고, 해당 요소의 자식으로 화면의 대략 반을 차지하는 `#left`와 `#right`를 각각 양쪽에, 가운데에는 40px짜리 구분선을 넣어 화면 전체가 이벤트를 감지하도록 한 것입니다. 이러면 사용자가 왼쪽 화살표를 누른 뒤 왼쪽에서 오른쪽으로 손가락을 움직였을 때 `InputManager`의 `keys.left`과 `keys.right`를 업데이트할 수 있겠죠. 굳이 작은 화살표를 누르느라 고생하지 않아도 되니 이 편이 훨씬 나을 겁니다.

```js
class InputManager {
  constructor() {
    this.keys = {};
    const keyMap = new Map();

    const setKey = (keyName, pressed) => {
      const keyState = this.keys[keyName];
      keyState.justPressed = pressed && !keyState.down;
      keyState.down = pressed;
    };

    const addKey = (keyCode, name) => {
      this.keys[name] = { down: false, justPressed: false };
      keyMap.set(keyCode, name);
    };

    const setKeyFromKeyCode = (keyCode, pressed) => {
      const keyName = keyMap.get(keyCode);
      if (!keyName) {
        return;
      }
      setKey(keyName, pressed);
    };

    addKey(37, 'left');
    addKey(39, 'right');
    addKey(38, 'up');
    addKey(40, 'down');
    addKey(90, 'a');
    addKey(88, 'b');

    window.addEventListener('keydown', (e) => {
      setKeyFromKeyCode(e.keyCode, true);
    });
    window.addEventListener('keyup', (e) => {
      setKeyFromKeyCode(e.keyCode, false);
    });

+    const sides = [
+      { elem: document.querySelector('#left'),  key: 'left'  },
+      { elem: document.querySelector('#right'), key: 'right' },
+    ];
+
+    const clearKeys = () => {
+      for (const {key} of sides) {
+          setKey(key, false);
+      }
+    };
+
+    const checkSides = (e) => {
+      for (const {elem, key} of sides) {
+        let pressed = false;
+        const rect = elem.getBoundingClientRect();
+        for (const touch of e.touches) {
+          const x = touch.clientX;
+          const y = touch.clientY;
+          const inRect = x >= rect.left && x < rect.right &&
+                         y >= rect.top && y < rect.bottom;
+          if (inRect) {
+            pressed = true;
+          }
+        }
+        setKey(key, pressed);
+      }
+    };
+
+    const uiElem = document.querySelector('#ui');
+    uiElem.addEventListener('touchstart', (e) => {
+      e.preventDefault();
+      checkSides(e);
+    }, { passive: false });
+    uiElem.addEventListener('touchmove', (e) => {
+      e.preventDefault();  // 화면 스크롤 방지
+      checkSides(e);
+    }, { passive: false });
+    uiElem.addEventListener('touchend', () => {
+      clearKeys();
+    });
+
+    function handleMouseMove(e) {
+      e.preventDefault();
+      checkSides({
+        touches: [e],
+      });
+    }
+
+    function handleMouseUp() {
+      clearKeys();
+      window.removeEventListener('mousemove', handleMouseMove, { passive: false });
+      window.removeEventListener('mouseup', handleMouseUp);
+    }
+
+    uiElem.addEventListener('mousedown', (e) => {
+      handleMouseMove(e);
+      window.addEventListener('mousemove', handleMouseMove);
+      window.addEventListener('mouseup', handleMouseUp);
+    }, { passive: false });
  }
  update() {
    for (const keyState of Object.values(this.keys)) {
      if (keyState.justPressed) {
        keyState.justPressed = false;
      }
    }
  }
}
```

이제 화살표 키나 화면을 터치해 캐릭터를 움직일 수 있을 겁니다.

{{{example url="../threejs-game-player-input.html"}}}

물론 플레이어가 화면 밖으로 나갔을 때 카메라를 움직이거나, "화면 밖 = 죽음"이라는 설정을 넣을 수도 있습니다. 하지만 이것까지 다룬다면 안 그래도 긴 글이 더 길어질 테니 이 방법으로 만족하겠습니다.

이제 동물을 추가해봅시다. `Player`와 비슷한 방법으로 `Animal` 컴포넌트를 만듭니다.

```js
class Animal extends Component {
  constructor(gameObject, model) {
    super(gameObject);
    const skinInstance = gameObject.addComponent(SkinInstance, model);
    skinInstance.mixer.timeScale = globals.moveSpeed / 4;
    skinInstance.setAnimation('Idle');
  }
}
```

위 코드에서는 `AnimationMixer.timeScale`을 설정해 애니메이션 속도가 이동 속도에 비례하도록 만들었습니다. 이러면 이동 속도와 같이 애니메이션 속도가 빨라지고 느려지겠죠.

다음으로 `init` 함수에서 각 동물을 배치합니다.

```js
function init() {
  // 프로그래스 바를 숨깁니다.
  const loadingElem = document.querySelector('#loading');
  loadingElem.style.display = 'none';

  prepModelsAndAnimations();
  {
    const gameObject = gameObjectManager.createGameObject(camera, 'camera');
    globals.cameraInfo = gameObject.addComponent(CameraInfo);
  }

  {
    const gameObject = gameObjectManager.createGameObject(scene, 'player');
    globals.player = gameObject.addComponent(Player);
    globals.congaLine = [gameObject];
  }

+  const animalModelNames = [
+    'pig',
+    'cow',
+    'llama',
+    'pug',
+    'sheep',
+    'zebra',
+    'horse',
+  ];
+  animalModelNames.forEach((name, ndx) => {
+    const gameObject = gameObjectManager.createGameObject(scene, name);
+    gameObject.addComponent(Animal, models[name]);
+    gameObject.transform.position.x = (ndx + 1) * 5;
+  });
}
```

동물들을 배치하고 끝내면 심심하니 뭔가를 추가해야겠네요.

동물이 플레이어를 따라 기차놀이＊를 하게 해봅시다. 플레이어가 동물에 가까이 갔을 때만 기차에 합류하도록 하겠습니다. 이를 구현하려면 아래와 같은 모션(상태, state)이 필요할 겁니다.

※ 원문은 "conga line"입니다. 기차놀이와 유사한 꼬리잇기 놀이로, 우리에게 더 익숙한 "기차놀이"로 의역했습니다. 역주.

* 가만히 서 있는 모션(Idle):

  플레이어가 가까워지기 전까지의 모션입니다.

* 기차의 끝에 갈 때까지 기다리는 모션(Wait for End of Line):

  플레이어가 동물과 닿더라도 기차의 끝에 합류해야 하므로 그 전까지 기다리는 모션입니다.

* 따라붙기(Go to Last):

  자신이 따라갈 대상이 있던 위치로 이동함과 동시에 따라갈 대상이 어디 있는지 기록합니다.

* 따라가기(Follow):

  자신이 따라가는 대상의 현재 위치를 기록함과 동시에 대상이 있었던 위치로 이동합니다.

이런 상태를 다룰 방법은 아주 다양합니다. 보통은 [유한 상태 기계(Finite State Machine)](https://www.google.com/search?q=finite+state+machine)와 이런 상태를 다룰 헬퍼 클래스를 사용하죠.

```js
class FiniteStateMachine {
  constructor(states, initialState) {
    this.states = states;
    this.transition(initialState);
  }
  get state() {
    return this.currentState;
  }
  transition(state) {
    const oldState = this.states[this.currentState];
    if (oldState && oldState.exit) {
      oldState.exit.call(this);
    }
    this.currentState = state;
    const newState = this.states[state];
    if (newState.enter) {
      newState.enter.call(this);
    }
  }
  update() {
    const state = this.states[this.currentState];
    if (state.update) {
      state.update.call(this);
    }
  }
}
```

위 클래스는 앞서 말한 헬퍼 클래스를 간단히 구현한 것입니다. 클래스는 생성 시 상태들의 객체를 받고, 각 상태에는 `enter`, `update`, `exit`이라는 메서드가 있습니다. 상태를 바꾸려면 `FiniteStateMachine.transition`을 호출할 때 새로운 이름을 넘겨주면 되죠. 만약 현재 상태에 `exit` 메서드가 있다면 해당 메서드를 호출합니다. 그리고 새로운 상태에 `enter` 메서드가 있을 경우 `enter` 메서드를 호출합니다. 마지막으로 매 프레임마다 `FiniteStateMachine.update`를 호출하면 각 상태의 `update` 메서드를 호출합니다.

이제 이 클래스를 활용해 동물들의 상태를 바꿔봅시다.

```js
// 매개변수 obj1과 obj2이 가깝다면 true를 반환합니다.
function isClose(obj1, obj1Radius, obj2, obj2Radius) {
  const minDist = obj1Radius + obj2Radius;
  const dist = obj1.position.distanceTo(obj2.position);
  return dist < minDist;
}

// v 의 값이 -min과 +min 사이가 되도록 합니다.
function minMagnitude(v, min) {
  return Math.abs(v) > min
      ? min * Math.sign(v)
      : v;
}

const aimTowardAndGetDistance = function() {
  const delta = new THREE.Vector3();

  return function aimTowardAndGetDistance(source, targetPos, maxTurn) {
    delta.subVectors(targetPos, source.position);
    // 바라볼 방향을 계산합니다.
    const targetRot = Math.atan2(delta.x, delta.z) + Math.PI * 1.5;
    // 더 가까운 방향으로 회전합니다.
    const deltaRot = (targetRot - source.rotation.y + Math.PI * 1.5) % (Math.PI * 2) - Math.PI;
    // maxTurn보다 빠른 속도로 돌지 않도록 합니다.
    const deltaRotation = minMagnitude(deltaRot, maxTurn);
    // rotation 값을 0에서 Math.PI * 2 사이로 유지합니다.
    source.rotation.y = THREE.MathUtils.euclideanModulo(
        source.rotation.y + deltaRotation, Math.PI * 2);
    // 목표까지의 거리를 반환합니다.
    return delta.length();
  };
}();

class Animal extends Component {
  constructor(gameObject, model) {
    super(gameObject);
+    const hitRadius = model.size / 2;
    const skinInstance = gameObject.addComponent(SkinInstance, model);
    skinInstance.mixer.timeScale = globals.moveSpeed / 4;
+    const transform = gameObject.transform;
+    const playerTransform = globals.player.gameObject.transform;
+    const maxTurnSpeed = Math.PI * (globals.moveSpeed / 4);
+    const targetHistory = [];
+    let targetNdx = 0;
+
+    function addHistory() {
+      const targetGO = globals.congaLine[targetNdx];
+      const newTargetPos = new THREE.Vector3();
+      newTargetPos.copy(targetGO.transform.position);
+      targetHistory.push(newTargetPos);
+    }
+
+    this.fsm = new FiniteStateMachine({
+      idle: {
+        enter: () => {
+          skinInstance.setAnimation('Idle');
+        },
+        update: () => {
+          // 플레이어가 근처에 있는지 확인합니다.
+          if (isClose(transform, hitRadius, playerTransform, globals.playerRadius)) {
+            this.fsm.transition('waitForEnd');
+          }
+        },
+      },
+      waitForEnd: {
+        enter: () => {
+          skinInstance.setAnimation('Jump');
+        },
+        update: () => {
+          // 기차의 가장 마지막에 있는 gameObject를 가져옵니다.
+          const lastGO = globals.congaLine[globals.congaLine.length - 1];
+          const deltaTurnSpeed = maxTurnSpeed * globals.deltaTime;
+          const targetPos = lastGO.transform.position;
+          aimTowardAndGetDistance(transform, targetPos, deltaTurnSpeed);
+          // 기차의 마지막에 있는 요소가 근처에 있는지 확인합니다.
+          if (isClose(transform, hitRadius, lastGO.transform, globals.playerRadius)) {
+            this.fsm.transition('goToLast');
+          }
+        },
+      },
+      goToLast: {
+        enter: () => {
+          // 따라갈 대상을 기록합니다. remember who we're following
+          targetNdx = globals.congaLine.length - 1;
+          // 기차의 마지막에 스스로를 추가합니다.
+          globals.congaLine.push(gameObject);
+          skinInstance.setAnimation('Walk');
+        },
+        update: () => {
+          addHistory();
+          // 기록된 위치 중 가장 나중 위치로 이동합니다.
+          const targetPos = targetHistory[0];
+          const maxVelocity = globals.moveSpeed * globals.deltaTime;
+          const deltaTurnSpeed = maxTurnSpeed * globals.deltaTime;
+          const distance = aimTowardAndGetDistance(transform, targetPos, deltaTurnSpeed);
+          const velocity = distance;
+          transform.translateOnAxis(kForward, Math.min(velocity, maxVelocity));
+          if (distance <= maxVelocity) {
+            this.fsm.transition('follow');
+          }
+        },
+      },
+      follow: {
+        update: () => {
+          addHistory();
+          // 가장 오래된 위치값을 지우고 자기 자신의 위치값을 추가합니다.
+          const targetPos = targetHistory.shift();
+          transform.position.copy(targetPos);
+          const deltaTurnSpeed = maxTurnSpeed * globals.deltaTime;
+          aimTowardAndGetDistance(transform, targetHistory[0], deltaTurnSpeed);
+        },
+      },
+    }, 'idle');
+  }
+  update() {
+    this.fsm.update();
+  }
}
```

한 번에 너무 많은 코드를 보여준 듯하지만 위 코드는 방금 언급한 역할을 합니다. 각 상태에 대한 코드를 보고 어떤 식으로 작동하는지 분석해보기 바랍니다.

여기에 몇 가지 요소를 추가해야 합니다. 플레이어가 자기 자신을 전역 객체(globals)에 추가해 다른 동물이 자신의 위치를 추적하도록 해야 하고, 또 기차의 머리를 플레이어의 `GameObject`로 지정해야 합니다.

```js
function init() {

  ...

  {
    const gameObject = gameObjectManager.createGameObject(scene, 'player');
+    globals.player = gameObject.addComponent(Player);
+    globals.congaLine = [gameObject];
  }

}
```

각 모델의 크기도 계산해야 합니다.

```js
function prepModelsAndAnimations() {
+  const box = new THREE.Box3();
+  const size = new THREE.Vector3();
  Object.values(models).forEach(model => {
+    box.setFromObject(model.gltf.scene);
+    box.getSize(size);
+    model.size = size.length();
    const animsByName = {};
    model.gltf.animations.forEach((clip) => {
      animsByName[clip.name] = clip;
      // 이런 부분은 .blend 파일에서 수정하는 게 좋습니다.
      if (clip.name === 'Walk') {
        clip.duration /= 2;
      }
    });
    model.animations = animsByName;
  });
}
```

그리고 플레이어가 자기 자신의 크기를 기록하도록 합니다.

```js
class Player extends Component {
  constructor(gameObject) {
    super(gameObject);
    const model = models.knight;
+    globals.playerRadius = model.size / 2;
```

이제 와 생각해보니 플레이어가 아니라 기차의 머리를 바라보게 하는 편이 더 나았겠네요. 이건 나중에 돌아와 고치도록 하겠습니다.

예제를 처음 만들었을 때는 동물들이 모두 같은 크기의 경계 원(radius)을 썼지만, 이렇게 하고 보니 말과 퍼그(강아지)의 크기가 같은 게 말이 안 된다는 생각이 들었습니다. 그래서 각 모델의 크기에 따라 경계 원을 따로 지정했죠. 그리고 상태를 보여주면 좋겠다는 생각이 들어 상태를 보여 줄 `StatusDisplayHelper` 컴포넌트를 추가했습니다.

또한 `PolarGridHelper`를 써 각 캐릭터의 경계 원이 보이도록 했고, [HTML 요소를 3D로 정렬하기](threejs-align-html-elements-to-3d.html)에서 썼던 방법으로 각 캐릭터의 상태를 HTML로 보여주도록 했습니다.

먼저 각 요소를 담을 HTML을 추가합니다.

```html
<body>
  <canvas id="c"></canvas>
  <div id="ui">
    <div id="left"><img src="resources/images/left.svg"></div>
    <div style="flex: 0 0 40px;"></div>
    <div id="right"><img src="resources/images/right.svg"></div>
  </div>
  <div id="loading">
    <div>
      <div>...loading...</div>
      <div class="progress"><div id="progressbar"></div></div>
    </div>
  </div>
+  <div id="labels"></div>
</body>
```

CSS도 작성합니다.

```css
#labels {
  position: absolute;  /* 기준 요소 위로 올라가도록 합니다. */
  left: 0;             /* 기준 요소 왼쪽 위로 정렬합니다. */
  top: 0;
  color: white;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}
#labels>div {
  position: absolute;  /* 기준 요소를 기준으로 합니다. */
  left: 0;             /* 기준 요소의 왼쪽 위로 정렬합니다. */
  top: 0;
  font-size: large;
  font-family: monospace;
  user-select: none;   /* 텍스트를 선택할 수 없도록 합니다. */
  text-shadow:         /* 글자에 검은 윤곽선을 넣습니다. */
    -1px -1px 0 #000,
     0   -1px 0 #000,
     1px -1px 0 #000,
     1px  0   0 #000,
     1px  1px 0 #000,
     0    1px 0 #000,
    -1px  1px 0 #000,
    -1px  0   0 #000;
}
```

아래는 `StateDisplayHelper` 컴포넌트입니다.

```js
const labelContainerElem = document.querySelector('#labels');

class StateDisplayHelper extends Component {
  constructor(gameObject, size) {
    super(gameObject);
    this.elem = document.createElement('div');
    labelContainerElem.appendChild(this.elem);
    this.pos = new THREE.Vector3();

    this.helper = new THREE.PolarGridHelper(size / 2, 1, 1, 16);
    gameObject.transform.add(this.helper);
  }
  setState(s) {
    this.elem.textContent = s;
  }
  setColor(cssColor) {
    this.elem.style.color = cssColor;
    this.helper.material.color.set(cssColor);
  }
  update() {
    const { pos } = this;
    const { transform } = this.gameObject;
    const { canvas } = globals;
    pos.copy(transform.position);

    /**
     * 해당 위치값을 정규화하면 x와 y 값은 -1에서 +1 사이의 값이 됩니다.
     * x = -1 이면 왼쪽, y = -1 이면 오른쪽이죠.
     **/
    pos.project(globals.camera);

    // 정규화한 위치값을 CSS 위치값으로 변환합니다.
    const x = (pos.x *  .5 + .5) * canvas.clientWidth;
    const y = (pos.y * -.5 + .5) * canvas.clientHeight;

    // HTML 요소를 해당 위치로 옮깁니다.
    this.elem.style.transform = `translate(-50%, -50%) translate(${ x }px, ${ y }px)`;
  }
}
```

동물 컴포넌트를 생성할 때 위 컴포넌트를 추가하도록 합니다.

```js
class Animal extends Component {
  constructor(gameObject, model) {
    super(gameObject);
+    this.helper = gameObject.addComponent(StateDisplayHelper, model.size);

     ...

  }
  update() {
    this.fsm.update();
+    const dir = THREE.MathUtils.radToDeg(this.gameObject.transform.rotation.y);
+    this.helper.setState(`${ this.fsm.state }:${ dir.toFixed(0) }`);
  }
}
```

추가로 dat.GUI를 이용해 위 디버깅 요소들를 켜고 끌 수 있도록 합니다.

```js
import * as THREE from './resources/three/r119/build/three.module.js';
import { OrbitControls } from './resources/threejs/r119/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from './resources/threejs/r119/examples/jsm/utils/SkeletonUtils.js';
+import { GUI } from '../3rdparty/dat.gui.module.js';
```

```js
+const gui = new GUI();
+gui.add(globals, 'debug').onChange(showHideDebugInfo);
+showHideDebugInfo();

const labelContainerElem = document.querySelector('#labels');
+function showHideDebugInfo() {
+  labelContainerElem.style.display = globals.debug ? '' : 'none';
+}
+showHideDebugInfo();

class StateDisplayHelper extends Component {

  ...

  update() {
+    this.helper.visible = globals.debug;
+    if (!globals.debug) {
+      return;
+    }

    ...
  }
}
```

게임의 가장 기본적인 틀을 완성했네요.

{{{example url="../threejs-game-conga-line.html"}}}

원래 처음에는 [지렁이 게임](https://www.google.com/search?q=snake+game)을 만들려고 했습니다. 동물이 기차에 붙어 기차가 길어질수록 장애물을 피하기 어려워지는 게임이죠. 예제에 몇 가지 장애물 놓거나 화면 둘레에 벽을 세우기도 했습니다.

하지만 예제에서 사용한 동물은 이에 적합하지 않습니다. 예제의 동물들은 대부분 위에서 봤을 때 길고 폭이 얇거든요. 아래는 얼룩말을 위에서 본 것입니다.

<div class="threejs_center"><img src="resources/images/zebra.png" style="width: 113px;"></div>

예제는 원 모양의 경계로 요소끼리의 충돌을 감지하기에 아래와 같이 울타리에 닿는 경우도 충돌로 감지할 겁니다.

<div class="threejs_center"><img src="resources/images/zebra-collisions.svg" style="width: 400px;"></div>

동물과 동물이 부딪히는 경우에도 마찬가지입니다. 특히 게임에서는 이래서 좋을 게 없죠.

2D 사각형을 만들어 충돌을 감지하는 것도 생각했으나, 바로 너무 많은 코드를 써야 한다는 걸 깨달았습니다. 예제의 각 모델에 다른 크기의 사각형을 추가하는 데는 그다지 많은 코드가 들어가지 않습니다. 하지만 이렇게 몇 가지 모델에 사각형을 추가해보면 곧 충돌을 감지하는 코드를 손봐야 할 필요가 생길 겁니다. 먼저 각 모델이 서로 충돌하는지 확인해야 하니 각 모델의 경계 정육면체나 경계 구체, 또는 모델과 같은 방향으로 정렬된 경계 육면체를 검사해야 합니다. 각 모델의 경계가 충돌했다는 건 두 모델이 *어쩌면* 서로 충돌했을 수도 있다는 이야기이기에, 각 모델이 *실제로* 충돌했는지 검사하기 위해 해당 모델들을 다시 검사해야 합니다. 대체로 경계 구체를 검사하는 것만 해도 꽤 많은 작업이 필요합니다. 가능하다면 각 요소가 근접했는지의 여부만 검사하는 등 더 특수한 방법을 사용하는 게 더 경제적이죠.

또한 충돌 여부를 검사하기만 하는 것으로 끝나는 것이 아니라 충돌 시스템도 구축해야 합니다. 그때 그때 각 모델에게 "너 다른 애랑 충돌했니?" 이렇게 물어보는 것보다 시스템이 직접 충돌 여부를 이벤트 등으로 알려주는 게 더 편할 테니까요. 충돌 시스템은 충돌과 관련한 이벤트나 콜백을 사용합니다. 이 방법의 장점은 모든 충돌을 한 번만 검사하기에 각 모델이 "내가 다른 애랑 충돌했나?" 이렇게 검사를 따로 할 필요가 없다는 거죠. 연산량을 훨씬 줄일 수 있습니다.

사각형을 확인하는 정도의 간단한 충돌 시스템을 만드는 코드는 100-300 줄 정도를 넘지 않을 겁니다. 하지만 예제와 비교하면 여전히 많은 코드이니 지금은 이대로 남겨 두겠습니다.

시도해봄직한 다른 방법은 다른 캐릭터 중 위에서 바라봤을 때 가장 원형에 가까운 캐릭터를 찾는 겁니다＊. 인간형 캐릭터의 경우는 대부분 잘 작동할 테고, 동물과 동물의 경우도 일부 경우는 잘 작동할 겁니다. 하지만 동물과 울타리의 경우는 감지하지 못하겠죠. 원래 화면 주위에 울타리나 덤불, 둥근 막대를 둘러보려고 했으나 이러려면 120에서 200개 정도의 요소를 더 만들어야 하고, 위에서 언급한 최적화 문제에 부딪쳤을 겁니다.

※ 시야각 때문에 카메라의 중심에서 벗어날수록 머리 위가 아닌 옆이 보이는 걸 이용한 방법. 역주.

이런 여러 문제 때문에 대부분의 게임들이 기존에 쓰던 방법을 사용합니다. 그리고 이 방법들 중에는 물리 라이브러리에서 쓰는 것들도 있죠. 물리 라이브러리는 요소가 서로 충돌하는지 확인하는 기능이 필수기에, 제가 위에서 사용했던 방법을 사용하기도 합니다.

Three.js의 예제 중 [ammo.js](https://github.com/kripken/ammo.js/)를 사용한 것을 보면 이런 해결 방법을 찾는 데 도움이 될지도 모르겠네요.

또 다른 방법은 장애물을 일정한 격자(grid)에 놓고 플레이어와 동물이 해당 격자만 참조하게 하는 겁니다. 성능 면에서 굉장히 좋은 방법인데, 이 또한 여러분이 직접 연습할 수 있는 😜 요소로 남겨 두면 좋겠다는 생각이 들더군요.

덧붙여 대부분의 게임 시스템에는 [코루틴(coroutine)](https://www.google.com/search?q=coroutines)이라는 것이 있습니다. 코루틴은 특정 작업을 하는 동안 멈췄다가 나중에 다시 시작하는 루틴(routine)을 말하죠.

플레이어 위에 음표를 띄워 노래로 동물들을 꼬시는 것처럼 해보겠습니다. 구현할 수 있는 방법은 아주 많지만, 예제에서는 코루틴을 사용해 이를 구현하겠습니다.

먼저 코루틴을 관리하는 클래스를 만듭니다.

```js
function* waitSeconds(duration) {
  while (duration > 0) {
    duration -= globals.deltaTime;
    yield;
  }
}

class CoroutineRunner {
  constructor() {
    this.generatorStacks = [];
    this.addQueue = [];
    this.removeQueue = new Set();
  }
  isBusy() {
    return this.addQueue.length + this.generatorStacks.length > 0;
  }
  add(generator, delay = 0) {
    const genStack = [generator];
    if (delay) {
      genStack.push(waitSeconds(delay));
    }
    this.addQueue.push(genStack);
  }
  remove(generator) {
    this.removeQueue.add(generator);
  }
  update() {
    this._addQueued();
    this._removeQueued();
    for (const genStack of this.generatorStacks) {
      const main = genStack[0];
      // 다른 코루틴이 해당 요소를 제거했을 경우
      if (this.removeQueue.has(main)) {
        continue;
      }
      while (genStack.length) {
        const topGen = genStack[genStack.length - 1];
        const { value, done } = topGen.next();
        if (done) {
          if (genStack.length === 1) {
            this.removeQueue.add(topGen);
            break;
          }
          genStack.pop();
        } else if (value) {
          genStack.push(value);
        } else {
          break;
        }
      }
    }
    this._removeQueued();
  }
  _addQueued() {
    if (this.addQueue.length) {
      this.generatorStacks.splice(this.generatorStacks.length, 0, ...this.addQueue);
      this.addQueue = [];
    }
  }
  _removeQueued() {
    if (this.removeQueue.size) {
      this.generatorStacks = this.generatorStacks.filter(genStack => !this.removeQueue.has(genStack[0]));
      this.removeQueue.clear();
    }
  }
}
```

위 클래스는 다른 코루틴이 실행되는 동안 요소를 안전하게 제거/추가하도록 `SafeArray`와 비슷한 구조로 만들었습니다. 또한 이 클래스는 중첩된 코루틴도 처리합니다.

코루틴을 만들려면 자바스크립트의 [제너레이터 함수](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/function*)를 만들어야 합니다. 제너레이터 함수는 `function*`이라는 키워드로 생성하죠(별표를 붙여야 합니다!).

제너레이터 함수는 `yield` 키워드로 실행 순서를 **양보(yield)**할 수 있습니다.

```js
function* countOTo9() {
  for (let i = 0; i < 10; ++i) {
    console.log(i);
    yield;
  }
}
```

이 함수를 아까 만든 `CoroutineRunner`에 추가하면 한 프레임, 또는 `runner.update`를 호출할 때마다 0부터 9까지의 숫자를 차례대로 출력할 겁니다.

```js
const runner = new CoroutineRunner();
runner.add(count0To9);
while(runner.isBusy()) {
  runner.update();
}
```

코루틴은 동작이 끝났을 때 자동으로 제거됩니다. 코루틴이 끝나기 전에 제거하려면 제너레이터를 미리 참조한 뒤 `remove` 메서드를 호출해야 합니다.

```js
const gen = count0To9();
runner.add(gen);

// 얼마 후

runner.remove(gen);
```

이제 플레이어가 0.5에서 1초 사이마다 한 번씩 음표를 뱉도록 해봅시다.

```js
class Player extends Component {
  constructor(gameObject) {

    ...

+    this.runner = new CoroutineRunner();
+
+    function* emitNotes() {
+      for (;;) {
+        yield waitSeconds(rand(0.5, 1));
+        const noteGO = gameObjectManager.createGameObject(scene, 'note');
+        noteGO.transform.position.copy(gameObject.transform.position);
+        noteGO.transform.position.y += 5;
+        noteGO.addComponent(Note);
+      }
+    }
+
+    this.runner.add(emitNotes());
  }
  update() {
+    this.runner.update();

  ...

  }
}

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}
```

위 코드에서는 `CoroutineRunner`를 만들고 `emitNotes` 코루틴을 추가했습니다. 이 함수는 0.5초에서 1초 사이마다 계속해서 `Note` 컴포넌트를 생성합니다.

`Note` 컴포넌트를 만들려면 먼저 텍스처가 필요합니다. 음표 이미지를 불러올 수도 있지만, [캔버스로 텍스처 만들기](threejs-canvas-textures.html)에서 다뤘던 것처럼 캔버스를 이용해 직접 음표를 만들겠습니다.

```js
function makeTextTexture(str) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = 64;
  ctx.canvas.height = 64;
  ctx.font = '60px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFF';
  ctx.fillText(str, ctx.canvas.width / 2, ctx.canvas.height / 2);
  return new THREE.CanvasTexture(ctx.canvas);
}
const noteTexture = makeTextTexture('♪');
```

위에서 만든 텍스처는 하얀색으로, 나중에 텍스처를 사용할 때 색을 따로 지정해 원하는 색의 음표를 그릴 수 있습니다.

이제 음표 텍스처를 만들었으니 `Note` 컴포넌트를 만들 차례입니다. 음표 컴포넌트는 [빌보드에 관한 글](threejs-billboards.html)에서 다뤘던 `SpriteMaterial`과 `Sprite`를 사용합니다.

```js
class Note extends Component {
  constructor(gameObject) {
    super(gameObject);
    const { transform } = gameObject;
    const noteMaterial = new THREE.SpriteMaterial({
      color: new THREE.Color().setHSL(rand(1), 1, 0.5),
      map: noteTexture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const note = new THREE.Sprite(noteMaterial);
    note.scale.setScalar(3);
    transform.add(note);
    this.runner = new CoroutineRunner();
    const direction = new THREE.Vector3(rand(-0.2, 0.2), 1, rand(-0.2, 0.2));

    function* moveAndRemove() {
      for (let i = 0; i < 60; ++i) {
        transform.translateOnAxis(direction, globals.deltaTime * 10);
        noteMaterial.opacity = 1 - (i / 60);
        yield;
      }
      transform.parent.remove(transform);
      gameObjectManager.removeGameObject(gameObject);
    }

    this.runner.add(moveAndRemove());
  }
  update() {
    this.runner.update();
  }
}
```

이 컴포넌트는 `Sprite`를 만들고 무작위로 속도를 정해 60프레임 동안 그 속도로 이동하게 합니다. 동시에 재질의 [`opacity`](Material.opacity) 속성을 바꿔 페이드-아웃 효과도 주죠. 반복문이 끝나면 이 컴포넌트는 위치값과 음표를 해당 GameObject에서 제거합니다.

정말 마지막으로, 동물의 수를 좀 늘려보겠습니다.

```js
function init() {

   ...

  const animalModelNames = [
    'pig',
    'cow',
    'llama',
    'pug',
    'sheep',
    'zebra',
    'horse',
  ];
+  const base = new THREE.Object3D();
+  const offset = new THREE.Object3D();
+  base.add(offset);
+
+  // 소용돌이 형태로 동물들을 배치합니다.
+  const numAnimals = 28;
+  const arc = 10;
+  const b = 10 / (2 * Math.PI);
+  let r = 10;
+  let phi = r / b;
+  for (let i = 0; i < numAnimals; ++i) {
+    const name = animalModelNames[rand(animalModelNames.length) | 0];
    const gameObject = gameObjectManager.createGameObject(scene, name);
    gameObject.addComponent(Animal, models[name]);
+    base.rotation.y = phi;
+    offset.position.x = r;
+    offset.updateWorldMatrix(true, false);
+    offset.getWorldPosition(gameObject.transform.position);
+    phi += arc / r;
+    r = b * phi;
  }
```

{{{example url="../threejs-game-conga-line-w-notes.html"}}}

누군가 `setTimeout`을 쓰면 안 되냐고 물을지도 모르겠습니다. `setTimeout`을 쓰지 않은 건 `setTimeout`은 게임의 프레임 주기와 무관하기 때문입니다. 예를 들어 예제에서는 프레임 간 시간값을 최대 1/20초로 제한했죠. 방금 구축한 코루틴 시스템도 이 제한을 따를 테지만, `setTimeout`을 쓰면 그렇지 않을 겁니다.

물론 좀 더 간단한 타이머를 만들 수도 있습니다.

```js
class Player ... {
  update() {
    this.noteTimer -= globals.deltaTime;
    if (this.noteTimer <= 0) {
      // 타이머를 초기화합니다.
      this.noteTimer = rand(0.5, 1);
      // GameObject로 음표 컴포넌트를 만듭니다.
    }
  }
```

특정 경우에야 이 방법이 더 좋을 수도 있지만, 더 많은 요소를 추가하면 그만큼 더 많은 변수와 코루틴을 추가해야 할테고, 그럴수록 `setTimeout`을 *설정하고 까먹을* 확률이 높아질 겁니다.

동물들의 상태를 설정할 때도 아래와 같이 코루틴을 사용할 수 있습니다.

```js
// 실제로 사용하지 않는 함수
function* animalCoroutine() {
   setAnimation('Idle');
   while(playerIsTooFar()) {
     yield;
   }
   const target = endOfLine;
   setAnimation('Jump');
   while(targetIsTooFar()) {
     aimAt(target);
     yield;
   }
   setAnimation('Walk')
   while(notAtOldestPositionOfTarget()) {
     addHistory();
     aimAt(target);
     yield;
   }
   for(;;) {
     addHistory();
     const pos = history.unshift();
     transform.position.copy(pos);
     aimAt(history[0]);
     yield;
   }
}
```

이 방법을 써도 딱히 문제는 없었겠지만, 상태가 일정하지 않아 다시 `FiniteStateMachine`을 찾게 될 겁니다.

또 저는 코루틴을 해당 컴포넌트와 독립적으로 실행하는 게 좋은지 잘 모르겠습니다. 물론 그냥 전역에 `CoroutineRunner`를 만들어 모든 코루틴을 여기에 집어 넣을 수는 있죠. 하지만 이러면 코루틴을 없애기가 힘들어질 겁니다. 지금 예제는 GameObject를 제거하면 해당 컴포넌트도 제거되고, 그러면 생성한 `CoroutineRunner`의 메서드를 호출할 일도 없으니 코루틴도 전부 가비지 컬렉션에 들어갈 겁니다. 전역에 `CoroutineRunner`를 두면 컴포넌트에서 직접 이 전역 객체의 코루틴을 제거하거나 자동으로 코루틴을 제거할 다른 방법이 필요할 겁니다.

실제 게임 엔진이라면 더 고려해야 할 문제가 많습니다. 지금은 GameObject나 컴포넌트에 따로 순서를 지정할 수 없죠. 그냥 추가한 순서가 해당 요소의 순서가 됩니다. 대부분의 게임 엔진은 우선 순위를 정해 순서를 바꿀 수 있습니다.

다른 문제는 `Note` 컴포넌트가 장면 위 GameObject의 transform 속성을 변경한다는 겁니다. 애초에 `GameObject`가 transform 속성을 변경했으니 좀 더 제대로 구현하려면 `GameObject`가 계속 transform 속성을 관리하는 게 맞겠죠. `GameObject`에 `dispose` 같은 메서드를 두고 `GameObjectManager.removeGameObject`에서 이 메서드를 호출했다면 어떨까요?

또 `gameObjectManager.update`나 `inputManager.update`를 직접 호출하는 대신 `SystemManager`를 만들어 `update`메서드를 가진 요소를 전부 추가해 이 클래스가 메서드를 호출하도록 하는 게 더 나을 수도 있습니다. 이렇게 하면 `CollisionManager` 등 새로운 시스템을 만들었을 때 `render` 함수를 수정하는 게 아니라 `SystemManager`에 이 시스템을 추가하기만 하면 될 겁니다.

저는 이런 문제들을 전부 다루기보다 여러분의 몫으로 남겨 두고자 합니다. 부디 이 글이 여러분만의 게임 엔진을 만드는 데 도움이 되었다면 좋겠네요.

어쩌면 제가 게임 잼(game jam)＊을 열 수도 있겠네요. 위 예제의 *jsfiddle*이나 *codepen*을 클릭해보면 코드를 바로 편집해 볼 수 있는 사이트가 열릴 겁니다. 특정 기능을 추가하거나 해서 예제를 퍼그가 기사(knight)을 끌고 다니는 게임을 만들거나, 기사의 구르기 애니메이션을 볼링공으로써 동물 볼링 게임을 만들 수도 있겠죠. 또는 동물 이어 달리기 게임이라든가요. 괜찮은 게임을 만들었다면 아래에 댓글로 링크를 남겨주시면 감사하겠습니다.

※ 게임 잼: 보통 24시간에서 72시간 정도의 짧은 기간 내에 팀, 또는 개인이 게임을 만드는 대회. 역주.

<div class="footnotes">
[<a id="parented">1</a>]: 물론 부모의 어떤 요소도 translation, rotation, scale 속성을 바꾸지 않았다면 정상적으로 작동합니다.<a href="#parented-backref">[돌아가기]</a>
</div>