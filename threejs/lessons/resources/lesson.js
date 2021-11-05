// Licensed under a BSD license. See license.html for license
/* eslint-disable strict */
'use strict';  // eslint-disable-line

(function(){

  if (window.frameElement) {
    // in iframe
    const re = /^(\/(?:manual|docs\/#?\w+))\/(\w\w|\w\w_\w\w)\/(.*?)$/;
    document.querySelectorAll('a').forEach(a => {
      // fix the links but only if not target = blank?
      a.addEventListener('click', e => {
        // same origin?
        if (a.origin === window.location.origin) {
          // is manual?
          const m = re.exec(`${a.pathname}${a.search}${a.hash}`);
          if (m) {
            // is article? This is hacky because both of these are valid paths.
            // https://threejs.org/manual/en/foo.html
            // https://threejs.org/manual/examples/foo.html
            // langs are either xx or xx_xx so our regular expression matches xx or xx_xx
            // Note: not currently checking for docs, docs/api, etc....
            const [,base, lang, path] = m;
            const url = `${a.origin}${base}/${lang}/${path}`;
            e.preventDefault();
            window.parent.setUrl(url);
          }
        }
      });
      window.parent.setTitle(document.title);
    });

  } else {
    if (window.location.protocol !== 'file:') {
      const re = /^(.*?\/manual\/)(.*?)$/;
      const [,baseURL, articlePath] = re.exec(window.location.href);
      const href = `${baseURL}#${articlePath.replace('.html', '')}`;
      window.location.replace(href);
    }
  }

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