Title: Three.js VR - 3DOF Point to Select
Description: 3DOF Point to Select를 시행하는 방법
TOC: VR - Point To Select

**NOTE: 이 페이지의 예시에는 포인팅 장치가 있는 VR 지원 장치가 필요합니다.
포인팅 장치가 있는 VR 지원 장치가 없으면 작업을 수행할 수 없으며
그 이유를 [이 글에서](threejs-webvr.html) 확인할 수 있습니다.
**

[이전 글](threejs-webvr-look-to-select.html)에서는 사용자가 보는 것을 통해 항목을 가리키며 선택할 수 있도록 하는 매우 간단한 VR 예제를 살펴보았습니다.
이 글에서는 한 단계 더 나아가 사용자가 포인팅 장치를 사용하여 항목을 선택할 수 있도록 해보겠습니다.

Three.js는 2개의 컨트롤러 개체를 VR로 제공하여 비교적 쉽게 만들며 단일 3DOF 컨트롤러와 2개의 6DOF 컨트롤러의 경우를 모두 처리하려고 합니다.
각 컨트롤러는 컨트롤러의 방향과 위치를 제공하는 `Object3D` 개체입니다.
또한 사용자가 컨트롤러의 "메인" 버튼을 누르기 시작하고, 누르고, 누르기를 중지할 때(끝낼 때) `selectstart`, `select` 및 `selectend` 이벤트를 제공합니다.

[이전 글](threejs-webvr-look-to-select.html)의 마지막 예시에서 `PickHelper`를 `ControllerPickHelper`로 변경해 보겠습니다.

이번의 새로운 구현에서는 선택된 개체를 제공하는 `select` 이벤트를 내보낼 것입니다.
따라서 개체를 사용하기 위해 이 작업을 수행해야 합니다.

```js
const pickHelper = new ControllerPickHelper(scene);
pickHelper.addEventListener('select', (event) => {
  event.selectedObject.visible = false;
  const partnerObject = meshToMeshMap.get(event.selectedObject);
  partnerObject.visible = true;
});
```

이전의 코드를 떠올려 보면 상자와 구를 서로 매핑하면 `meshToMeshMap`를 통해 박스와 구를 찾을 수 있으므로
여기서는 선택된 개체를 숨기고 파트너의 숨김을 해제합니다.

 `ControllerPickHelper`의 실제 구현에 대해서는 먼저 VR 컨트롤러 개체를 scene에 추가하고
 이러한 개체에 사용자가 가리키는 위치를 표시하는 데 사용할 수 있는 3D 라인을 추가하고, 컨트롤러와 라인을 모두 저장해야 합니다.

```js
class ControllerPickHelper {
  constructor(scene) {
    const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    this.controllers = [];
    for (let i = 0; i < 2; ++i) {
      const controller = renderer.xr.getController(i);
      scene.add(controller);

      const line = new THREE.Line(pointerGeometry);
      line.scale.z = 5;
      controller.add(line);
      this.controllers.push({controller, line});
    }
  }
}
```

다른 어떠한 작업을 수행하지 않고 이 작업만으로도
사용자의 포인팅 장치가 어디에 있고 어느 쪽을 가리키고 있는지를 보여주는 scene에서 한 두개의 라인이 제공됩니다.

다음에는 컨트롤러로 선택하는 코드를 추가해봅시다. 카메라가 아닌 것으로 선택하는 것은 이번이 처음입니다.
[피킹에 관한 글](threejs-picking.html)에서는 마우스나 손가락을 사용하여 선택하는 것이 카메라에서 화면으로 전달된다는 것을 의미했습니다.
[이전 글](threejs-webvr-look-to-select.html)에서는 카메라에 나오는 사용자가 어떤 식으로 다시 보이는지를 기준으로 선택했습니다.
이번에는 카메라를 사용하지 않기 때문에 컨트롤러의 위치를 통해 선택합니다.

