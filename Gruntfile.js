/*eslint-env node*/

'use strict';

process.on('unhandledRejection', up => {
  throw up;
});

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const liveEditor = require('@gfxfundamentals/live-editor');
//const liveEditorPath = path.dirname(require.resolve('@gfxfundamentals/live-editor'));
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

// make a fake window because jquery sucks
const dom = new JSDOM('');
global.window = dom.window;
global.document = global.window.document;
const jquery = require('jquery');

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  const s_ignoreRE = /\.(md|py|sh|enc)$/i;
  function noMds(filename) {
    return !s_ignoreRE.test(filename);
  }

  const s_isMdRE = /\.md$/i;
  function mdsOnly(filename) {
    return s_isMdRE.test(filename);
  }

  /*
    function notFolder(filename) {
    return !fs.statSync(filename).isDirectory();
  }

  function noMdsNoFolders(filename) {
    return noMds(filename) && notFolder(filename);
  }
  */

  const config = {
    eslint: {
      lib: {
        src: [
          'threejs/resources/*.js',
        ],
      },
      support: {
        src: [
          'Gruntfile.js',
          'build/js/build.js',
        ],
      },
      examples: {
        src: [
          'threejs/*.html',
          'threejs/lessons/resources/*.js',
          '!threejs/lessons/resources/prettify.js',
          'threejs/lessons/resources/*.html',
        ],
      },
    },
    copy: {
      main: {
        files: [
          { expand: true, cwd: 'threejs/resources', src: '**', dest: '../three.js/manual/examples/resources', },
          { expand: true, cwd: 'threejs/lessons/resources', src: '**', dest: '../three.js/manual/resources', },
          { expand: true, cwd: 'threejs', src: '*.js', dest: '../three.js/manual/examples', },
          { expand: true, cwd: `${liveEditor.monacoEditor}/`, src: 'min/**', dest: '../three.js/manual/3rdparty/monaco-editor/', nonull: true, },
          { expand: false, src: '3rdparty/dat.gui.module.js', dest: '../three.js/manual/3rdparty/dat.gui.module.js', },
          { expand: false, src: '3rdparty/split.min.js', dest: '../three.js/manual/3rdparty/split.min.js', },
          { expand: false, src: 'threejs/lessons/lang.css', dest: '../three.js/manual/resources/lang.css', },
          { expand: false, src: 'threejs/lessons/kr/lang.css', dest: '../three.js/manual/ko/lang.css', },
          { expand: true, cwd: 'threejs/lessons/kr/resources', src: '**', dest: '../three.js/manual/ko/resources', },
          { expand: false, src: 'threejs/lessons/zh_cn/lang.css', dest: '../three.js/manual/zh_cn/lang.css', },
          { expand: false, src: 'index.html', dest: '../three.js/manual/index.html', },
          //{ expand: true, src: '3rdparty/**', dest: '../three.js/manual/', },
        ],
      },
    },
    clean: {
      options: {force: true},
      foo: [
        '../three.js/manual/**/*',
      ],
    },
    buildlesson: {
      main: {
        files: [],
      },
    },
    watch: {
      main: {
        files: [
          'threejs/**',
          '3rdparty/**',
        ],
        tasks: ['copy'],
        options: {
          spawn: false,
        },
      },
      lessons: {
        files: [
          'threejs/lessons/**/threejs*.md',
        ],
        tasks: ['buildlesson'],
        options: {
          spawn: false,
        },
      },
    },
  };

  {
    const examples = fs.readdirSync('threejs').filter(f => f.endsWith('.html'));
    for (const example of examples) {
      config.copy.main.files.push({
        //expand: false,
        //cwd: 'threejs',
        src: path.join('threejs', example),
        dest: `../three.js/manual/examples/${example.replace('threejs-', '')}`,
      });
    }
  }
  //console.log(JSON.stringify(config, null, 2));
  //process.exit(2);

  grunt.initConfig(config);


  let changedFiles = {};
  const onChange = grunt.util._.debounce(function() {
    grunt.config('copy.main.files', Object.keys(changedFiles).filter(noMds).map((file) => {
      const copy = {
        src: file,
        dest: '../three.js/manual/',
      };
      return copy;
    }));
    grunt.config('buildlesson.main.files', Object.keys(changedFiles).filter(mdsOnly).map((file) => {
      return {
        src: file,
      };
    }));
    changedFiles = {};
  }, 200);
  grunt.event.on('watch', function(action, filepath) {
    changedFiles[filepath] = action;
    onChange();
  });

  function fixThreeJSLinks(html) {
    const supportedLangs = {
      'en': true,
      'zh': true,
      'ja': true,
      'ko': true,
    };

    global.document.open('text/html', 'replace');
    global.document.write(html);
    global.document.close();
    const $ = jquery;

    function insertLang(codeKeywordLinks) {
      const lang = document.documentElement.lang.substr(0, 2).toLowerCase();
      const langPart = `#api/${supportedLangs[lang] ? lang : 'en'}/`;
      const langAddedLinks = {};
      for (const [keyword, url] of Object.entries(codeKeywordLinks)) {
        langAddedLinks[keyword] = url.replace('#api/', langPart);
      }
      return langAddedLinks;
    }

    const codeKeywordLinks = insertLang({
      AnimationAction: '/docs/#api/animation/AnimationAction',
      AnimationClip: '/docs/#api/animation/AnimationClip',
      AnimationMixer: '/docs/#api/animation/AnimationMixer',
      AnimationObjectGroup: '/docs/#api/animation/AnimationObjectGroup',
      AnimationUtils: '/docs/#api/animation/AnimationUtils',
      KeyframeTrack: '/docs/#api/animation/KeyframeTrack',
      PropertyBinding: '/docs/#api/animation/PropertyBinding',
      PropertyMixer: '/docs/#api/animation/PropertyMixer',
      BooleanKeyframeTrack: '/docs/#api/animation/tracks/BooleanKeyframeTrack',
      ColorKeyframeTrack: '/docs/#api/animation/tracks/ColorKeyframeTrack',
      NumberKeyframeTrack: '/docs/#api/animation/tracks/NumberKeyframeTrack',
      QuaternionKeyframeTrack: '/docs/#api/animation/tracks/QuaternionKeyframeTrack',
      StringKeyframeTrack: '/docs/#api/animation/tracks/StringKeyframeTrack',
      VectorKeyframeTrack: '/docs/#api/animation/tracks/VectorKeyframeTrack',
      Audio: '/docs/#api/audio/Audio',
      AudioAnalyser: '/docs/#api/audio/AudioAnalyser',
      AudioContext: '/docs/#api/audio/AudioContext',
      AudioListener: '/docs/#api/audio/AudioListener',
      PositionalAudio: '/docs/#api/audio/PositionalAudio',
      ArrayCamera: '/docs/#api/cameras/ArrayCamera',
      Camera: '/docs/#api/cameras/Camera',
      CubeCamera: '/docs/#api/cameras/CubeCamera',
      OrthographicCamera: '/docs/#api/cameras/OrthographicCamera',
      PerspectiveCamera: '/docs/#api/cameras/PerspectiveCamera',
      StereoCamera: '/docs/#api/cameras/StereoCamera',
      Animation: '/docs/#api/constants/Animation',
      Core: '/docs/#api/constants/Core',
      CustomBlendingEquation: '/docs/#api/constants/CustomBlendingEquations',
      DrawModes: '/docs/#api/constants/DrawModes',
      Materials: '/docs/#api/constants/Materials',
      Renderer: '/docs/#api/constants/Renderer',
      Textures: '/docs/#api/constants/Textures',
      BufferAttribute: '/docs/#api/core/BufferAttribute',
      BufferGeometry: '/docs/#api/core/BufferGeometry',
      Clock: '/docs/#api/core/Clock',
      DirectGeometry: '/docs/#api/core/DirectGeometry',
      EventDispatcher: '/docs/#api/core/EventDispatcher',
      Face3: '/docs/#api/core/Face3',
      InstancedBufferAttribute: '/docs/#api/core/InstancedBufferAttribute',
      InstancedBufferGeometry: '/docs/#api/core/InstancedBufferGeometry',
      InstancedInterleavedBuffer: '/docs/#api/core/InstancedInterleavedBuffer',
      InterleavedBuffer: '/docs/#api/core/InterleavedBuffer',
      InterleavedBufferAttribute: '/docs/#api/core/InterleavedBufferAttribute',
      Layers: '/docs/#api/core/Layers',
      Object3D: '/docs/#api/core/Object3D',
      Raycaster: '/docs/#api/core/Raycaster',
      Uniform: '/docs/#api/core/Uniform',
      BufferAttributeTypes: '/docs/#api/core/bufferAttributeTypes/BufferAttributeTypes',
      Earcut: '/docs/#api/extras/Earcut',
      ShapeUtils: '/docs/#api/extras/ShapeUtils',
      Curve: '/docs/#api/extras/core/Curve',
      CurvePath: '/docs/#api/extras/core/CurvePath',
      Font: '/docs/#api/extras/core/Font',
      Interpolations: '/docs/#api/extras/core/Interpolations',
      Path: '/docs/#api/extras/core/Path',
      Shape: '/docs/#api/extras/core/Shape',
      ShapePath: '/docs/#api/extras/core/ShapePath',
      ArcCurve: '/docs/#api/extras/curves/ArcCurve',
      CatmullRomCurve3: '/docs/#api/extras/curves/CatmullRomCurve3',
      CubicBezierCurve: '/docs/#api/extras/curves/CubicBezierCurve',
      CubicBezierCurve3: '/docs/#api/extras/curves/CubicBezierCurve3',
      EllipseCurve: '/docs/#api/extras/curves/EllipseCurve',
      LineCurve: '/docs/#api/extras/curves/LineCurve',
      LineCurve3: '/docs/#api/extras/curves/LineCurve3',
      QuadraticBezierCurve: '/docs/#api/extras/curves/QuadraticBezierCurve',
      QuadraticBezierCurve3: '/docs/#api/extras/curves/QuadraticBezierCurve3',
      SplineCurve: '/docs/#api/extras/curves/SplineCurve',
      ImmediateRenderObject: '/docs/#api/extras/objects/ImmediateRenderObject',
      BoxGeometry: '/docs/#api/geometries/BoxGeometry',
      CircleGeometry: '/docs/#api/geometries/CircleGeometry',
      ConeGeometry: '/docs/#api/geometries/ConeGeometry',
      CylinderGeometry: '/docs/#api/geometries/CylinderGeometry',
      DodecahedronGeometry: '/docs/#api/geometries/DodecahedronGeometry',
      EdgesGeometry: '/docs/#api/geometries/EdgesGeometry',
      ExtrudeGeometry: '/docs/#api/geometries/ExtrudeGeometry',
      IcosahedronGeometry: '/docs/#api/geometries/IcosahedronGeometry',
      LatheGeometry: '/docs/#api/geometries/LatheGeometry',
      OctahedronGeometry: '/docs/#api/geometries/OctahedronGeometry',
      ParametricGeometry: '/docs/#api/geometries/ParametricGeometry',
      PlaneGeometry: '/docs/#api/geometries/PlaneGeometry',
      PolyhedronGeometry: '/docs/#api/geometries/PolyhedronGeometry',
      RingGeometry: '/docs/#api/geometries/RingGeometry',
      ShapeGeometry: '/docs/#api/geometries/ShapeGeometry',
      SphereGeometry: '/docs/#api/geometries/SphereGeometry',
      TetrahedronGeometry: '/docs/#api/geometries/TetrahedronGeometry',
      TextGeometry: '/docs/#api/geometries/TextGeometry',
      TorusGeometry: '/docs/#api/geometries/TorusGeometry',
      TorusKnotGeometry: '/docs/#api/geometries/TorusKnotGeometry',
      TubeGeometry: '/docs/#api/geometries/TubeGeometry',
      WireframeGeometry: '/docs/#api/geometries/WireframeGeometry',
      ArrowHelper: '/docs/#api/helpers/ArrowHelper',
      AxesHelper: '/docs/#api/helpers/AxesHelper',
      BoxHelper: '/docs/#api/helpers/BoxHelper',
      Box3Helper: '/docs/#api/helpers/Box3Helper',
      CameraHelper: '/docs/#api/helpers/CameraHelper',
      DirectionalLightHelper: '/docs/#api/helpers/DirectionalLightHelper',
      FaceNormalsHelper: '/docs/#api/helpers/FaceNormalsHelper',
      GridHelper: '/docs/#api/helpers/GridHelper',
      PolarGridHelper: '/docs/#api/helpers/PolarGridHelper',
      HemisphereLightHelper: '/docs/#api/helpers/HemisphereLightHelper',
      PlaneHelper: '/docs/#api/helpers/PlaneHelper',
      PointLightHelper: '/docs/#api/helpers/PointLightHelper',
      RectAreaLightHelper: '/docs/#api/helpers/RectAreaLightHelper',
      SkeletonHelper: '/docs/#api/helpers/SkeletonHelper',
      SpotLightHelper: '/docs/#api/helpers/SpotLightHelper',
      VertexNormalsHelper: '/docs/#api/helpers/VertexNormalsHelper',
      AmbientLight: '/docs/#api/lights/AmbientLight',
      DirectionalLight: '/docs/#api/lights/DirectionalLight',
      HemisphereLight: '/docs/#api/lights/HemisphereLight',
      Light: '/docs/#api/lights/Light',
      PointLight: '/docs/#api/lights/PointLight',
      RectAreaLight: '/docs/#api/lights/RectAreaLight',
      SpotLight: '/docs/#api/lights/SpotLight',
      DirectionalLightShadow: '/docs/#api/lights/shadows/DirectionalLightShadow',
      LightShadow: '/docs/#api/lights/shadows/LightShadow',
      SpotLightShadow: '/docs/#api/lights/shadows/SpotLightShadow',
      AnimationLoader: '/docs/#api/loaders/AnimationLoader',
      AudioLoader: '/docs/#api/loaders/AudioLoader',
      BufferGeometryLoader: '/docs/#api/loaders/BufferGeometryLoader',
      Cache: '/docs/#api/loaders/Cache',
      CompressedTextureLoader: '/docs/#api/loaders/CompressedTextureLoader',
      CubeTextureLoader: '/docs/#api/loaders/CubeTextureLoader',
      DataTextureLoader: '/docs/#api/loaders/DataTextureLoader',
      FileLoader: '/docs/#api/loaders/FileLoader',
      FontLoader: '/docs/#api/loaders/FontLoader',
      ImageBitmapLoader: '/docs/#api/loaders/ImageBitmapLoader',
      ImageLoader: '/docs/#api/loaders/ImageLoader',
      JSONLoader: '/docs/#api/loaders/JSONLoader',
      Loader: '/docs/#api/loaders/Loader',
      LoaderUtils: '/docs/#api/loaders/LoaderUtils',
      MaterialLoader: '/docs/#api/loaders/MaterialLoader',
      ObjectLoader: '/docs/#api/loaders/ObjectLoader',
      TextureLoader: '/docs/#api/loaders/TextureLoader',
      DefaultLoadingManager: '/docs/#api/loaders/managers/DefaultLoadingManager',
      LoadingManager: '/docs/#api/loaders/managers/LoadingManager',
      LineBasicMaterial: '/docs/#api/materials/LineBasicMaterial',
      LineDashedMaterial: '/docs/#api/materials/LineDashedMaterial',
      Material: '/docs/#api/materials/Material',
      MeshBasicMaterial: '/docs/#api/materials/MeshBasicMaterial',
      MeshDepthMaterial: '/docs/#api/materials/MeshDepthMaterial',
      MeshLambertMaterial: '/docs/#api/materials/MeshLambertMaterial',
      MeshNormalMaterial: '/docs/#api/materials/MeshNormalMaterial',
      MeshPhongMaterial: '/docs/#api/materials/MeshPhongMaterial',
      MeshPhysicalMaterial: '/docs/#api/materials/MeshPhysicalMaterial',
      MeshStandardMaterial: '/docs/#api/materials/MeshStandardMaterial',
      MeshToonMaterial: '/docs/#api/materials/MeshToonMaterial',
      PointsMaterial: '/docs/#api/materials/PointsMaterial',
      RawShaderMaterial: '/docs/#api/materials/RawShaderMaterial',
      ShaderMaterial: '/docs/#api/materials/ShaderMaterial',
      ShadowMaterial: '/docs/#api/materials/ShadowMaterial',
      SpriteMaterial: '/docs/#api/materials/SpriteMaterial',
      Box2: '/docs/#api/math/Box2',
      Box3: '/docs/#api/math/Box3',
      Color: '/docs/#api/math/Color',
      Cylindrical: '/docs/#api/math/Cylindrical',
      Euler: '/docs/#api/math/Euler',
      Frustum: '/docs/#api/math/Frustum',
      Interpolant: '/docs/#api/math/Interpolant',
      Line3: '/docs/#api/math/Line3',
      Math: '/docs/#api/math/Math',
      Matrix3: '/docs/#api/math/Matrix3',
      Matrix4: '/docs/#api/math/Matrix4',
      Plane: '/docs/#api/math/Plane',
      Quaternion: '/docs/#api/math/Quaternion',
      Ray: '/docs/#api/math/Ray',
      Sphere: '/docs/#api/math/Sphere',
      Spherical: '/docs/#api/math/Spherical',
      Triangle: '/docs/#api/math/Triangle',
      Vector2: '/docs/#api/math/Vector2',
      Vector3: '/docs/#api/math/Vector3',
      Vector4: '/docs/#api/math/Vector4',
      CubicInterpolant: '/docs/#api/math/interpolants/CubicInterpolant',
      DiscreteInterpolant: '/docs/#api/math/interpolants/DiscreteInterpolant',
      LinearInterpolant: '/docs/#api/math/interpolants/LinearInterpolant',
      QuaternionLinearInterpolant: '/docs/#api/math/interpolants/QuaternionLinearInterpolant',
      Bone: '/docs/#api/objects/Bone',
      Group: '/docs/#api/objects/Group',
      Line: '/docs/#api/objects/Line',
      LineLoop: '/docs/#api/objects/LineLoop',
      LineSegments: '/docs/#api/objects/LineSegments',
      LOD: '/docs/#api/objects/LOD',
      Mesh: '/docs/#api/objects/Mesh',
      Points: '/docs/#api/objects/Points',
      Skeleton: '/docs/#api/objects/Skeleton',
      SkinnedMesh: '/docs/#api/objects/SkinnedMesh',
      Sprite: '/docs/#api/objects/Sprite',
      WebGLRenderer: '/docs/#api/renderers/WebGLRenderer',
      WebGLRenderTarget: '/docs/#api/renderers/WebGLRenderTarget',
      WebGLCubeRenderTarget: '/docs/#api/renderers/WebGLCubeRenderTarget',
      ShaderChunk: '/docs/#api/renderers/shaders/ShaderChunk',
      ShaderLib: '/docs/#api/renderers/shaders/ShaderLib',
      UniformsLib: '/docs/#api/renderers/shaders/UniformsLib',
      UniformsUtils: '/docs/#api/renderers/shaders/UniformsUtils',
      Fog: '/docs/#api/scenes/Fog',
      FogExp2: '/docs/#api/scenes/FogExp2',
      Scene: '/docs/#api/scenes/Scene',
      CanvasTexture: '/docs/#api/textures/CanvasTexture',
      CompressedTexture: '/docs/#api/textures/CompressedTexture',
      CubeTexture: '/docs/#api/textures/CubeTexture',
      DataTexture: '/docs/#api/textures/DataTexture',
      DepthTexture: '/docs/#api/textures/DepthTexture',
      Texture: '/docs/#api/textures/Texture',
      VideoTexture: '/docs/#api/textures/VideoTexture',
      CCDIKSolver: '/docs/#examples/animations/CCDIKSolver',
      MMDAnimationHelper: '/docs/#examples/animations/MMDAnimationHelper',
      MMDPhysics: '/docs/#examples/animations/MMDPhysics',
      OrbitControls: '/docs/#examples/controls/OrbitControls',
      ConvexGeometry: '/docs/#examples/geometries/ConvexGeometry',
      DecalGeometry: '/docs/#examples/geometries/DecalGeometry',
      BabylonLoader: '/docs/#examples/loaders/BabylonLoader',
      GLTFLoader: '/docs/#examples/loaders/GLTFLoader',
      MMDLoader: '/docs/#examples/loaders/MMDLoader',
      MTLLoader: '/docs/#examples/loaders/MTLLoader',
      OBJLoader: '/docs/#examples/loaders/OBJLoader',
      OBJLoader2: '/docs/#examples/loaders/OBJLoader2',
      LoaderSupport: '/docs/#examples/loaders/LoaderSupport',
      PCDLoader: '/docs/#examples/loaders/PCDLoader',
      PDBLoader: '/docs/#examples/loaders/PDBLoader',
      SVGLoader: '/docs/#examples/loaders/SVGLoader',
      TGALoader: '/docs/#examples/loaders/TGALoader',
      PRWMLoader: '/docs/#examples/loaders/PRWMLoader',
      Lensflare: '/docs/#examples/objects/Lensflare',
      GLTFExporter: '/docs/#examples/exporters/GLTFExporter',
    });

    function getKeywordLink(keyword) {
      const dotNdx = keyword.indexOf('.');
      if (dotNdx) {
        const before = keyword.substring(0, dotNdx);
        const link = codeKeywordLinks[before];
        if (link) {
          return `${link}.${keyword.substr(dotNdx + 1)}`;
        }
      }
      return keyword.startsWith('THREE.')
        ? codeKeywordLinks[keyword.substring(6)]
        : codeKeywordLinks[keyword];
    }

    $('code').filter(function() {
      return getKeywordLink(this.textContent) &&
             this.parentElement.nodeName !== 'A';
    }).wrap(function() {
      const a = document.createElement('a');
      a.href = getKeywordLink(this.textContent);
      return a;
    });

    const methodPropertyRE = /^(\w+)\.(\w+)$/;
    const classRE = /^(\w+)$/;
    $('a').each(function() {
      const href = this.getAttribute('href');
      if (!href) {
        return;
      }
      const m = methodPropertyRE.exec(href);
      if (m) {
        const codeKeywordLink = getKeywordLink(m[1]);
        if (codeKeywordLink) {
          this.setAttribute('href', `${codeKeywordLink}#${m[2]}`);
        }
      } else if (classRE.test(href)) {
        const codeKeywordLink = getKeywordLink(href);
        if (codeKeywordLink) {
          this.setAttribute('href', codeKeywordLink);
        }
      }
    });

    $('pre>code')
      .unwrap()
      .replaceWith(function() {
        return $(`<pre class="prettyprint showlinemods notranslate ${this.className || ''}" translate="no">${this.innerHTML}</pre>`);
      });

    return dom.serialize();
  }

  const buildSettings = {
    outDir: '../three.js/manual',
    baseUrl: 'https://threejs.org',
    rootFolder: 'threejs',
    lessonFolder: 'threejs/lessons',
    lessonGrep: 'threejs*.md',
    siteName: 'three',
    siteThumbnail: 'https://threejs.org/files/share.png',  // in rootFolder/lessons/resources
    templatePath: 'build/templates',
    owner: 'gfxfundamentals',
    repo: 'threejsfundamentals',
    postHTMLFn: fixThreeJSLinks,
  };

  // just the hackiest way to get this working.
  grunt.registerMultiTask('buildlesson', 'build a lesson', function() {
    const filenames = new Set();
    this.files.forEach((files) => {
      files.src.forEach((filename) => {
        filenames.add(filename);
      });
    });
    const buildStuff = require('./build/build.js');
    const settings = {...buildSettings, filenames};
    const finish = this.async();
    buildStuff(settings).finally(finish);
  });

  grunt.registerTask('buildlessons', function() {
    const buildStuff = require('./build/build.js');
    const finish = this.async();
    buildStuff(buildSettings).finally(finish);
  });

  grunt.task.registerMultiTask('fixthreepaths', 'fix three paths', function() {
    const options = this.options({});
    const oldVersionRE = new RegExp(`/${options.oldVersionStr}/`, 'g');
    const newVersionReplacement = `/${options.newVersionStr}/`;
    this.files.forEach((files) => {
      files.src.forEach((filename) => {
        const oldContent = fs.readFileSync(filename, {encoding: 'utf8'});
        const newContent = oldContent.replace(oldVersionRE, newVersionReplacement);
        if (oldContent !== newContent) {
          grunt.log.writeln(`updating ${filename} to ${options.newVersionStr}`);
          fs.writeFileSync(filename, newContent);
        }
      });
    });
  });

  grunt.registerTask('bumpthree', function() {
    const lessonInfo = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));
    const oldVersion = lessonInfo.threejsfundamentals.threeVersion;
    const oldVersionStr = `r${oldVersion}`;
    const threePath = '../three.js'; //path.dirname(path.dirname(require.resolve('three')));
    const threeInfo = JSON.parse(fs.readFileSync(path.join(threePath, 'package.json'), {encoding: 'utf8'}));
    const newVersion = semver.minor(threeInfo.version);
    const newVersionStr = `r${newVersion}`;
    const basePath = path.join('threejs', 'resources', 'threejs', newVersionStr);
    grunt.config.merge({
      copy: {
        threejs: {
          files: [
            { expand: true, cwd: `${threePath}/build/`, src: 'three.js', dest: `${basePath}/build/`, },
            { expand: true, cwd: `${threePath}/build/`, src: 'three.min.js', dest: `${basePath}/build/`, },
            { expand: true, cwd: `${threePath}/build/`, src: 'three.module.js', dest: `${basePath}/build/`, },
            { expand: true, cwd: `${threePath}/examples/js/`, src: '**', dest: `${basePath}/examples/js/`, },
            { expand: true, cwd: `${threePath}/examples/jsm/`, src: '**', dest: `${basePath}/examples/jsm/`, },
          ],
        },
      },
      fixthreepaths: {
        options: {
          oldVersionStr,
          newVersionStr,
        },
        src: [
          'threejs/**/*.html',
          'threejs/**/*.md',
          'threejs/**/*.js',
          '!threejs/resources/threejs/**',
        ],
      },
    });

    lessonInfo.threejsfundamentals.threeVersion = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(lessonInfo, null, 2));
    grunt.task.run(['copy:threejs', 'fixthreepaths']);
  });

  grunt.registerTask('build', ['clean', 'copy:main', 'buildlessons']);
  grunt.registerTask('buildwatch', ['build', 'watch']);

  grunt.registerTask('default', ['eslint', 'build']);
};

