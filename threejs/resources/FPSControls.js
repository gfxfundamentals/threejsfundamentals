/**
 * Heavily modified from FirstPersonControls.js from THREE.js
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

/* global THREE */
/* eslint strict: ["error", "function"] */

(function(root) {
  'use strict';

  const LEFT = 0;
  const RIGHT = 1;
  const UP = 2;
  const DOWN = 3;

  const directionInfo = [
    { on: 0x1, off: 0x2 },  // 0 LEFT
    { on: 0x2, off: 0x1 },  // 1 RIGHT
    { on: 0x4, off: 0x8 },  // 2 UP
    { on: 0x8, off: 0x4 },  // 3 DOWN
  ];

  const moveInfo = [
    { dir: new THREE.Vector3( 0,  0,  0), },  // 0 0
    { dir: new THREE.Vector3(-1,  0,  0), },  // 1 LEFT
    { dir: new THREE.Vector3( 1,  0,  0), },  // 2 RIGHT
    { dir: new THREE.Vector3( 0,  0,  0), },  // 3 RIGHT LEFT
    { dir: new THREE.Vector3( 0,  0, -1), },  // 4 UP
    { dir: new THREE.Vector3(-1,  0, -1), },  // 5 UP LEFT
    { dir: new THREE.Vector3( 1,  0, -1), },  // 6 UP RIGHT
    { dir: new THREE.Vector3(-1,  0, -1), },  // 7 UP RIGHT LEFT
    { dir: new THREE.Vector3( 0,  0,  1), },  // 8 DOWN
    { dir: new THREE.Vector3(-1,  0,  1), },  // 9 DOWN LEFT
    { dir: new THREE.Vector3( 1,  0,  1), },  // A DOWN RIGHT
    { dir: new THREE.Vector3( 0,  0,  1), },  // B DOWN RIGHT LEFT
    { dir: new THREE.Vector3( 0,  0,  0), },  // C DOWN UP
    { dir: new THREE.Vector3(-1,  0,  0), },  // D DOWN UP LEFT
    { dir: new THREE.Vector3( 1,  0,  0), },  // E DOWN UP RIGHT
    { dir: new THREE.Vector3( 0,  0,  0), },  // F DOWN UP RIGHT LEFT
  ];

  const keyMap = {
    '38': UP, /*up*/
    '87': UP, /*W*/
    '37': LEFT, /*left*/
    '65': LEFT, /*A*/
    '40': DOWN, /*down*/
    '83': DOWN, /*S*/
    '39': RIGHT, /*right*/
    '68': RIGHT, /*D*/
  };

  class FPSControls {  /* eslint no-unused-vars: "off" */
    constructor(object, domElement) {
      this.object = object;
      this.target = new THREE.Vector3(0, 0, 0);
      this.movement = new THREE.Vector3(0, 0, 0);
      this._keyHistory = [];

      this.domElement = (domElement !== undefined) ? domElement : document;

      this.enabled = true;
      this.move = true;

      this.movementSpeed = 1.0;
      this.lookSpeed = 0.005;

      this.lookVertical = true;
      this.autoForward = false;

      this.activeLook = true;

      this.constrainVertical = false;
      this.verticalMin = 0;
      this.verticalMax = Math.PI;

      this.autoSpeedFactor = 0.0;

      this.mouseX = 0;
      this.mouseY = 0;

      this.lat = 0;
      this.lon = 0;
      this.phi = 0;
      this.theta = 0;


      this.mouseDragOn = false;

      this.viewHalfX = 0;
      this.viewHalfY = 0;

      if (this.domElement !== document) {
        this.domElement.setAttribute('tabindex', -1);
      }

      this._binds = [];
      const on = (elem, event, fn, ...args) => {
        const boundFn = fn.bind(this);
        elem.addEventListener(event, boundFn, ...args);
        this._binds.push([elem, event, boundFn, ...args]);
      };

      on(this.domElement, 'contextmenu', this.contextmenu, false);
      on(this.domElement, 'mousemove', this.onMouseMove, false);
      on(this.domElement, 'mousedown', this.onMouseDown, false);
      on(this.domElement, 'mouseup', this.onMouseUp, false);

      on(window, 'keydown', this.onKeyDown, false);
      on(window, 'keyup', this.onKeyUp, false);

      this.handleResize();
    }
    handleResize() {
      if (this.domElement === document) {
        this.viewHalfX = window.innerWidth / 2;
        this.viewHalfY = window.innerHeight / 2;
      } else {
        this.viewHalfX = this.domElement.offsetWidth / 2;
        this.viewHalfY = this.domElement.offsetHeight / 2;
      }
    }
    onMouseDown(event) {
      if (this.domElement !== document) {
        this.domElement.focus();
      }

      event.preventDefault();
      event.stopPropagation();

      if (this.activeLook) {
        switch (event.button) {
          case 0: this.moveForward = true; break;
          case 2: this.moveBackward = true; break;
        }
      }

      this.mouseDragOn = true;
    }
    onMouseUp(event) {
      event.preventDefault();
      event.stopPropagation();

      if (this.activeLook) {
        switch (event.button) {
          case 0: this.moveForward = false; break;
          case 2: this.moveBackward = false; break;
        }
      }

      this.mouseDragOn = false;
    }
    onMouseMove(event) {
      if (this.domElement === document) {
        this.mouseX = event.pageX - this.viewHalfX;
        this.mouseY = event.pageY - this.viewHalfY;
      } else {
        this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
        this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
      }
    }
    onKeyDown(event) {
      const {keyCode} = event;
      if (keyMap[keyCode] !== undefined) {
        this.onKeyUp(event);  // remove the key if it happens to already be in the history
        this._keyHistory.push(keyCode);
      }
    }
    onKeyUp(event) {
      const {keyCode} = event;
      if (keyMap[keyCode] !== undefined) {
        const ndx = this._keyHistory.indexOf(keyCode);
        if (ndx >= 0) {
          this._keyHistory.splice(ndx, 1);
        }
      }
    }
    update(delta) {
      if (this.enabled === false) {
        return;
      }

      // Go over the array of keys oldest to newest
      // setting and unsetting direction bits.
      // This leaves us with the newest direction
      // so for example user does
      // left down, right down (shoud be going right)
      // right up (should now be going left)
      // 'a' down, left up (should still be going left)
      let dir = 0;
      for (const key of this._keyHistory) {
        const {on, off} = directionInfo[keyMap[key]];
        dir = dir & ~off | on;
      }

      const actualMoveSpeed = delta * this.movementSpeed;
      const direction = moveInfo[dir].dir;
      this.movement.copy(direction);
      // transform the movement into the camera orientation
      this.object.updateMatrixWorld();
      this.movement.transformDirection(this.object.matrixWorld);
      this.movement.y = 0;
      this.movement.normalize();
      this.movement.multiplyScalar(actualMoveSpeed);
      if (this.move) {
        this.object.position.add(this.movement);
      }

      let actualLookSpeed = delta * this.lookSpeed;

      if (!this.activeLook) {
        actualLookSpeed = 0;
      }

      let verticalLookRatio = 1;

      if (this.constrainVertical) {
        verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);
      }

      this.lon += this.mouseX * actualLookSpeed;
      if (this.lookVertical) {
        this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;
      }

      this.lat = Math.max(-85, Math.min(85, this.lat));
      this.phi = THREE.Math.degToRad(90 - this.lat);

      this.theta = THREE.Math.degToRad(this.lon);

      if (this.constrainVertical) {
        this.phi = THREE.Math.mapLinear(this.phi, 0, Math.PI, this.verticalMin, this.verticalMax);
      }

      const targetPosition = this.target;
      const position = this.object.position;

      targetPosition.x = position.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
      targetPosition.y = position.y + 100 * Math.cos(this.phi);
      targetPosition.z = position.z + 100 * Math.sin(this.phi) * Math.sin(this.theta);

      this.object.lookAt(targetPosition);

    }
    contextmenu(event) {
      event.preventDefault();
    }
    dispose() {
      this._binds.forEach((args) => {
        const elem = args.shift();
        elem.removeEventListener(...args);
      });
    }
  }

  root.FPSControls = FPSControls;
}(this));