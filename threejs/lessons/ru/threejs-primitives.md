Title: Примитивы Three.js
Description: Обзор примитивов three.js.
TOC: Примитивы

Эта статья является частью серии статей о three.js. 
Первая была [об основах](threejs-fundamentals.html).
Если вы её еще не читали, советую вам сделать это.

Three.js имеет большое количество примитивов. Примитивы, как правило, 
представляют собой трехмерные фигуры, которые генерируются во время 
выполнения с помощью набора параметров.

Примитивы используются для таких вещей, как сфера для глобуса или куча 
прямоугольников для рисования трехмерного графика. Особенно часто 
используются примитивы для экспериментов и начала работы с 3D. 
Для большинства 3D-приложений художник чаще всего создает 3D-модели 
в программе 3D-моделирования. Позже в этой серии мы рассмотрим 
создание и загрузку данных из нескольких программ 3D-моделирования. 
А сейчас давайте рассмотрим некоторые из доступных примитивов.

<div id="Diagram-BoxBufferGeometry" data-primitive="BoxBufferGeometry">Прямоугольный параллелепипед</div>
<div id="Diagram-CircleBufferGeometry" data-primitive="CircleBufferGeometry">Круг</div>
<div id="Diagram-ConeBufferGeometry" data-primitive="ConeBufferGeometry">Конус</div>
<div id="Diagram-CylinderBufferGeometry" data-primitive="CylinderBufferGeometry">Цилиндр</div>
<div id="Diagram-DodecahedronBufferGeometry" data-primitive="DodecahedronBufferGeometry">Додекаэдр (12 граней)</div>
<div id="Diagram-ExtrudeBufferGeometry" data-primitive="ExtrudeBufferGeometry">Выдавленная 2d фигура с скругленными краями.
Здесь мы выдавливаем форму сердца. Обратите внимание, это основа 
для <code>TextBufferGeometry</code> и <code>TextGeometry</code> соответственно.</div>
<div id="Diagram-IcosahedronBufferGeometry" data-primitive="IcosahedronBufferGeometry">Икосаэдр (20 граней)</div>
<div id="Diagram-LatheBufferGeometry" data-primitive="LatheBufferGeometry">Форма, созданная вращением линии. Например, лампы, кегли для боулинга, свечи, подсвечники, бокалы для вина, стаканы для питья и т. Д. Вы указываете 2-мерный силуэт в виде серии точек, а затем указываете three.js , сколько секций нужно сделать, когда он вращает силуэт вокруг оси.</div>
<div id="Diagram-OctahedronBufferGeometry" data-primitive="OctahedronBufferGeometry">Октаэдр (8 граней)</div>
<div id="Diagram-ParametricBufferGeometry" data-primitive="ParametricBufferGeometry">Поверхность, созданная путем предоставления функции, которая берет 2d точку из сетки и возвращает соответствующую 3d точку.</div>
<div id="Diagram-PlaneBufferGeometry" data-primitive="PlaneBufferGeometry">2D плоскость</div>
<div id="Diagram-PolyhedronBufferGeometry" data-primitive="PolyhedronBufferGeometry">Берет набор треугольников с центром вокруг точки и проецирует их на сферу</div>
<div id="Diagram-RingBufferGeometry" data-primitive="RingBufferGeometry">2D диск с отверстием в центре</div>
<div id="Diagram-ShapeBufferGeometry" data-primitive="ShapeBufferGeometry">2D контур, который строится из треугольников</div>
<div id="Diagram-SphereBufferGeometry" data-primitive="SphereBufferGeometry">Сфера</div>
<div id="Diagram-TetrahedronBufferGeometry" data-primitive="TetrahedronBufferGeometry">Тераэдр (4 грани)</div>
<div id="Diagram-TextBufferGeometry" data-primitive="TextBufferGeometry">3D-текст, сгенерированный из 3D-шрифта и строки</div>
<div id="Diagram-TorusBufferGeometry" data-primitive="TorusBufferGeometry">Тор (пончик)</div>
<div id="Diagram-TorusKnotBufferGeometry" data-primitive="TorusKnotBufferGeometry">Торический узел</div>
<div id="Diagram-TubeBufferGeometry" data-primitive="TubeBufferGeometry">Труба - круг проходящий путь</div>
<div id="Diagram-EdgesGeometry" data-primitive="EdgesGeometry">Вспомогательный объект, который принимает другую геометрию в качестве входных данных и генерирует ребра, только если угол между гранями больше некоторого порога. Например, если вы посмотрите на прямоугольник сверху, он показывает линию, проходящую через каждую грань, показывая каждый треугольник, из которого состоит прямоугольник. Используя EdgesGeometry, вместо этого удаляются средние линии.</div>
<div id="Diagram-WireframeGeometry" data-primitive="WireframeGeometry">Создает геометрию, которая содержит один отрезок (2 точки) на ребро в заданной геометрии. Без этого вы часто теряете ребра или получаете дополнительные ребра, поскольку WebGL обычно требует 2 точки на отрезок. Например, если бы у вас был только один треугольник, было бы только 3 очка. Если вы попытаетесь нарисовать его, используя материал с <code>wireframe: true</code> вы получите только одну линию. А передача этой triangle geometry в <code>WireframeGeometry</code> создаст новую геометрию, которая имеет 3 отрезка линий, используя 6 точек..</div>

