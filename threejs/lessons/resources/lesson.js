// Licensed under a BSD license. See license.html for license
/* eslint-disable strict */
'use strict';  // eslint-disable-line

/* global jQuery */

(function($){

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

$(document).ready(function($){
  if (window.prettyPrint) {
    window.prettyPrint();
  }
  $('span[class=com]')
    .addClass('translate yestranslate')
    .attr('translate', 'yes');

  const params = getQueryParams();
  if (params.doubleSpace || params.doublespace) {
    document.body.className = document.body.className + ' doubleSpace';
  }

  $('.language').on('change', function() {
    window.location.href = this.value;
  });

  if (window.threejsLessonUtils) {
    window.threejsLessonUtils.afterPrettify();
  }
});
}(jQuery));

// ios needs this to allow touch events in an iframe
window.addEventListener('touchstart', {});