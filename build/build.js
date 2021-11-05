/* global module require process __dirname */
/* eslint no-undef: "error" */

/*

This entire file is one giant hack and really needs to be cleaned up!

*/

'use strict';

const requiredNodeVersion = 12;
if (parseInt((/^v(\d+)\./).exec(process.version)[1]) < requiredNodeVersion) {
  throw Error(`requires at least node: ${requiredNodeVersion}`);
}

module.exports = function(settings) { // wrapper in case we're in module_context mode

const hackyProcessSelectFiles = settings.filenames !== undefined;

const cache      = new (require('inmemfilecache'))();
const fs         = require('fs');
const glob       = require('glob');
const Handlebars = require('handlebars');
const hanson     = require('hanson');
const marked     = require('marked');
const path       = require('path');
const sitemap    = require('sitemap');
const utils      = require('./utils');
const util       = require('util');
const moment     = require('moment');
const url        = require('url');
const colors     = require('ansi-colors');
const colorSupport = require('color-support');
const g_cacheid = Date.now();
const packageJSON = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));

colors.enabled = colorSupport.hasBasic;

const g_errors = [];
function error(...args) {
  g_errors.push([...args].join(' '));
  console.error(colors.red(...args));  // eslint-disable-line no-console
}

const g_warnings = [];
function warn(...args) {
  g_warnings.push([...args].join(' '));
  console.warn(colors.yellow(...args));  // eslint-disable-line no-console
}

function log(...args) {
  console.log(...args);  // eslint-disable-line no-console
}

let numErrors = 0;
function failError(...args) {
  ++numErrors;
  error(...args);
}

const executeP = util.promisify(utils.execute);

marked.setOptions({
  rawHtml: true,
  //pedantic: true,
});

function applyObject(src, dst) {
  Object.keys(src).forEach(function(key) {
    dst[key] = src[key];
  });
  return dst;
}

function mergeObjects() {
  const merged = {};
  Array.prototype.slice.call(arguments).forEach(function(src) {
    applyObject(src, merged);
  });
  return merged;
}

function readFile(fileName) {
  try {
    return cache.readFileSync(fileName, 'utf-8');
  } catch (e) {
    error('could not read:', fileName);
    throw e;
  }
}

function readHANSON(fileName) {
  const text = readFile(fileName);
  try {
    return hanson.parse(text);
  } catch (e) {
    throw new Error(`can not parse: ${fileName}: ${e}`);
  }
}

function writeFileIfChanged(fileName, content) {
  if (fs.existsSync(fileName)) {
    const old = readFile(fileName);
    if (content === old) {
      return;
    }
  }
  fs.writeFileSync(fileName, content);
  console.log('Wrote: ' + fileName);  // eslint-disable-line
}

function copyFile(src, dst) {
  writeFileIfChanged(dst, readFile(src));
}

function replaceParams(str, params) {
  const template = Handlebars.compile(str);
  if (Array.isArray(params)) {
    params = mergeObjects.apply(null, params.slice().reverse());
  }

  return template(params);
}

function encodeParams(params) {
  const values = Object.values(params).filter(v => v);
  if (!values.length) {
    return '';
  }
  return '&' + Object.entries(params).map((kv) => {
    return `${encodeURIComponent(kv[0])}=${encodeURIComponent(kv[1])}`;
  }).join('&');
}

function encodeQuery(query) {
  if (!query) {
    return '';
  }
  return '?' + query.split('&').map(function(pair) {
    return pair.split('=').map(function(kv) {
      return encodeURIComponent(decodeURIComponent(kv));
    }).join('=');
  }).join('&');
}

function encodeUrl(src) {
  const u = url.parse(src);
  u.search = encodeQuery(u.query);
  return url.format(u);
}

