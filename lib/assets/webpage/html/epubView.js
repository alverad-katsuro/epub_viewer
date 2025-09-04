var book = ePub();
var rendition;
var displayed;
var chapters = []



function loadBook(data, cfi, manager, flow, spread, snap, allowScriptedContent, direction, useCustomSwipe, backgroundColor, foregroundColor) {
  var viewportHeight = window.innerHeight;
  document.getElementById('viewer').style.height = viewportHeight;
  var uint8Array = new Uint8Array(data)
  book.open(uint8Array,)
  rendition = book.renderTo("viewer", {
    manager: manager,
    flow: flow,
    // method: "continuous",
    spread: spread,
    width: "100vw",
    height: "100vh",
    snap: snap && !useCustomSwipe,
    allowScriptedContent: allowScriptedContent,
    defaultDirection: direction
  });

  if (cfi) {
    displayed = rendition.display(cfi)
  } else {
    displayed = rendition.display()
  }

  displayed.then(function (renderer) {
    console.log("displayed")
    window.flutter_inappwebview.callHandler('displayed');
  });

  book.loaded.navigation.then(function (toc) {
    chapters = parseChapters(toc)
    window.flutter_inappwebview.callHandler('chapters');
  })

  rendition.on("rendered", function (section, view) {
    window.flutter_inappwebview.callHandler('rendered');

    var doc = view.document;

    addClickHandler(doc, book);
  })

  ///text selection callback
  rendition.on("selected", function (cfiRange, contents) {
    book.getRange(cfiRange).then(function (range) {
      var selectedText = range.toString();
      var args = [cfiRange.toString(), selectedText]
      window.flutter_inappwebview.callHandler('selection', ...args);
    })
  });

  //book location changes callback
  rendition.on("relocated", function (location) {
    var percent = location.start.percentage;
    // var percentage = Math.floor(percent * 100);
    var location = {
      startCfi: location.start.cfi,
      endCfi: location.end.cfi,
      progress: percent
    }
    var args = [location]
    window.flutter_inappwebview.callHandler('relocated', ...args);
  });

  rendition.on('displayError', function (e) {
    console.log("displayError")
    window.flutter_inappwebview.callHandler('displayError');
  })

  rendition.on('markClicked', function (cfiRange) {
    console.log("markClicked")
    var args = [cfiRange.toString()]
    window.flutter_inappwebview.callHandler('markClicked', ...args);
  })

  book.ready.then(function () {
    book.locations.generate(1600)
  })

  rendition.hooks.content.register((contents) => {

    if (useCustomSwipe) {
      const el = contents.document.documentElement;

      if (el) {
        // console.log('EPUB_TEST_HOOK_IF')
        detectSwipe(el, function (el, direction) {
          // console.log("EPUB_TEST_DIR"+direction.toString())

          if (direction == 'l') {
            rendition.next()
          }
          if (direction == 'r') {
            rendition.prev()
          }
        });
      }
    }
  });

  //set background and foreground color
  updateTheme(backgroundColor, foregroundColor);


}

window.addEventListener("flutterInAppWebViewPlatformReady", function (event) {
  window.flutter_inappwebview.callHandler('readyToLoad');
});

//move to next page
function next() {
  rendition.next()
}

//move to previous page
function previous() {
  rendition.prev()
}

//move to given cfi location
function toCfi(cfi) {
  rendition.display(cfi)
}

//get all chapters
function getChapters() {
  return chapters;
}


function addClickHandler(document, book) {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', async function (e) {
      // Previne o comportamento padrão do clique, se necessário
      e.preventDefault();

      try {
        // 1. Pega a URL completa da imagem clicada (ex: blob:http://.../path/to/image.jpg)
        const blobUrl = this.src;
        console.log(book.resources)

        // 2. Usa o construtor URL do navegador para parsear a URL facilmente.
        const url = new URL(blobUrl);

        // 3. O caminho que precisamos está no 'pathname'. Ele vem com uma '/' no início, que removemos.
        // Ex: url.pathname será "/OEBPS/images/capa.jpg"
        const imagePathInEpub = url.pathname;

        console.log("Caminho extraído da URL:", imagePathInEpub);

        // 4. Agora usamos o caminho correto com book.archive para obter o Base64.
        // O segundo argumento "base64" garante que o retorno seja nesse formato.
        const base64 = await book.archive.getBase64(imagePathInEpub, "image/jpeg");

        if (base64) {
          console.log("Base64 da imagem obtido com sucesso!");
          console.log("data:image/jpeg;base64," + base64.substring(0, 100) + "...");


          window.flutter_inappwebview.callHandler('imageClickHandler', 'data:image/jpeg;base64,' + base64);
        } else {
          console.error("Não foi possível carregar o conteúdo do arquivo:", imagePathInEpub);
        }

      } catch (error) {
        console.error("Ocorreu um erro ao processar a imagem:", error);
      }
    });
  });

}

function imageClickHandler() {
  console.log("CLIQUEI NA IMAGEM???????????????????");


  return "aaaa";
}



async function getBookInfo() {
  const metadata = book.package.metadata;
  metadata['coverImage'] = book.cover;
  console.log("getBookInfo", await book.coverUrl());
  return metadata;
}

function getCurrentLocation() {
  var percent = rendition.location.start.percentage;
  // var percentage = Math.floor(percent * 100);
  var location = {
    startCfi: rendition.location.start.cfi,
    endCfi: rendition.location.end.cfi,
    progress: percent
  }
  return location;
}

