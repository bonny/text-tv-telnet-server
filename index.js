var blessed = require('blessed');
var telnet = require('telnet2');
var request = require('request');
var striptags = require('striptags');

var port = process.env.PORT || 2300;

console.log('will listen on port ' + port)

telnet({ tty: true }, function(client) {

  let cmd = []
  let screen = null;

  client.on('term', function(terminal) {
    screen.terminal = terminal;
    screen.render();
  });

  client.on('size', function(width, height) {
    client.columns = width;
    client.rows = height;
    client.emit('resize');
  });

  // listen for the actual data from the client
  client.on('data', function (b) {

      // console.log('got data', b)
      //client.write("b: " + b)
      // if enter/carriage return then check for command
      if (b == "\r") {
        let fullCommand = cmd.join('')
        // console.log(fullCommand)
        screen.data.main.setContent(`Hämtar ${fullCommand} ...`);
        screen.render();
        checkCommand(fullCommand, screen)
        cmd = []
      } else {
        cmd.push(b)
        let typingCommand = cmd.join('')
        screen.data.main.setContent(`Ange nummer på sida att hämta: ${typingCommand}`);
        screen.render();
      }

  })

  screen = blessed.screen({
    smartCSR: true,
    input: client,
    output: client,
    terminal: 'xterm-256color',
    fullUnicode: true
  });

  client.on('close', function() {
    if (!screen.destroyed) {
      screen.destroy();
    }
  });

  screen.key(['C-c', 'q'], function(ch, key) {
    screen.destroy();
  });

  screen.on('destroy', function() {
    if (client.writable) {
      client.destroy();
    }
  });

  screen.data.main = blessed.box({
    parent: screen,
    left: 'center',
    top: 'center',
    width: '80%',
    height: '90%',
    border: 'line',
    content: 'Välkommen till Text TV:s Telnet-server\n\nAnge nummer på sida att visa: '
  });

  //console.log('will render welcome text')
  screen.render();
}).listen(port);

/**
 * cmd = string
 */
function checkCommand (cmd, screen) {

  var pageNumber = parseInt(cmd, 10);

  if (isNaN(pageNumber)) {
    return false;
  }

  if (pageNumber < 100 || pageNumber > 999) {
    return false;
  }

  // ok, valid number
  // http://api.texttv.nu/api/get/100?app=apiexempelsidan
  let apiUrl = `http://api.texttv.nu/api/get/${pageNumber}?app=telnetserver`

  request(apiUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let pagedata = JSON.parse(body)
      renderPage(pagedata, screen)
    }
  })

}

function renderPage(pagedata, screen) {
  let firstPage = pagedata[0];
  let firstPageFirstContent = pagedata[0].content[0];
  firstPageFirstContent = striptags(firstPageFirstContent);

  screen.data.main.setContent(`${firstPageFirstContent}`);
  screen.render();
}
