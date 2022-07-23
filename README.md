## NOTE: The contents of this repo has been moved to [https://github.com/mrdoob/three.js/tree/dev/manual](https://github.com/mrdoob/three.js/tree/dev/manual)

```







































































```


Three.js Fundamentals
=====================

This is [a series of lessons or tutorials about three.js](http://threejsfundamentals.org/).

This is work in progress. Feel free to contribute, especially localizations

## Contributing

Of course bug fixes are always welcome.

If you'd like to write a new article please try to always take
one step at a time. Don't do 2 or more things in a single step.
Explain any new math in the simplest terms possible. Ideally
with diagrams where possible. Also it's probably best to
ask to make sure someone else isn't already working on a similar
article.

## Article notes

A code word in a paragraph, as in

```md
A `BoxGeometry` makes a box.
```

Will get automatically turned into a link to the THREE.js docs
if the word happens to be one of the names in the three.js library.
Similarly adding a `.property` as in

```md
Use `Material.opacity` to set the opacity level.
```

Will get turned into a link to the three.js `Material` docs
with an hash to `opacity`.

The link itself will also be checked similarly so for example

```md
We can set the color by hsl using [material.setHSL(hue, saturation, level)](MeshBasicMaterial.setHSL) and
passing in values from 0 to 1 for each of `hue`, `saturation` and `level`.
```

The `[stuff](Material.setHSL)` will get turned into a link to the docs

### Translating

Each translation goes in a folder under `threejs/lessons/<country-code>`.

Required files are

    langinfo.hanson
    index.md
    toc.html
    lang.css (optional)

#### `langinfo.hanson`

Defines various language specific options.
[Hanson](https://github.com/timjansen/hanson) is a JSON like format but allows comments.

Current fields are

    {
      // The language (will show up in the language selection menu)
      language: 'English',

      // Phrase that appears under examples
      defaultExampleCaption: "click here to open in a separate window",

      // Title that appears on each page
      title: 'Three Fundamentals',

      // Basic description that appears on each page
      description: 'Learn Three.js',

      // Link to the language root.
      link: 'http://threejsfundamentals.org/threejs/lessons/ja',  // replace `ja` with country code

      // html that appears after the article and before the comments
      commentSectionHeader: `
        <div>
           <a href="https://github.com/gfxfundamentals/threejsfundamentals/issues/new?assignees=&labels=suggested+topic&template=suggest-topic.md&title=%5BSUGGESTION%5D">Suggestion</a>?
           <a href="https://github.com/gfxfundamentals/threejsfundamentals/issues/new?assignees=&labels=&template=request.md&title=">Request</a>?
           <a href="https://github.com/gfxfundamentals/threejsfundamentals/issues/new?assignees=&labels=bug+%2F+issue&template=bug-issue-report.md&title=">Issue</a>?
           <a href="https://github.com/gfxfundamentals/threejsfundamentals/issues/new?assignees=&labels=bug+%2F+issue&template=bug-issue-report.md&title=">Bug</a>?
        </div>
        <div class="lesson-comment-notes">
           Use <b>&lt;pre&gt;&lt;code&gt;</b>code goes here<b>&lt;/code&gt;&lt;/pre&gt;</b> for code blocks
        </div>
      `,

      // markdown that appears for untranslated articles
      missing: "Sorry this article has not been translated yet. [Translations Welcome](https://github.com/gfxfundamentals/threejsfundamentals)! 😄\n\n[Here's the original English article for now]({{{origLink}}}).",

      // html that appear at the top right
      contribTemplate: 'Thank you <a href="${html_url}"><img src="${avatar_url}"> ${login}</a><br>for <a href="https://github.com/${owner}/${repo}/commits?author=${login}">${contributions} contributions</a>',

      // translations by id currently used for warning
      translations: {
        // Used when some small portion of a larger article is out of date
        badTranslation: 'Sorry, the translation of this area is out of date. <a href="{{packageJSON.homepage}}/blob/master/{{contentFileName}}">Please consider helping to fix it</a>.',

        // Used at the top of the article when it needs a new translation.
        updateNeeded: 'The translation of this article is out of date. <a href="{{packageJSON.homepage}}/blob/master/{{contentFileName}}">Please consider helping to fix it</a>.',
      },

      // the phrase "Table of Contents"
      toc: "Table of Contents",

      // translation of categories
      categoryMapping: {
        'basics': 'Basics',
        'solutions:' 'Solutions',
        'webvr': 'WebVR',
        'optimization': 'Optimization',
        'tips': 'Tips',
        'fundamentals': 'Fundamentals',
        'reference': 'Reference',
      },

    }

#### `index.md`

Template for the main page for each language

#### `toc.html`

Template for the table of contents for the language.
It is included on both the index and at the bottom of each article. 
Links are not auto-generated which are located at the bottom, and can be translated if needed.
The build system will create a placeholder for every English article for which there is no corresponding article in that language. 
It will be filled with the `missing` message from above.

#### `lang.css`

Included if and only if it exists. I'd strongly prefer not to have to
use it. In particular I don't want people to get into arguments about fonts
but basically it's a way to choose the fonts per language. You should only set
the variables that are absolutely needed. Example

```css
/* lessons/kr/lang.css */

/* Only comment in overrides as absolutely necessary! */
:root {
  --article-font-family: "best font for korean article text";
  --headline-font-family: "best font for korean headlines";
  /* a block of code */
  /* --code-block-font-family: "Lucida Console", Monaco, monospace; */
  /* a word in a sentence */
  /* --code-font-family: monospace; */
}
```

Notice 2 settings are not changed. It seems unlikely to me that code would
need a different font per language.

PS: While we're here, I love code fonts with ligatures but they seem like a bad
idea for a tutorial site because the ligatures hide the actual characters needed
so please don't ask for or use a ligature code font here.

#### Translation notes

The build process will make a placeholder html file for each article has an English .md file in
`threejs/lessons` but no corresponding .md file for the non-English language. This is to make it easy to include
links in one article that links to another article but that other article has not yet been translated.
This way you don't have to go back and fix already translated articles. Just translate one article
at a time and leave the links as is. They'll link to placeholders until someone translates the missing
articles.

Articles have front matter at the top

```
Title: Localized Title of article
Description: Localized description of article (used in RSS and social media tags)
TOC: Localized text for Table of Contents
```

**DO NOT CHANGE LINKS** : For example a link to a local resources might look like

    [text](link)

or

    <img src="somelink">

While you can add query parameters (see below) do not add "../" to try to make the link relative to the
.md file. Links should stay as though the article exists at the same location as the original English.

### To build

The site is built into the `out` folder

Steps

    git clone https://github.com/gfxfundamentals/threejsfundamentals.git
    cd threejsfundamentals
    npm install
    npm run build
    npm start

now open your browser to `http://localhost:8080`

#### Continuous build

You can run `npm run watch` to get continuous building.
Also `npm run watch-no-check` to skip the dependency check.
Only the article .md files and files that are normally copied are supported.
The table of contents, templates, and index pages are not watched.

#### Building without checking for dependencies

By default the build checks if there are new dependencies but sometimes it
fails. You can try building without checking for dependencies with
`npm run build-ci`

#### Building just the lessons

The normal build copies all the required static files to the `out` folder
and then builds the lessons. If the required files are already in the out folder you can
skip that step and just build the lessons with `npm run buildlessons`

#### Building just one article

Generally you should use the continuous build above but you can also build
individual articles by setting the `ARTICLE_FILTER` environment variable.
Example: MacOS/Linux

```bash
ARTICLE_FILTER=scenegraph npm run buildlessons
```

On Windows

```bat
set ARTICLE_FILTER=scenegraph
npm run buildlessons
```

## Maintenance

See [Maintenance](MAINTENANCE.md)