```js
class ControllerPickHelper {
  constructor(scene) {
+    this.raycaster = new THREE.Raycaster();
+    this.objectToColorMap = new Map();
+    this.controllerToObjectMap = new Map();
+    this.tempMatrix = new THREE.Matrix4();
    
    const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    this.controllers = [];
    for (let i = 0; i < 2; ++i) {
      const controller = renderer.xr.getController(i);
      scene.add(controller);

      const line = new THREE.Line(pointerGeometry);
      line.scale.z = 5;
      controller.add(line);
      this.controllers.push({controller, line});
    }
  }
+  update(scene, time) {
+    this.reset();
+    for (const {controller, line} of this.controllers) {
+      // cast a ray through the from the controller
+      this.tempMatrix.identity().extractRotation(controller.matrixWorld);
+      this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
+      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
+      // get the list of objects the ray intersected
+      const intersections = this.raycaster.intersectObjects(scene.children);
+      if (intersections.length) {
+        const intersection = intersections[0];
+        // make the line touch the object
+        line.scale.z = intersection.distance;
+        // pick the first object. It's the closest one
+        const pickedObject = intersection.object;
+        // save which object this controller picked
+        this.controllerToObjectMap.set(controller, pickedObject);
+        // highlight the object if we haven't already
+        if (this.objectToColorMap.get(pickedObject) === undefined) {
+          // save its color
+          this.objectToColorMap.set(pickedObject, pickedObject.material.emissive.getHex());
+          // set its emissive color to flashing red/yellow
+          pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFF2000 : 0xFF0000);
+        }
+      } else {
+        line.scale.z = 5;
+      }
+    }
+  }
}
```

`Raycaster`를 사용하기 전에는 그랬지만 이번에는 컨트롤러에서 ray를 가져옵니다.
이전 `PickHelper`에서는 한 가지만 선택할 수 있었지만, 여기서는 한 손에 하나씩 최대 2개의 컨트롤러가 있습니다.
우리는 각 컨트롤러가 보고 있는 개체를 `controllerToObjectMap`에 저장해야 합니다.
또한 원래 방사체의 색을 `objectToColorMap`에 저장하여 선이 가리키는 모든 부분에 닿을 수 있을 만큼 길게 만듭니다.

모든 프레임에서 이러한 설정들을 재설정하려면 몇 가지 코드를 추가해야 합니다.


```js
class ControllerPickHelper {
  
  ...

+  _reset() {
+    // restore the colors
+    this.objectToColorMap.forEach((color, object) => {
+      object.material.emissive.setHex(color);
+    });
+    this.objectToColorMap.clear();
+    this.controllerToObjectMap.clear();
+  }
  update(scene, time) {
+    this._reset();

    ...

}
```

다음으로 우리는 사용자가 컨트롤러를 클릭했을 때 `select` 이벤트를 내보내야 합니다.
이를위해 three.js의 `EventDispatcher`를 확장한 후 컨트롤러에서 `select` 이벤트를 확인하고
해당 컨트롤러가 가리키는 것이 있으면 해당 컨트롤러가 가리키는 `select` 이벤트를 내보냅니다.


```js
-class ControllerPickHelper {
+class ControllerPickHelper extends THREE.EventDispatcher {
  constructor(scene) {
+    super();
    this.raycaster = new THREE.Raycaster();
    this.objectToColorMap = new Map();  // object to save color and picked object
    this.controllerToObjectMap = new Map();
    this.tempMatrix = new THREE.Matrix4();

    const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    this.controllers = [];
    for (let i = 0; i < 2; ++i) {
      const controller = renderer.xr.getController(i);
+      controller.addEventListener('select', (event) => {
+        const controller = event.target;
+        const selectedObject = this.controllerToObjectMap.get(controller);
+        if (selectedObject) {
+          this.dispatchEvent({type: 'select', controller, selectedObject});
+        }
+      });
      scene.add(controller);

      const line = new THREE.Line(pointerGeometry);
      line.scale.z = 5;
      controller.add(line);
      this.controllers.push({controller, line});
    }
  }
}
```

이제 render loop에서 `update`만 호출하면 됩니다.


```js
function render(time) {

  ...

+  pickHelper.update(scene, time);

  renderer.render(scene, camera);
}
```

그리고 컨트롤러가 있는 VR 장치가 있다고 가정하면 컨트롤러를 사용하여 선택할 수 있습니다.

{{{example url="../threejs-webvr-point-to-select.html" }}}

만약 우리가 물체를 움직일 수 있기를 원한다면 어떨까요?

그것은 비교적 쉽습니다.
컨트롤러의 `select` 수신기 코드를 함수 안으로 이동하여 두가지 이상의 용도로 그것을 사용할 수 있도록 합니다.