Вы можете заметить, что большинство из них приходят парами `Geometry` 
или `BufferGeometry`. Разница между этими двумя типами заключается 
в гибкости и производительности.

`BufferGeometry` основанные на примитивах типы ориентированы на производительность. 
Вершины для геометрии генерируются непосредственно в эффективный формат 
типизированного массива, готовый для загрузки в графический процессор 
для рендеринга. Это означает, что они быстрее запускаются и занимают 
меньше памяти, но если вы хотите изменить их данные, они берут то, 
что часто считается более сложным программированием для манипулирования.

`Geometry` основанные на примитивах являются более гибкими, легче манипулировать типом. 
Они построены на основе классов JavaScript, таких как `Vector3` для 3D-точки, `Face3` 
для треугольников. Они занимают немного памяти, и прежде чем их можно будет отобразить, 
нужно будет преобразовать их во что-то похожее на соответствующее 
`BufferGeometry` представление.

Если вы знаете, что не собираетесь манипулировать примитивом или если вам удобно 
выполнять математику на прямую, чтобы манипулировать их внутренностями, то лучше 
использовать основанные на `BufferGeometry` примитивы. 
Если, с другой стороны, вы хотите изменить некоторые вещи перед рендерингом, 
вам может быть проще работать с примитивами основанными на `Geometry`.

В качестве простого примера в `BufferGeometry` не могут быть легко добавлены новые вершины.
Количество используемых вершин определяется во время создания, создается 
хранилище, а затем заполняются данные для вершин. В то время как с `Geometry` 
вы можете добавлять вершины по мере необходимости.

Мы рассмотрим создание пользовательской геометрии в другой статье. 
А пока давайте создадим пример создания каждого типа примитива. 
Начнем с [примеров из предыдущей статьи](threejs-responsive.html).

Близ вершины давайте установим цвет фона в светло-серый

```
const scene = new THREE.Scene();
+scene.background = new THREE.Color(0xAAAAAA);
```

Камера должна изменить положение, чтобы мы могли видеть все объекты.

```
-const fov = 75;
+const fov = 40;
const aspect = 2;  // the canvas default
const near = 0.1;
-const far = 5;
+const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
-camera.position.z = 2;
+camera.position.z = 120;
```

Давайте добавим функцию, `addObject`, которая добавляет 
объект `Object3D` на сцену в позицию x, y.

```
const objects = [];
const spread = 15;

function addObject(x, y, obj) {
  obj.position.x = x * spread;
  obj.position.y = y * spread;

  scene.add(obj);
  objects.push(obj);
}
```

Давайте также сделаем функцию для создания случайно раскрашенного материала.
Мы будем использовать особенность `Color` которая позволяет вам установить цвет 
на основе оттенка, насыщенности и яркости (hue, saturation, luminance).

`hue` идет от 0 до 1 вокруг цветового круга с красным на 0, 
зеленым на .33 и синим на .66. `saturation` 
изменяется от 0 до 1, где 0 не имеет цвета, а 1 наиболее насыщен.
`luminance` изменяется от 0 до 1, где 0 - черный, 1 - белый, 
а 0.5 максимальное количество цвета. Другими словами, 
`luminance` от 0,0 до 0,5 цвет будет изменяться с черного на `hue`. 
От 0,5 до 1,0 цвет изменится `hue` на белый.

