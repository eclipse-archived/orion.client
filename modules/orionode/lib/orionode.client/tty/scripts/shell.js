require(["/socket.io/socket.io.js", "scripts/term.js", "/requirejs/domReady.js", "orion/PageUtil", "orion/fileClient", "orion/bootstrap"], 
    function(io, Terminal, onReady, PageUtil, FileClient, mBootstrap) {
  // default settings:
  
  var serviceRegistry, fileClient;

  mBootstrap.startup().then(function(core) {
		serviceRegistry = core.serviceRegistry;
		fileClient = new FileClient.FileClient(serviceRegistry);
    fileClient.loadWorkspace(getCWD()).then(function(args) {
      debugger;
      console.log(args);
      console.log(fileClient.fileServiceRootURL(args.Location));
    });
	});

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

    var bgButton = document.getElementById("bg");
    bgButton.onchange = changeBg;

    var txButton = document.getElementById("tx");
    txButton.onchange = changeTx;

    var wrenchButton = document.getElementById("menuWrench");
		wrenchButton.onclick = function() {
			var d = document.getElementById("dropdown");
			if (d.style.display == "block")
				d.style.display = "none";
			else
				d.style.display = "block";
		};
  });
  
  function __changeScheme(var schemeName) {
  	if (term != null) {
	  	switch(schemeName) {
	  		case 'Dark':
	  		case 'Light':
	  		case 'Solarized':
	  			term.colors[0] = '#262626';
	  			term.colors[1] = '#d70000';
	  			term.colors[2] = '#5f8700';
	  			term.colors[3] = '#af8700';
	  			term.colors[4] = '#0087ff';
	  			term.colors[5] = '#af005f';
	  			term.colors[6] = '#00afaf';
	  			term.colors[7] = '#d7d7af';
	  			term.colors[8] = '#1c1c1c';
	  			term.colors[9] = '#d75f00';
	  			term.colors[10] = '#4e4e4e';
	  			term.colors[11] = '#585858';
	  			term.colors[12] = '#808080';
	  			term.colors[13] = '#5f5faf';
	  			term.colors[14] = '#8a8a8a';
	  			term.colors[15] = '#ffffd7';
	  			term.colors[256] = '#1c1c1c';
	  			term.colors[257] = '#585858';
	  			break;
	  	}
	  }
  }

/*
  function changeTx() {
    var t = document.getElementsByClassName('terminal');
    var tx = document.getElementById("tx").value;
    switch(tx)
    {
      case 'Blue':
        txColor = '#0404B4';
        break;
      case 'White':
        txColor = '#FFFFFF';
        break;
      case 'Green':
        txColor = '#01DF01';
        break;
      case 'Black':
        txColor = '#000000';
        break;
      case 'Orange':
        txColor = '#FF8000';
        break;
    }
    t[0].style.color = txColor;
  }

  function changeBg() {
    var t = document.getElementsByClassName('terminal');
    var bg = document.getElementById("bg").value;
    switch(bg)
    {
      case 'Blue':
        bgColor = '#0404B4';
        break;
      case 'Grey':
        bgColor = '#585858';
        break;
      case 'Green':
        bgColor = '#0B6121';
        break;
      case 'Black':
        bgColor = '#000000';
    }
    t[0].style.backgroundColor = bgColor;
  }
  
  */

	function getCWD() {
		var result = PageUtil.matchResourceParameters(window.location.href).resource;
		return result.length > 0 ? result : null;
	}

});