```js
class ControllerPickHelper extends THREE.EventDispatcher {
  constructor(scene) {
    super();

    ...

    this.controllers = [];

+    const selectListener = (event) => {
+      const controller = event.target;
+      const selectedObject = this.controllerToObjectMap.get(event.target);
+      if (selectedObject) {
+        this.dispatchEvent({type: 'select', controller, selectedObject});
+      }
+    };

    for (let i = 0; i < 2; ++i) {
      const controller = renderer.xr.getController(i);
-      controller.addEventListener('select', (event) => {
-        const controller = event.target;
-        const selectedObject = this.controllerToObjectMap.get(event.target);
-        if (selectedObject) {
-          this.dispatchEvent({type: 'select', controller, selectedObject});
-        }
-      });
+      controller.addEventListener('select', selectListener);

       ...
```

이제 이것을 `selectstart`와 `select` 모두에 사용해 봅시다.


```js
class ControllerPickHelper extends THREE.EventDispatcher {
  constructor(scene) {
    super();

    ...

    this.controllers = [];

    const selectListener = (event) => {
      const controller = event.target;
      const selectedObject = this.controllerToObjectMap.get(event.target);
      if (selectedObject) {
-        this.dispatchEvent({type: 'select', controller, selectedObject});
+        this.dispatchEvent({type: event.type, controller, selectedObject});
      }
    };

    for (let i = 0; i < 2; ++i) {
      const controller = renderer.xr.getController(i);
      controller.addEventListener('select', selectListener);
      controller.addEventListener('selectstart', selectListener);

       ...
```

사용자가 컨트롤러의 버튼을 놓을 때 three.js가 전송하는 `selectend` 이벤트도 전달해 봅시다.


```js
class ControllerPickHelper extends THREE.EventDispatcher {
  constructor(scene) {
    super();

    ...

    this.controllers = [];

    const selectListener = (event) => {
      const controller = event.target;
      const selectedObject = this.controllerToObjectMap.get(event.target);
      if (selectedObject) {
        this.dispatchEvent({type: event.type, controller, selectedObject});
      }
    };

+    const endListener = (event) => {
+      const controller = event.target;
+      this.dispatchEvent({type: event.type, controller});
+    };
    
    for (let i = 0; i < 2; ++i) {
      const controller = renderer.xr.getController(i);
      controller.addEventListener('select', selectListener);
      controller.addEventListener('selectstart', selectListener);
+      controller.addEventListener('selectend', endListener);

       ...
```

이제 코드를 변경하여 `selectstart` 이벤트가 발생하면 선택한 개체를 scene에서 제거하고 컨트롤러의 하위 개체로 만듭니다.
즉, 컨트롤러와 함께 이동합니다. `selectend`이벤트를 받게 되면 다시 scene에 넣을 것입니다.


```js
const pickHelper = new ControllerPickHelper(scene);
-pickHelper.addEventListener('select', (event) => {
-  event.selectedObject.visible = false;
-  const partnerObject = meshToMeshMap.get(event.selectedObject);
-  partnerObject.visible = true;
-});

+const controllerToSelection = new Map();
+pickHelper.addEventListener('selectstart', (event) => {
+  const {controller, selectedObject} = event;
+  const existingSelection = controllerToSelection.get(controller);
+  if (!existingSelection) {
+    controllerToSelection.set(controller, {
+      object: selectedObject,
+      parent: selectedObject.parent,
+    });
+    controller.attach(selectedObject);
+  }
+});
+
+pickHelper.addEventListener('selectend', (event) => {
+  const {controller} = event;
+  const selection = controllerToSelection.get(controller);
+  if (selection) {
+    controllerToSelection.delete(controller);
+    selection.parent.attach(selection.object);
+  }
+});
```

한 개체가 선택되면 해당 개체와 원래의 부모 개체가 저장됩니다.
사용자가 작업을 마치면 개체를 다시 돌려놓을 수 있습니다.

`Object3D.attach`를 사용하여 선택한 개체를 재부모화 합니다.
이러한 기능을 통해 scene에서 객체의 방향과 위치를 변경하지 않고도 객체의 부모를 변경할 수 있습니다.

그리고 우리는 이를 통해 6DOF컨트롤러로 물체를 이동하거나 3DOF 컨트롤러로 방향을 전환할 수도 있을 것입니다.

{{{example url="../threejs-webvr-point-to-select-w-move.html" }}}

솔직하게 말해서 나는 이 `ControllerPickHelper`가 코드를 구성하는 가장 좋은 방법이라고 확신할 수 없습니다.
하지만 이것은 three.js의 VR에서 작동하는 간단한 작업들의 다양한 부분을 보여주는데 유용합니다.
