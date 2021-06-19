Title: Three.js Kurulum
Description: Geliştirici ortamında three.js nasıl kurulur?
TOC: Kurulum

Bu makale, three.js hakkında bir dizi makaleden biridir.
İlk makale şuydu: [Three.js Temelleri Hakkında](threejs-fundamentals.html).
Henüz göz atmadıysanız, oradan başlamak isteyebilirsiniz.

Çok fazla ilerlemeden önce, bilgisayarında bir kaç ayarlama yapman gerekiyor.
Özellikle, güvenlik sebebiyle WebGL cannot use images from your hard drive directly.
That means in order to do development you need to use a web server. Fortunately
development web servers are super easy to setup and use.

Öncelikle, First off if you'd like you can download this entire site from [this link](https://github.com/gfxfundamentals/threejsfundamentals/archive/gh-pages.zip).
Once downloaded double click the zip file to unpack the files.

Next download one of these simple web servers.

If you'd prefer a web server with a user interface there's
[Servez](https://greggman.github.io/servez)

{{{image url="resources/servez.gif" className="border" }}}

Just point it at the folder where you unzipped the files, click "Start", then go to
in your browser [`http://localhost:8080/`](http://localhost:8080/) or if you'd
like to browse the samples go to [`http://localhost:8080/threejs`](http://localhost:8080/threejs).

To stop serving pick stop or quit Servez.

If you prefer the command line (I do), another way is to use [node.js](https://nodejs.org).
Download it, install it, then open a command prompt / console / terminal window. If you're on Windows the installer will add a special "Node Command Prompt" so use that.

Then install the [`servez`](https://github.com/greggman/servez-cli) by typing

    npm -g install servez

If you're on OSX use

    sudo npm -g install servez

Once you've done that type

    servez path/to/folder/where/you/unzipped/files

Or if you're like me

    cd path/to/folder/where/you/unzipped/files
    servez

It should print something like

{{{image url="resources/servez-response.png" }}}

Then in your browser go to [`http://localhost:8080/`](http://localhost:8080/).

If you don't specify a path then servez will serve the current folder.

If either of those options are not to your liking
[there are many other simple servers to choose from](https://stackoverflow.com/questions/12905426/what-is-a-faster-alternative-to-pythons-servez-or-simplehttpserver).

Now that you have a server setup we can move on to [textures](threejs-textures.html).