function TemplateManager() {
  const templates = {};

  this.apply = function(filename, params) {
    let template = templates[filename];
    if (!template) {
      template = Handlebars.compile(readFile(filename));
      templates[filename] = template;
    }

    if (Array.isArray(params)) {
      params = mergeObjects.apply(null, params.slice().reverse());
    }

    return template(params);
  };

  this.applyString = function(string, params) {
    let template = templates[string];
    if (!template) {
      template = Handlebars.compile(string);
      templates[string] = template;
    }

    if (Array.isArray(params)) {
      params = mergeObjects.apply(null, params.slice().reverse());
    }

    return template(params);
  };
}

const templateManager = new TemplateManager();

Handlebars.registerHelper('include', function(filename, options) {
  let context;
  if (options && options.hash && options.hash.filename) {
    const varName = options.hash.filename;
    filename = options.data.root[varName];
    context = {...options.data.root, ...options.hash};
  } else {
    context = options.data.root;
  }
  return templateManager.apply(filename, context);
});

Handlebars.registerHelper('ifexists', function(options) {
  const filename = path.join(process.cwd(), replaceParams(options.hash.filename, options.hash));
  const exists = fs.existsSync(filename);
  if (exists) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('example', function(options) {
  options.hash.width   = options.hash.width  ? 'width:  ' + options.hash.width  + 'px;' : '';
  options.hash.height  = options.hash.height ? 'height: ' + options.hash.height + 'px;' : '';
  options.hash.caption = options.hash.caption || options.data.root.defaultExampleCaption;
  options.hash.examplePath = options.data.root.examplePath;
  const url = path.basename(options.hash.url)
  options.hash.encodedUrl = encodeURIComponent(encodeUrl(url));
  options.hash.url = encodeUrl(url);
  options.hash.cacheid = g_cacheid;
  options.hash.params = encodeParams({
    startPane: options.hash.startPane,
  });
  return templateManager.apply('build/templates/example.template', options.hash);
});

function getTranslation(root, msgId) {
  const lang = root.lang;
  const translations = root.translations;
  const origTranslations = root.origLangInfo.translations;
  let str = translations[msgId];
  if (!str) {
    warn(`missing ${lang} translation for msgId: ${msgId}`);
    str = origTranslations[msgId];
    translations[msgId] = str;
  }
  return str;
}

Handlebars.registerHelper('warning', function(options) {
  const root = options.data.root;
  const link = options.hash.link || `${root.packageJSON.homepage}}/blob/master/{$root.contentFileName}`;
  const translation = getTranslation(root, options.hash.msgId);
  const msg = templateManager.applyString(translation, {...root, link});
  const data = {
    ...root,
    msg,
  };
  const str = templateManager.apply('build/templates/warning.template', data);
  return str;
});

function getProperty(obj, propSpec) {
  const parts = propSpec.split('.');
  let data = obj;
  for (const part of parts) {
    if (!Object.prototype.hasOwnProperty.call(data, part)) {
      return undefined;
    }
    data = data[part];
  }
  return data;
}

function getPropertyOr(obj, propSpecs) {
  const specs = propSpecs.split(',');
  for (const spec of specs) {
    const value = getProperty(obj, spec);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

// lets you insert build time data but stringified
// const foo = {{{stringify names="langInfo"}}};
// const title = {{{stringify names="langInfo.title"}}};
// const title = {{{stringify names="langInfo.title,originalLangInfo.title"}}};
Handlebars.registerHelper('stringify', function(options) {
  const data = getPropertyOr(options.data.root, options.hash.names);
  if (data === undefined) {
    throw new Error(`no property '${options.hash.names}' for {{{stringify}}}`);
  }
  return JSON.stringify(data, null, 2);
});

Handlebars.registerHelper('diagram', function(options) {

  options.hash.width  = options.hash.width || '400';
  options.hash.height = options.hash.height || '300';
  options.hash.examplePath = options.data.root.examplePath;
  options.hash.className = options.hash.className || '';
  options.hash.url = encodeUrl(options.hash.url);

  return templateManager.apply('build/templates/diagram.template', options.hash);
});

Handlebars.registerHelper('image', function(options) {

  options.hash.examplePath = options.data.root.examplePath;
  options.hash.className = options.hash.className || '';
  options.hash.caption = options.hash.caption || undefined;

  if (options.hash.url.substring(0, 4) === 'http') {
    options.hash.examplePath = '';
  }

  return templateManager.apply('build/templates/image.template', options.hash);
});

Handlebars.registerHelper('selected', function(options) {
  const key = options.hash.key;
  const value = options.hash.value;
  const re = options.hash.re;
  const sub = options.hash.sub;

  const a = this[key];
  let b = options.data.root[value];

  if (re) {
    const r = new RegExp(re);
    b = b.replace(r, sub);
  }

  return a === b ? 'selected' : '';
});

function slashify(s) {
  return s.replace(/\\/g, '/');
}

function articleFilter(f) {
  if (hackyProcessSelectFiles) {
    if (!settings.filenames.has(f)) {
      return false;
    }
  }
  return !process.env['ARTICLE_FILTER'] || f.indexOf(process.env['ARTICLE_FILTER']) >= 0;
}


const readDirs = function(dirPath) {
  const dirsOnly = function(filename) {
    const stat = fs.statSync(filename);
    return stat.isDirectory();
  };

  const addPath = function(filename) {
    return path.join(dirPath, filename);
  };

  return fs.readdirSync(`${settings.rootFolder}/lessons`)
      .map(addPath)
      .filter(dirsOnly);
};

const isLangFolder = function(dirname) {
  const filename = path.join(dirname, 'langinfo.hanson');
  return fs.existsSync(filename);
};


const pathToLang = function(filename) {
  const lang = path.basename(filename);
  const lessonBase = `${settings.rootFolder}`;
  const lessons = `${lessonBase}/${lang}`;
  return {
    lang,
    toc: `${settings.rootFolder}/${lang}/toc.html`,
    lessonsDstPath: `${settings.outDir}/${lang === 'kr' ? 'ko' : lang}`,
    lessonsSrcPath: `${settings.lessonFolder}/${lang}`,
    template: 'build/templates/lesson.template',
    examplePath: `${settings.rootFolder}/examples/`,
    home: `/${lessons}/`,
  };
};

let g_langs = [
  // English is special (sorry it's where I started)
  {
    template: 'build/templates/lesson.template',
    lessonsDstPath: `${settings.outDir}/en`,
    lessonsSrcPath: `${settings.lessonFolder}`,
    lang: 'en',
    toc: `${settings.rootFolder}/en/toc.html`,
    examplePath: `/${settings.rootFolder}/examples/`,
    home: '/',
  },
];

g_langs = g_langs.concat(readDirs(`${settings.rootFolder}/lessons`)
    .filter(isLangFolder)
    .map(pathToLang));

const extractHeader = (function() {
  const headerRE = /([A-Z0-9_-]+): (.*?)$/i;

  return function(content) {
    const metaData = { };
    const lines = content.split('\n');
    for (;;) {
      const line = lines[0].trim();
      const m = headerRE.exec(line);
      if (!m) {
        break;
      }
      metaData[m[1].toLowerCase()] = m[2];
      lines.shift();
    }
    return {
      content: lines.join('\n'),
      headers: metaData,
    };
  };
}());

const parseMD = function(content) {
  return extractHeader(content);
};

const loadMD = function(contentFileName) {
  const content = cache.readFileSync(contentFileName, 'utf-8');
  const data = parseMD(content);
  data.link = contentFileName.replace(/\\/g, '/').replace(/\.md$/, '.html');
  data.headers.title = (data.headers.title || data.headers.titre).replace(/three\.js[, ]*/i, '');
  return data;
};

function loadFiles(filenames) {
  const byFilename = {};
  filenames.forEach((fileName) => {
    const data = loadMD(fileName);
    byFilename[path.basename(fileName)] = data;
  });
  return byFilename;
}

const Builder = function(outBaseDir, options) {

  const g_articlesByLang = {};
  let g_articles = [];
  let g_langInfo;
  let g_originalLangInfo;
  const g_langDB = {};
  const g_outBaseDir = outBaseDir;
  const g_origPath = options.origPath;

  const toc = readHANSON('toc.hanson');

  // These are the english articles.
  const g_allOriginalArticlesFullPath = glob.sync(path.join(g_origPath, '*.md'))
      .filter(a => !a.endsWith('index.md'));
  const g_origArticles = g_allOriginalArticlesFullPath
      .map(a => path.basename(a))
      .filter(articleFilter);

  const g_originalByFileName = loadFiles(g_allOriginalArticlesFullPath);

  function extractHandlebars(content) {
    const tripleRE = /\{\{\{.*?\}\}\}/g;
    const doubleRE = /\{\{\{.*?\}\}\}/g;

    let numExtractions = 0;
    const extractions = {
    };

    function saveHandlebar(match) {
      const id = '==HANDLEBARS_ID_' + (++numExtractions) + '==';
      extractions[id] = match;
      return id;
    }

    content = content.replace(tripleRE, saveHandlebar);
    content = content.replace(doubleRE, saveHandlebar);

    return {
      content: content,
      extractions: extractions,
    };
  }

  function insertHandlebars(info, content) {
    const handlebarRE = /==HANDLEBARS_ID_\d+==/g;

    function restoreHandlebar(match) {
      const value = info.extractions[match];
      if (value === undefined) {
        throw new Error('no match restoring handlebar for: ' + match);
      }
      return value;
    }

    content = content.replace(handlebarRE, restoreHandlebar);

    return content;
  }

  function isSameDomain(url, pageUrl) {
    const fdq1 = new URL(pageUrl);
    const fdq2 = new URL(url, pageUrl);
    return fdq1.origin === fdq2.origin;
  }

  function getUrlPath(url) {
    // yes, this is a hack
    const q = url.indexOf('?');
    return q >= 0 ? url.substring(0, q) : url;
  }

  // Try top fix relative links. This *should* only
  // happen in translations
  const iframeLinkRE = /(<iframe[\s\S]*?\s+src=")(.*?)(")/g;
  const imgLinkRE = /(<img[\s\S]*?\s+src=")(.*?)(")/g;
  const aLinkRE = /(<a[^>]*?\s+href=")(.*?)(")/g;
  const mdLinkRE = /(\[[\s\S]*?\]\()(.*?)(\))/g;
  const handlebarLinkRE = /({{{.*?\s+url=")(.*?)(")/g;
  const scriptLinkRE = /(<script[\s\S]*?\s+src=")(.*?)(")/g;
  const linkRE = /(<link[\s\S]*?\s+href=")(.*?)(")/g;
  const linkREs = [
    iframeLinkRE,
    imgLinkRE,
    aLinkRE,
    mdLinkRE,
    handlebarLinkRE,
    scriptLinkRE,
    linkRE,
  ];
  function hackRelLinks(content, pageUrl/*, contentFileName*/) {
    //const basedir = path.dirname(contentFileName);
    // console.log('---> pageUrl:', pageUrl);
    function fixRelLink(m, prefix, url, suffix) {
      if (isSameDomain(url, pageUrl)) {
        // a link that starts with "../" should be "../../" if it's in a translation
        // a link that starts with "resources" should be "../resources" if it's in a translation
        //const testName = path.join(basedir, url);
        //if (!fs.existsSync(testName)) {
          if (url.startsWith('../') ||
              url.startsWith('resources')) {
            // console.log('  url:', url);
            //return `${prefix}../${url}${suffix}`;
            return `${prefix}${url}${suffix}`;
          }
        //}
      }
      return m;
    }

    return content
        .replace(imgLinkRE, fixRelLink)
        .replace(aLinkRE, fixRelLink)
        .replace(iframeLinkRE, fixRelLink)
        .replace(scriptLinkRE, fixRelLink)
        .replace(linkRE, fixRelLink);
  }

  /**
   * Get all the local urls based on a regex that has <prefix><url><suffix>
   */
  function getUrls(regex, str) {
    const links = new Set();
    let m;
    do {
      m = regex.exec(str);
      if (m  && m[2][0] !== '#' && isSameDomain(m[2], 'http://example.com/a/b/c/d')) {
        links.add(getUrlPath(m[2]));
      }
    } while (m);
    return links;
  }

  /**
   * Get all the local links in content
   */
  function getLinks(content) {
    return new Set(linkREs.map(re => [...getUrls(re, content)]).flat());
  }

  function fixUrls(regex, content, origLinks) {
    return content.replace(regex, (m, prefix, url, suffix) => {
      const q = url.indexOf('?');
      const urlPath = q >= 0 ? url.substring(0, q) : url;
      const urlQuery = q >= 0 ? url.substring(q) : '';
      if (!origLinks.has(urlPath) &&
          isSameDomain(urlPath, 'https://foo.com/a/b/c/d.html') &&
          !(/\/..\/^/.test(urlPath)) &&   // hacky test for link to main page. Example /webgl/lessons/ja/
          urlPath[0] !== '#') {  // test for same page anchor -- bad test :(
        for (const origLink of origLinks) {
          if (urlPath.endsWith(origLink)) {
            const newUrl = `${origLink}${urlQuery}`;
            log('  fixing:', url, 'to', newUrl);
            return `${prefix}${newUrl}${suffix}`;
          }
        }
        failError('could not fix:', url);
      }
      return m;
    });
  }

  const applyTemplateToContent = async function(templatePath, contentFileName, outFileName, opt_extra, data) {
    // Call prep's Content which parses the HTML. This helps us find missing tags
    // should probably call something else.
    //Convert(md_content)
    outFileName = outFileName.replace('threejs-', '');
    const relativeOutName = slashify(outFileName).substring(g_outBaseDir.length);
    const pageUrl = `${settings.baseUrl}${relativeOutName}`;
    const metaData = data.headers;
    const content = data.content;
    //console.log(JSON.stringify(metaData, undefined, '  '));
    const info = extractHandlebars(content);
    let html = marked(info.content);
    // HACK! :-(
    // There's probably a way to do this in marked
    html = html.replace(/<pre><code/g, '<pre class="prettyprint notranslate" translate="no"><code');
    html = html.replace(/<code>/g, '<code class="notranslate" translate="no">');
    // HACK! :-(
    if (opt_extra && opt_extra.home && opt_extra.home.length > 1) {
      html = hackRelLinks(html, pageUrl, contentFileName);
    }
    html = insertHandlebars(info, html);
    html = replaceParams(html, [
      opt_extra,
      g_langInfo,
      {
        origLangInfo: g_originalLangInfo,
        contentFileName,
        packageJSON,
      },
    ]);
    const pathRE = new RegExp(`^\\/${settings.rootFolder}\\/lessons\\/$`);
    const langs = Object.keys(g_langDB).map((name) => {
      const lang = g_langDB[name];
      const url = slashify(path.join(lang.basePath, path.basename(outFileName)))
         .replace('index.html', '')
         .replace(pathRE, '/');
      return {
        lang: lang.lang,
        language: lang.language,
        url: url,
      };
    });
    metaData['content'] = html;
    metaData['langs'] = langs;
    metaData['src_file_name'] = slashify(contentFileName);
    metaData['dst_file_name'] = relativeOutName;
    metaData['basedir'] = '';
    metaData['toc'] = opt_extra.toc;
    metaData['tocHtml'] = g_langInfo.tocHtml;
    metaData['templateOptions'] = opt_extra.templateOptions;
    metaData['langInfo'] = g_langInfo;
    metaData['originalLangInfo'] = g_originalLangInfo;
    metaData['url'] = pageUrl;
    metaData['settings'] = settings;
    metaData['relUrl'] = relativeOutName;
    let output = templateManager.apply(templatePath, metaData);
    if (settings.postHTMLFn) {
      output = settings.postHTMLFn(output);
    }
    writeFileIfChanged(outFileName, output);

    return metaData;
  };

  const applyTemplateToFile = async function(templatePath, contentFileName, outFileName, opt_extra) {
    console.log('processing: ', contentFileName);  // eslint-disable-line
    opt_extra = opt_extra || {};
    const data = loadMD(contentFileName);
    const metaData = await applyTemplateToContent(templatePath, contentFileName, outFileName, opt_extra, data);
    g_articles.push(metaData);
  };

  const applyTemplateToFiles = async function(templatePath, filesSpec, extra) {
    const allFiles = glob
        .sync(filesSpec)
        .sort();
    const files = allFiles.filter(articleFilter);
    const byFilename = loadFiles(allFiles);

    function getLocalizedCategory(category) {
      const localizedCategory = g_langInfo.categoryMapping[category];
      if (localizedCategory) {
        return localizedCategory;
      }
      warn(`no localization for category: ${category} in langinfo.hanson file for ${extra.lang}`);
      const categoryName = g_originalLangInfo.categoryMapping[category];
      if (!categoryName) {
        throw new Error(`no English mapping for category: ${category} in langinfo.hanson file for english`);
      }
      return categoryName;
    }

    function addLangToLink(link) {
      return extra.lang === 'en'
        ? link
        : `${path.dirname(link)}/${extra.lang}/${path.basename(link)}`;
    }

    function tocLink(t, fileName) {
      let data = byFilename[fileName];
      let link;
      if (data) {
        link = data.headers.link || data.link;
      } else {
        // no translation
        data = g_originalByFileName[fileName];
        link = data.headers.link || addLangToLink(data.link);
      }
      const toc = data.headers.toc || data.headers.title;
      if (toc === '#') {
        [...data.content.matchAll(/<a\s*id="(.*?)"\s*data-toc="(.*?)"\s*><\/a>/g)].forEach(([, id, title]) => {
          const hashLink = `${link}#${id}`;
          t[title] = hashLink;
        });
        return
      }
      return t[toc] = link;
    }

    function makeToc(toc) {
      const t = {};
      Object.entries(toc).forEach(([category, files]) => {
        const localizedCategory = getLocalizedCategory(category);
        let tt;
        if (Array.isArray(files)) {
          tt = {};
          files.forEach(file => tocLink(tt, file));
        } else {
          tt = makeToc(files);
        }
        if (Object.keys(tt).length) {
          t[localizedCategory] = tt;
        }
      });
      return t;
    }

    g_langInfo.tocJson = makeToc(toc);
    /*
    g_langInfo.carousel = JSON.stringify([...g_langInfo.tocHtml.matchAll(/<a href="(.*?)"/g)]
      .filter(m => !m[1].includes('#'))
      .map((m, ndx) => {
        return {
          '@type': 'ListItem',
          'position': ndx + 1,
          'url': `${settings.baseUrl}${m[1]}`,
        };
      }), null, 2);
      */

    const langBaseDir = path.join(outBaseDir, g_langInfo.langCode);
    if (!fs.existsSync(langBaseDir)) {
      fs.mkdirSync(langBaseDir);
    }

    for (const fileName of files) {
      const ext = path.extname(fileName);
      if (!byFilename[path.basename(fileName)]) {
        if (!hackyProcessSelectFiles) {
          throw new Error(`${fileName} is not in toc.hanson`);
        }
        warn(fileName, 'is not in toc.hanson');
      }

      const tempFN = path.basename(fileName);
      const baseName = path.basename(tempFN.substr(0, tempFN.length - ext.length));
      const outFileName = path.join(langBaseDir, baseName + '.html');

      await applyTemplateToFile(templatePath, fileName, outFileName, extra);
    }

  };

  const addArticleByLang = function(article, lang) {
    const filename = path.basename(article.dst_file_name);
    let articleInfo = g_articlesByLang[filename];
    const url = `${settings.baseUrl}${article.dst_file_name}`;
    if (!articleInfo) {
      articleInfo = {
        url: url,
        changefreq: 'monthly',
        links: [],
      };
      g_articlesByLang[filename] = articleInfo;
    }
    articleInfo.links.push({
      url: url,
      lang: lang,
    });
  };

  const getLanguageSelection = function(lang) {
    const lessons = lang.lessonsSrcPath;
    const langInfo = readHANSON(path.join(lessons, 'langinfo.hanson'));
    langInfo.langCode = langInfo.langCode || lang.lang;
    langInfo.baseDirname = lang.lang;
    langInfo.home = lang.home;
    langInfo.translations = langInfo.translations || {};
    g_langDB[lang.lang] = {
      lang: lang.lang,
      language: langInfo.language,
      basePath: '/' + lang.lessonsDstPath,
      langInfo: langInfo,
    };
  };

  this.preProcess = function(langs) {
    langs.forEach(getLanguageSelection);
    g_originalLangInfo = g_langDB['en'].langInfo;
  };

  this.process = async function(options) {
    console.log('Processing Lang: ' + options.lang);  // eslint-disable-line
    g_articles = [];
    g_langInfo = g_langDB[options.lang].langInfo;

    await applyTemplateToFiles(options.template, path.join(options.lessonsSrcPath, settings.lessonGrep), options);

    const articlesFilenames = g_articles.map(a => path.basename(a.src_file_name));

    function linkIsIndex(link) {
      const base = `/${settings.rootFolder}/lessons/`;
      const index = `${base}${options.lang}`;
      const indexSlash = `${index}/`;
      //console.log(index, indexSlash);
      return link === index || link === indexSlash || link === base;
    }

    // should do this first was easier to add here
    /*
    if (options.lang !== 'en') {
      const existing = g_origArticles.filter(name => articlesFilenames.indexOf(name) >= 0);
      existing.forEach((name) => {
        //const origMdFilename = path.join(g_origPath, name);
        const transMdFilename = path.join(g_origPath, options.lang, name);

        const ext = path.extname(name);
        const baseName = name.substr(0, name.length - ext.length);
        const originHTMLFilename = path.join(outBaseDir, g_langDB.en.basePath, baseName + '.html');
        const transHTMLFilename = path.join(outBaseDir, options.lessons, baseName + '.html');

        const origLinks = getLinks(readFile(originHTMLFilename));
        const transLinks = getLinks(fs.readFileSync(transHTMLFilename, {encoding: 'utf8'}));

        if (process.env['ARTICLE_VERBOSE']) {
          log('---[', transMdFilename, ']---');
          log('origLinks: ---\n   ', [...origLinks].join('\n    '));
          log('transLinks: ---\n   ', [...transLinks].join('\n    '));
        }

        let show = true;
        transLinks.forEach((link) => {
          link = link
              .replace(`${options.lang}/`, '')
              .replace(/^..\//, '');
          if (!origLinks.has(link)) {
            if (linkIsIndex(link)) {
              return;
            }
            if (show) {
              show = false;
              failError('---[', transMdFilename, ']---');
            }
            failError(`   link:[${link}] not found in English file`);
          }
        });

        if (!show && process.env['ARTICLE_FIX']) {
          // there was an error, try to auto-fix
          let fixedMd = fs.readFileSync(transMdFilename, {encoding: 'utf8'});
          linkREs.forEach((re) => {
            fixedMd = fixUrls(re, fixedMd, origLinks);
          });
          fs.writeFileSync(transMdFilename, fixedMd);
        }
      });
    }
    */

    if (hackyProcessSelectFiles) {
      return;
    }

    // generate place holders for non-translated files
    const missing = g_origArticles.filter(name => articlesFilenames.indexOf(name) < 0);
    for (const name of missing) {
      const ext = path.extname(name);
      const baseName = name.substr(0, name.length - ext.length).replace('threejs-', '');
      const outFileName = path.join(options.lessonsDstPath, baseName + '.html');
      const data = {...loadMD(path.join(g_origPath, name))};
      data.content = g_langInfo.missing;
      const extra = {
        origLink: '/manual/en/' + baseName + '.html',
        toc: options.toc,
      };
      console.log('  generating missing:', outFileName);  // eslint-disable-line
      await applyTemplateToContent(
          'build/templates/missing.template',
          path.join(options.lessonsSrcPath, 'langinfo.hanson'),
          outFileName,
          extra,
          data);
    }

    function utcMomentFromGitLog(result, filename, timeType) {
      const dateStr = result.stdout.split('\n')[0].trim();
      const utcDateStr = dateStr
        .replace(/"/g, '')   // WTF to these quotes come from!??!
        .replace(' ', 'T')
        .replace(' ', '')
        .replace(/(\d\d)$/, ':$1');
      const m = moment.utc(utcDateStr);
      if (m.isValid()) {
        return m;
      }
      const stat = fs.statSync(filename);
      return moment(stat[timeType]);
    }

    for (const article of g_articles) {
      {
        const result = await executeP('git', [
            'log',
            '--format="%ci"',
            '--name-only',
            '--diff-filter=A',
            article.src_file_name,
        ]);
        article.dateAdded = utcMomentFromGitLog(result, article.src_file_name, 'ctime');
      }
      {
        const result = await executeP('git', [
           'log',
           '--format="%ci"',
           '--name-only',
           '--max-count=1',
           article.src_file_name,
         ]);
        article.dateModified = utcMomentFromGitLog(result, article.src_file_name, 'mtime');
      }
    }

    let articles = g_articles.filter(function(article) {
      return article.dateAdded !== undefined;
    });
    articles = articles.sort(function(a, b) {
      return b.dateAdded - a.dateAdded;
    });

    // this used to insert a table of contents
    // but it was useless being auto-generated
    /*
    await applyTemplateToFile('build/templates/index.template', path.join(options.lessonsSrcPath, 'index.md'), path.join(options.lessonsDstPath, 'index.html'), {
      table_of_contents: '',
      templateOptions: g_langInfo,
      tocHtml: g_langInfo.tocHtml,
    });
    */
  };

  this.writeGlobalFiles = async function() {
    function fixTocLinks(toc) {
      for (const [key, value] of Object.entries(toc)) {
        if (typeof value === 'string') {
          const base = path.basename(value).replace('threejs-', '').replace('.html', '');
          let lang = path.basename(path.dirname(value));
          if (lang === 'kr') lang = 'ko';
          if (lang.length > 5) lang = 'en';
          toc[key] = `${lang}/${base}`;
        } else {
          fixTocLinks(value);
        }
      }
    }

    const toc = {};
    for (const lang of Object.values(g_langDB)) {
      toc[lang.langInfo.langCode] = {
        "manual": lang.langInfo.tocJson,
      };
    }
    fixTocLinks(toc);
    const outName = path.join(settings.outDir, 'list.json');
    writeFileIfChanged(outName, JSON.stringify(toc, null, '\t'));
  };
};

async function main() {
  const fetch = await import('node-fetch');

  const b = new Builder(settings.outDir, {
    origPath: `${settings.rootFolder}/lessons`,  // english articles
  });

  b.preProcess(g_langs);

  if (hackyProcessSelectFiles) {
    const langsInFilenames = new Set();
    [...settings.filenames].forEach((filename) => {
      const m = /lessons\/(\w{2}|\w{5})\//.exec(filename);
      const lang = m ? m[1] : 'en';
      langsInFilenames.add(lang);
    });
    g_langs = g_langs.filter(lang => langsInFilenames.has(lang.lang));
  }

  try {
    for (const lang of g_langs) {
      await b.process(lang);
    }
    if (!hackyProcessSelectFiles) {
      await b.writeGlobalFiles(g_langs);
    }

    g_warnings.slice().forEach(str => warn(str));
    g_errors.slice().forEach(str => error(str));
    if (numErrors) {
      throw new Error(`${numErrors} errors`);
    }
  } finally {
    cache.clear();
  }
}

return main();

};