///parsing chapters and subitems recursively
var parseChapters = function (toc) {
  var chapters = []
  toc.forEach(function (chapter) {
    chapters.push({
      title: chapter.label,
      href: chapter.href,
      id: chapter.id,
      subitems: parseChapters(chapter.subitems)
    })
  })
  return chapters;
}

function searchInBook(query) {
  search(query).then(function (data) {
    var args = [data]
    window.flutter_inappwebview.callHandler('search', ...args);
  })
}


// adds highlight with given color
function addHighlight(cfiRange, color, opacity) {
  rendition.annotations.highlight(cfiRange, {}, (e) => {
    // console.log("highlight clicked", e.target);
  }, "hl", { "fill": color, "fill-opacity": '0.3', "mix-blend-mode": "multiply" });
}

function addUnderLine(cfiString) {
  rendition.annotations.underline(cfiString)
}

function addMark(cfiString) {
  rendition.annotations.mark(cfiString)
}

function removeHighlight(cfiString) {
  rendition.annotations.remove(cfiString, "highlight");
}

function removeUnderLine(cfiString) {
  rendition.annotations.remove(cfiString, "underline");
}

function removeMark(cfiString) {
  rendition.annotations.remove(cfiString, "mark");
}

function toProgress(progress) {
  var cfi = book.locations.cfiFromPercentage(progress);
  rendition.display(cfi);
}


function search(q) {
  return Promise.all(
    book.spine.spineItems.map(item => item.load(book.load.bind(book)).then(item.find.bind(item, q)).finally(item.unload.bind(item)))
  ).then(results => Promise.resolve([].concat.apply([], results)));
};

function setFontSize(fontSize) {
  rendition.themes.default({
    p: {
      // "margin": '10px',
      "font-size": `${fontSize}px`
    }
  });
}

function setSpread(spread) {
  rendition.spread(spread);
}

function setFlow(flow) {
  rendition.flow(flow);
}

function setManager(manager) {
  rendition.manager(manager);
}

function setFontSize(fontSize) {
  rendition.themes.fontSize(`${fontSize}px`);
}

//get current page text
function getCurrentPageText() {
  var startCfi = rendition.location.start.cfi
  var endCfi = rendition.location.end.cfi
  var cfiRange = makeRangeCfi(startCfi, endCfi)
  book.getRange(cfiRange).then(function (range) {
    var text = range.toString();
    var args = [text, cfiRange]
    window.flutter_inappwebview.callHandler('epubText', ...args);
  })
}

//get text from a range
function getTextFromCfi(startCfi, endCfi) {
  var cfiRange = makeRangeCfi(startCfi, endCfi)
  book.getRange(cfiRange).then(function (range) {
    var text = range.toString();
    var args = [text, cfiRange]
    window.flutter_inappwebview.callHandler('epubText', ...args);
  })
}

///update theme
function updateTheme(backgroundColor, foregroundColor) {
  if (backgroundColor && foregroundColor) {
    rendition.themes.register("dark", { "body": { "background": backgroundColor, "color": foregroundColor } });
    rendition.themes.select("dark");
  }
}

const makeRangeCfi = (a, b) => {
  const CFI = new ePub.CFI()
  const start = CFI.parse(a), end = CFI.parse(b)
  const cfi = {
    range: true,
    base: start.base,
    path: {
      steps: [],
      terminal: null
    },
    start: start.path,
    end: end.path
  }
  const len = cfi.start.steps.length
  for (let i = 0; i < len; i++) {
    if (CFI.equalStep(cfi.start.steps[i], cfi.end.steps[i])) {
      if (i == len - 1) {
        // Last step is equal, check terminals
        if (cfi.start.terminal === cfi.end.terminal) {
          // CFI's are equal
          cfi.path.steps.push(cfi.start.steps[i])
          // Not a range
          cfi.range = false
        }
      } else cfi.path.steps.push(cfi.start.steps[i])
    } else break
  }
  cfi.start.steps = cfi.start.steps.slice(cfi.path.steps.length)
  cfi.end.steps = cfi.end.steps.slice(cfi.path.steps.length)

  return 'epubcfi(' + CFI.segmentString(cfi.base)
    + '!' + CFI.segmentString(cfi.path)
    + ',' + CFI.segmentString(cfi.start)
    + ',' + CFI.segmentString(cfi.end)
    + ')'
}

function detectSwipe(el, func) {
  swipe_det = new Object();
  swipe_det.sX = 0;
  swipe_det.sY = 0;
  swipe_det.eX = 0;
  swipe_det.eY = 0;
  var min_x = 50;  //min x swipe for horizontal swipe
  var max_x = 40;  //max x difference for vertical swipe
  var min_y = 40;  //min y swipe for vertical swipe
  var max_y = 50;  //max y difference for horizontal swipe
  var direc = "";
  ele = el
  ele.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    swipe_det.sX = t.screenX;
    swipe_det.sY = t.screenY;
  }, false);
  ele.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var t = e.touches[0];
    swipe_det.eX = t.screenX;
    swipe_det.eY = t.screenY;
  }, false);
  ele.addEventListener('touchend', function (e) {
    //horizontal detection
    if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX)) && ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y)))) {
      if (swipe_det.eX > swipe_det.sX) direc = "r";
      else direc = "l";
    }
    //vertical detection
    if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY)) && ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x)))) {
      if (swipe_det.eY > swipe_det.sY) direc = "d";
      else direc = "u";
    }

    if (direc != "") {
      if (typeof func == 'function') func(el, direc);
    }
    direc = "";
  }, false);
}