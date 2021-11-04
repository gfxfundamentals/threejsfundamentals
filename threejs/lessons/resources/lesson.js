// Licensed under a BSD license. See license.html for license
/* eslint-disable strict */
'use strict';  // eslint-disable-line

(function(){

  if (window.prettyPrint) {
    window.prettyPrint();
  }

  // help translation sites not translate code samples
  document.querySelectorAll('span[class=com]').forEach(elem => {
    elem.classList.add('translate', 'yestranslate');
    elem.setAttribute('translate', 'yes');
  });

  if (window.threejsLessonUtils) {
    window.threejsLessonUtils.afterPrettify();
  }

}());

// ios needs this to allow touch events in an iframe
window.addEventListener('touchstart', {});