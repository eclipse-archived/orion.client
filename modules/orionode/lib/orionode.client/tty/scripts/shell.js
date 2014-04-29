require(["/socket.io/socket.io.js", "scripts/term.js", "/requirejs/domReady.js", "orion/PageUtil", "orion/fileClient", "orion/bootstrap"], 
    function(io, Terminal, onReady, PageUtil, FileClient, mBootstrap) {
  // default settings:
  
  var serviceRegistry, fileClient;


  onReady(function() {
    var socket;
    var resize = function(term, newWidth, newHeight) {
      if (socket == null) return;
      var el = term.element;
      var size = {
        x: el.clientWidth,
        y: el.clientHeight,
        cols: term.cols,
        rows: term.rows
      }
      var newRows = newHeight / Math.floor(size.y / size.rows)-1;
      var newCols = newWidth / Math.floor(size.x / size.cols)-1;

      term.resize(Math.floor(newCols), Math.floor(newRows));
      socket.emit('resize', Math.floor(newCols), Math.floor(newRows));
    };       

    var fitToDiv = function(term) {
      var termContainer = document.getElementById("terminalBox"),
        mainContainer = document.getElementById("mainNode"),
        termControls  = document.getElementById("terminalControl"),
        newWidth = mainContainer.clientWidth,
        newHeight = mainContainer.clientHeight;

      resize(term, newWidth, newHeight);
    };

    socket = io.connect('/tty');
    socket.on('connect', function() {
      socket.emit('start', getCWD());
    });
	
	var term;
    socket.on('ready', function() {
      term = new Terminal({
        cols: 80,
          rows: 24,
          useStyle: true,
          screenKeys: true,
      });
      
      
      term.on('data', function(data) {
        socket.emit('data', data);
      });

      term.on('title', function(title) {
        document.title = title;
      });
      var termContainer = document.getElementById("terminalBox");
      term.open(termContainer);
      
      fitToDiv(term);

      var oldResize = window.onresize;
      var timeout;
      window.onresize = function() {
        if (oldResize) { oldResize(); }
        clearTimeout(timeout);
        timeout = setTimeout(fitToDiv, 500, term);
      }
      socket.on('data', function(data) {
        term.write(data);
      });
      socket.on('disconnect', function() {
        term.destroy();
      });
    });

    var schemeButton = document.getElementById("color-scheme-dropdown");
    schemeButton.onchange = changeScheme;

    var wrenchButton = document.getElementById("menuWrench");
    wrenchButton.onclick = function() {
        var d = document.getElementById("dropdown");
        if (d.style.display == "block")
            d.style.display = "none";
        else
            d.style.display = "block";
    };
    
    function __changeScheme(schemeName) {
        if (term != null) {
            switch(schemeName) {
                case 'Dark':
                case 'Light':
                case 'Solarized':
                    term.colors[0] = '#073642';
                    term.colors[1] = '#dc322f';
                    term.colors[2] = '#859900';
                    term.colors[3] = '#b58900';
                    term.colors[4] = '#268bd2';
                    term.colors[5] = '#d33682';
                    term.colors[6] = '#2aa198';
                    term.colors[7] = '#eee8d5';
                    term.colors[8] = '#002b36';
                    term.colors[9] = '#cb4b16';
                    term.colors[10] = '#586e75';
                    term.colors[11] = '#657b83';
                    term.colors[12] = '#839496';
                    term.colors[13] = '#6c71c4';
                    term.colors[14] = '#93a1a1';
                    term.colors[15] = '#fdf6e3';
                    term.colors[256] = '#002b36';
                    term.colors[257] = '#fdf6e3';
                    break;
            }
        }
    }

    function changeScheme() {
        var t = document.getElementsByClassName('terminal');
        var schemeName = document.getElementById("color-scheme-dropdown").value;
        __changeScheme(schemeName)
    }
  });
  
	function getCWD() {
		var result = PageUtil.matchResourceParameters(window.location.href).resource;
		return result.length > 0 ? result : null;
	}

});
