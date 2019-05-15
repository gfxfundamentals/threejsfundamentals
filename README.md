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

### Translating

Each translation goes in a folder under `threejs/lessons/<country-code>`.

Required files are

    langinfo.hanson
    index.md
    toc.html

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
      commentSectionHeader: '<div>Questions? <a href="http://stackoverflow.com/questions/tagged/three.js">Ask on stackoverflow</a>.</div>\n        <div>Issue/Bug? <a href="http://github.com/greggman/threefundamentals/issues">Create an issue on github</a>.</div>',

      // markdown that appears for untranslated articles
      missing: "Sorry this article has not been translated yet. [Translations Welcome](https://github.com/greggman/threejsfundamentals)! 😄\n\n[Here's the original English article for now]({{{origLink}}}).",

      // the phrase "Table of Contents"
      toc: "Table of Contents",
    }

#### `index.md`

This is the template for the main page for each language

#### `toc.html`

This is the table of contents for the language. It is included on both the index
and on each article. It's up to if you want to link to English articles for non-translated articles.
The build system will create a placeholder for every English article for which there is no
corresponding article in that langauge. It will be filled the `missing` message from above.

#### Translation notes

The build process will make a placeholder html file for each article has an english .md file in
`threejs/lessons` but no corresponding .md file for the language. This is to make it easy to include
links in one article that links to another article but that other article has not yet been translated.
This way you don't have to go back and fix already translated articles. Just translate one article
at a time and leave the links as is. They'll link to placeholders until someone translates the missing
articles.

### To build

The site is built into the `out` folder

Steps

    git clone https://github.com/greggman/threejsfundamentals.git
    npm install
    npm run build
    npm start

now open your browser to `http://localhost:8080`

### Continuous build

You can run `npm run watch` to get continuous building.
Only the article .md files and files that are normally copied are supported.
The table of contents, templates, and index pages are not watched.