```
function createMaterial() {
  const material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
  });

  const hue = Math.random();
  const saturation = 1;
  const luminance = .5;
  material.color.setHSL(hue, saturation, luminance);

  return material;
}
```

Мы также передаем материалу `side: THREE.DoubleSide`.
Это говорит three нарисовать обе стороны треугольников, 
которые составляют форму. Для сплошной (solid)  формы, 
такой как сфера или куб, обычно нет причин рисовать 
задние стороны треугольников, поскольку все они обращены 
внутрь фигуры. В нашем случае мы рисуем несколько вещей, 
таких как  `PlaneBufferGeometry` и `ShapeBufferGeometry`
которые являются двухмерными и поэтому не имеют внутренней 
части. Без установки `side: THREE.DoubleSide` они исчезнут,
при взгляде на их задние стороны.

Я должен отметить, что отрисовка быстрее, когда **не** установлено
`side: THREE.DoubleSide` в реальной работе, мы бы устанавливали 
его только для материалов, которые действительно в этом нуждаются, 
но в этом случае мы не рисуем слишком много, поэтому нет 
причин для беспокойства.

Давайте создадим функцию `addSolidGeometry`, которой мы передадим 
геометрию, и она создаст случайно раскрашенный материал 
`createMaterial` и `addObject` добавит его в сцену.

```
function addSolidGeometry(x, y, geometry) {
  const mesh = new THREE.Mesh(geometry, createMaterial());
  addObject(x, y, mesh);
}
```

Теперь мы можем использовать это для большинства примитивов, 
которые мы создаем. Например, создание прямоугольного параллелепипеда

```
{
  const width = 8;
  const height = 8;
  const depth = 8;
  addSolidGeometry(-2, -2, new THREE.BoxBufferGeometry(width, height, depth));
}
```

Если вы посмотрите на код ниже, вы увидите похожую часть для 
каждого типа геометрии.

Вот результат:

{{{example url="../threejs-primitives.html" }}}

Есть несколько заметных исключений из шаблона выше. 
Самым большим, вероятно, является `TextBufferGeometry`. Он должен 
загрузить данные 3D шрифта, прежде чем он сможет сгенерировать 
сетку для текста. Эти данные загружаются асинхронно, поэтому 
нам нужно дождаться их загрузки, прежде чем пытаться создать 
геометрию. Вы можете увидеть ниже, мы создаем `FontLoader` 
и передаем его URL нашему шрифту и обратному вызову (callback). 
Обратный вызов срабатывает после загрузки шрифта. 
В обратном вызове мы создаем геометрию и вызываем `addObject`, 
чтобы добавить к ней сцену.

```
{
  const loader = new THREE.FontLoader();
  loader.load('../resources/threejs/fonts/helvetiker_regular.typeface.json', (font) => {
    const geometry = new THREE.TextBufferGeometry('three.js', {
      font: font,
      size: 3.0,
      height: .2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: .3,
      bevelSegments: 5,
    });
    const mesh = new THREE.Mesh(geometry, createMaterial());
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter(mesh.position).multiplyScalar(-1);

    const parent = new THREE.Object3D();
    parent.add(mesh);

    addObject(-1, 1, parent);
  });
}
```

Есть еще одно отличие. Мы хотим вращать текст вокруг его центра, 
но по умолчанию three.js создает текст таким образом, чтобы его 
центр вращения находился на левом краю. Чтобы обойти это, мы 
можем попросить three.js вычислить ограничивающую 
рамку (bounding box) геометрии. Затем мы можем вызвать `getCenter` 
метод bounding box и передать ему объект позиции нашей полигональной 
сетки (mesh). `getCenter` копирует центр коробки в указанное положение.
Он также возвращает объект position, поэтому мы можем вызвать 
`multiplyScaler(-1)` для позиционирования всего объекта таким образом, 
чтобы его центр вращения находился в центре объекта.

Если бы мы тогда просто вызвали `addSolidGeometry` как в предыдущих 
примерах, это снова установило бы позицию, что не годится. 
Итак, в этом случае мы создаем `Object3D` стандартный узел для графа 
сцены three.js. `Mesh` так же наследуется от `Object3D`. Мы рассмотрим, 
[как работает график сцены, в другой статье](threejs-scenegraph.html).
На данный момент достаточно знать, что, как и DOM-узлы, дети рисуются 
относительно своего родителя. Сделав `Object3D` и сделав нашу сетку 
дочерней по отношению к этому, мы можем расположить `Object3D`  в то 
место, где мы хотим, и при этом сохранить смещение центра, 
которое мы установили раньше.

