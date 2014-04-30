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
                  var t = document.getElementsByClassName('terminal');
                  t[0].style.backgroundColor = "#000000";
                  t[0].style.color = "#fdf6e3";
                    term.colors[0] = '#000000';
                    term.colors[1] = '#dc322f';
                    term.colors[2] = '#859900';
                    term.colors[3] = '#b58900';
                    term.colors[4] = '#268bd2';
                    term.colors[5] = '#d33682';
                    term.colors[6] = '#2aa198';
                    term.colors[7] = '#eee8d5';
                    term.colors[8] = '#002b36';
                    term.colors[9] = '#cb4b16';
                    term.colors[10] = '#8AE234'; //Linux Tango - user@machine, shell scripts
                    term.colors[11] = '#FCE94F'; //Linux Tango - ~/location/
                    term.colors[12] = '#729FCF'; //Linux Tango - (git-branch)
                    term.colors[13] = '#AD7FA8'; //Linux Tango - images
                    term.colors[14] = '#3465A4'; //Linux Tango - javascript comments
                    term.colors[15] = '#fdf6e3';
                    term.colors[256] = '#000000';
                    term.colors[257] = '#fdf6e3';
                  break;
                case 'Light':
                  var t = document.getElementsByClassName('terminal');
                  t[0].style.backgroundColor = "#ffffff";
                  t[0].style.color = "#000000";
                    term.colors[0] = '#ffffff';
                    term.colors[1] = '#dc322f';
                    term.colors[2] = '#859900';
                    term.colors[3] = '#b58900';
                    term.colors[4] = '#268bd2';
                    term.colors[5] = '#d33682';
                    term.colors[6] = '#2aa198';
                    term.colors[7] = '#000000';
                    term.colors[8] = '#002b36';
                    term.colors[9] = '#cb4b16';
                    term.colors[10] = '#8AE234'; //Linux Tango - user@machine, shell scripts
                    term.colors[11] = '#FCE94F'; //Linux Tango - ~/location/
                    term.colors[12] = '#729FCF'; //Linux Tango - (git-branch)
                    term.colors[13] = '#AD7FA8'; //Linux Tango - images
                    term.colors[14] = '#3465A4'; //Linux Tango - javascript comments
                    term.colors[15] = '#000000';
                    term.colors[256] = '#ffffff';
                    term.colors[257] = '#000000';
                  break;
                case 'Solarized':
                    var t = document.getElementsByClassName('terminal');
                    t[0].style.backgroundColor = "#002b36";
                    t[0].style.color = "#839496";
                    term.colors[0] = '#073642';
                    term.colors[1] = '#dc322f'; //git - changes not staged for commit
                    term.colors[2] = '#268bd2'; //git - changes staged for commit
                    term.colors[3] = '#b58900';
                    term.colors[4] = '#268bd2';
                    term.colors[5] = '#d33682';
                    term.colors[6] = '#2aa198';
                    term.colors[7] = '#eee8d5';
                    term.colors[8] = '#002b36';
                    term.colors[9] = '#cb4b16';
                    term.colors[10] = '#d33682'; //magenta user@machine
                    term.colors[11] = '#268bd2';
                    term.colors[12] = '#859900'; //green location
                    term.colors[13] = '#6c71c4';
                    term.colors[14] = '#2aa198';
                    term.colors[15] = '#fdf6e3';
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
