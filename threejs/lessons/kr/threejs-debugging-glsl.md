Title: Three.js GLSL 디버깅
Description: GLSL 쉐이더 디버깅에 대해 알아봅니다
TOC: GLSL 디버깅

이 사이트에서 자바스크립트 자체에 대해 다루지 않듯, 아직까지 이 사이트에는 GLSL에 대한 글이 없습니다. GLSL은 간단히 다루기 어려운 주제이기에 GLSL을 배우고 싶다면 [이 시리즈](https://webglfundamentals.org/webgl/lessons/ko/)를 참고하기 바랍니다.

GLSL에 대해 어느 정도 안다면 이 글이 GLSL 디버깅에 도움이 될 겁니다.

GLSL 쉐이더를 만들었는데 아무것도 나타나지 않을 때, 저는 보통 쉐이더를 fragment 쉐이더로 바꾼 뒤 특정 색상만 반환하게 합니다. 예를 들어 쉐이더의 가장 마지막에 다음과 같은 코드를 넣는 것이죠.

```glsl
void main() {

  ...

  gl_FragColor = vec4(1, 0, 0, 1);  // 빨강
}
```

만약 저렇게 해서 요소가 보인다면 fragment 쉐이더에 문제가 있는 겁니다. 텍스처가 깨진 건지, 균등 변수(uniform)를 지정하지 않은 건지, 균등 변수에 잘못된 값을 지정한 건지는 알 수 없지만 적어도 어디서 문제를 찾아야 할지는 알 수 있죠.

어디가 틀렸는지 확인하기 위해 몇 가지 요소를 실제로 렌더링해볼 수 있습니다. 예를 들어 fragment 쉐이더의 법선(normal)을 사용한다면 저는 다음과 같은 코드를 추가할 겁니다.

```glsl
gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1);
```

법선의 값은 -1 에서 +1 사이이기에 0.5를 곱한 뒤 0.5를 더하면 값을 0.0 에서 0.1로 만들어 색으로 표현할 수 있습니다.

실행이 잘 된 예제에 이 쉐이더를 적용해보면 법선이 *보통(normally)* 어떻게 생겼는지 알 수 있습니다. 만약 법선이 정상적으로 보이지 않는다면 그게 다음 문제를 찾을 단서가 되겠죠. fragment 쉐이더에서 법선의 값을 변경하는 경우 같은 방법을 이용해 결과값을 렌더링할 수 있습니다.

<div class="threejs_center"><img src="resources/images/standard-primitive-normals.jpg" style="width: 650px;"></div>

마찬가지로 텍스처를 사용하는 경우에는 텍스처 좌표가 있으니 그걸로 다음과 같이 활용할 수 있습니다.

```glsl
gl_FragColor = vec4(fract(vUv), 0, 1);
```

텍스처 좌표를 사용하는 경우, `fract`를 실행한 값은 0부터 1 사이의 값이 아닐 수 있습니다. 대상 물체가 텍스처보다 크고 `texture.repeat`을 사용한 경우 1보다 큰 숫자가 나올 수 있겠죠.

<div class="threejs_center"><img src="resources/images/standard-primitive-uvs.jpg" style="width: 650px;"></div>

fragment 쉐이더의 다른 값으로도 비슷한 방법을 사용할 수 있습니다. 해당 값의 범위를 알아낸 뒤 해당 값을 0.0부터 1.0 사이의 값으로 변환해 `gl_FragColor`에 지정하는 거죠.

텍스처를 확인하려면 `CanvasTexture`나 `DataTexture`를 사용해보기 바랍니다.

만약 `gl_FragColor`에 빨간색을 지정했는데도 아무것도 보이지 않는다면, vertex 쉐이더 관련 물체의 방향 문제일 수 있습니다. 특정 행렬 좌표(matrix)가 잘못되었거나 어떤 속성의 값이 잘못되었거나 설정이 이상할 수 있죠.

그럼 먼저 행렬 좌표를 살펴봐야 합니다. `renderer.render(scene, camera)`를 한 번만 호출한 뒤 콘솔에서 객체를 펼쳐 보는 것이죠. 카메라의 전역 행렬 좌표나 투사 행렬 좌표에 `NaN`이 있는 걸까요? 장면 객체를 펼쳐 `children` 속성을 확인하니 전역 행렬 좌표는 멀쩡해 보입니다(`NaN`이 없음). 또한 다른 행렬 좌표의 4가지 값들도 모두 멀쩡해 보입니다. 만약 장면의 크기가 50x50x50인데 어떤 좌표값이 552352623.123이라면 확실히 뭔가 잘못된 겁니다.

<div class="threejs_center"><img src="resources/images/inspect-matrices.gif"></div>

fragment 쉐이더와 마찬가지로 vertex 쉐이더에서도 값을 fragment 쉐이더에 넘겨주는 방식으로 값을 시각화할 수 있습니다. 양 쉐이더에 동일하게 변수를 생성한 뒤, 의심되는 값을 넘겨주는 거죠. 저라면 fragment 쉐이더가 그 값을 표시하도록 의심되는 값을 `vNormal`에 0.0에서 1.0 사이의 값으로 바꿔 지정할 겁니다. 그런 다음 결과를 보고 예상과 일치하는지 확인하는 것이죠.

이 방법이 통하지 않는다면 어떤 vertex 쉐이더가 geometry를 가장 간단하게 표시할 수 있을까요? 아주 간단하게 다음처럼 할 수 있을 겁니다.

```glsl
gl_Position = projection * modelView * vec4(position.xyz, 1);
```

저 코드가 잘 작동한다면 변경사항을 조금씩 적용해보기 바랍니다.

추가로 [크롬의 확장 프로그램 중 쉐이더 에디터](https://chrome.google.com/webstore/detail/shader-editor/ggeaidddejpbakgafapihjbgdlbbbpob?hl=ko)나 다른 브라우저의 비슷한 프로그램을 찾아 사용하는 방법도 있습니다. 이는 다른 쉐이더가 어떻게 작동하는지 볼 때도 유용하죠. 또한 위 변경 사항을 바로 적용해볼 수 있다는 것도 장점입니다.