Если бы мы этого не делали, текст был бы оторван от центра.

{{{example url="../threejs-primitives-text.html" }}}

Обратите внимание, что то что слева не вращается вокруг своего центра, 
как то, что справа.

Другие исключения - это 2-строчные примеры для `EdgesGeometry`
и `WireframeGeometry`. Вместо того, чтобы вызвать `addSolidGeometry` 
они вызвают `addLineGeomtry` который выглядит так

```
function addLineGeometry(x, y, geometry) {
  const material = new THREE.LineBasicMaterial({color: 0x000000});
  const mesh = new THREE.LineSegments(geometry, material);
  addObject(x, y, mesh);
}
```

Он создает черный цвет `LineBasicMaterial`, а затем создает `LineSegments`, 
который является оберткой `Mesh`, который помогает three знать, что вы 
отрисовываете отрезки линии (2 точки на отрезок).

Каждый из примитивов имеет несколько параметров, которые вы можете 
передать при создании, и лучше всего [посмотреть в документации](https://threejs.org/docs/) 
по всем из них, а не повторять их здесь. Вы также можете нажать на ссылку выше рядом с 
каждой фигурой, чтобы перейти непосредственно к документам для этой фигурой.

Еще одна важная вещь - это то, что почти все фигуры имеют различные настройки того, 
как их разделить на полигоны. Хорошим примером может служить геометрия сферы. 
Сферы берут параметры для количества делений вокруг и количества делений сверху вниз. 
Например

<div class="spread">
<div data-diagram="SphereBufferGeometryLow"></div>
<div data-diagram="SphereBufferGeometryMedium"></div>
<div data-diagram="SphereBufferGeometryHigh"></div>
</div>

Первая сфера имеет 5 сегментов вокруг и 3 высоты, что составляет 15 сегментов 
или 30 треугольников. Вторая сфера имеет 24 сегмента на 10. Это 240 сегментов 
или 480 треугольников. Последний имеет 50 на 50, что составляет 2500 сегментов 
или 5000 треугольников.

Вам решать, сколько сегментов вам нужно. Может показаться, что вам нужно 
большое количество сегментов, но удалите линии и плоскую штриховку, 
и мы получим это

<div class="spread">
<div data-diagram="SphereBufferGeometryLowSmooth"></div>
<div data-diagram="SphereBufferGeometryMediumSmooth"></div>
<div data-diagram="SphereBufferGeometryHighSmooth"></div>
</div>

Сейчас не очень понятно, что тот, который справа с 5000 треугольниками, 
полностью лучше, чем тот, что в середине с 480. Если вы рисуете только 
несколько сфер, как, например, один глобус для карты земли, то одна 
сфера из 10000 треугольников - неплохой выбор. Если, с другой стороны, 
вы пытаетесь нарисовать 1000 сфер, то 1000 сфер на 10000 треугольников 
каждый - это 10 миллионов треугольников. Для плавной анимации вам нужно, 
чтобы браузер рисовал со скоростью 60 кадров в секунду, поэтому вы должны 
просить браузер рисовать 600 миллионов треугольников в секунду. Это много 
вычислений.

Иногда выбрать легко. Например, вы можете выбрать разделение для плоскости.

<div class="spread">
<div data-diagram="PlaneBufferGeometryLow"></div>
<div data-diagram="PlaneBufferGeometryHigh"></div>
</div>

Плоскость слева - это 2 треугольника. Плоскость справа - это 200 треугольников. 
В отличие от сферы, в большинстве случаев использования плоскости действительно 
нет компромисса в качестве. Скорее всего, вы подразделяете плоскость только в 
том случае, если вы хотите изменить или деформировать её каким-либо образом. 
Для Box аналогично.

Итак, выберите то, что подходит для вашей ситуации. Чем меньше разбиений 
вы выберете, тем более вероятно, что все будет работать гладко и тем меньше 
памяти они будут занимать. Вы должны решить для себя, каков правильный 
компромисс для вашей конкретной ситуации.

Далее давайте рассмотрим [как работает граф сцены и как его использовать](threejs-scenegraph.html).

<script type="module" src="resources/threejs-primitives.js"></script>
<link rel="stylesheet" href="resources/threejs-primitives.css">
