'use strict';

/* global importScripts, init, THREE */

importScripts('resources/threejs/r110/build/three.js'); 
importScripts('resources/threejs/r110/examples/js/controls/TrackballControls.js');
importScripts('shared-trackballcontrols-multiple-scenes.js');

function noop() {
}

class ElementProxyReceiver extends THREE.EventDispatcher {
  constructor() {
    super();
  }
  get clientWidth() {
    return this.width;
  }
  get clientHeight() {
    return this.height;
  }
  get pageXOffset() {
    return 0; // this should not be used
  }
  get pageYOffset() {
    return 0; // this should not be used
  }
  getBoundingClientRect() {
    return {
      left: this.left,
      top: this.top,
      width: this.width,
      height: this.height,
      right: this.left + this.width,
      bottom: this.top + this.height,
    };
  }
  get ownerDocument() {
    return {
      documentElement: self.document,
    };
  }
  handleEvent(data) {
    if (data.type === 'size') {
      this.left = data.left;
      this.top = data.top;
      this.width = data.width;
      this.height = data.height;
      return;
    }
    data.preventDefault = noop;
    data.stopPropagation = noop;
    this.dispatchEvent(data);
  }
  focus() {
    // no-op
  }
}

class ProxyManager {
  constructor() {
    this.targets = {};
    this.handleEvent = this.handleEvent.bind(this);
  }
  makeProxy(data) {
    const {id} = data;
    const proxy = new ElementProxyReceiver();
    this.targets[id] = proxy;
  }
  getProxy(id) {
    return this.targets[id];
  }
  handleEvent(data) {
    console.log(JSON.stringify(data));
    this.targets[data.id].handleEvent(data.data);
  }
}

const proxyManager = new ProxyManager();
let api;

function updateVisibleAreas(data) {
  api.updateVisibleSceneElements(data.visibleAreas);
}

function start(data) {
  const proxy = proxyManager.getProxy(data.canvasId);
  proxy.body = proxy;  // HACK!
  self.window = proxy;
  self.document = {
    addEventListener: proxy.addEventListener.bind(proxy),
    removeEventListener: proxy.removeEventListener.bind(proxy),
  };
  const sceneElementInfos = data.elemProxyInfos.map(({proxyId, id, sceneName}) => {
    return {
      elem: proxyManager.getProxy(proxyId),
      id,
      sceneName,
    };
  });
  api = init({
    canvas: data.canvas,
    inputElement: proxy,
    sceneElementInfos,
  });
}

function makeProxy(data) {
  proxyManager.makeProxy(data);
}

const handlers = {
  start,
  makeProxy,
  event: proxyManager.handleEvent,
  updateVisibleAreas,
};

self.onmessage = function(e) {
  const fn = handlers[e.data.type];
  if (!fn) {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};