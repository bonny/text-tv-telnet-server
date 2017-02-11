var blessed = require('blessed');
var telnet = require('telnet2');
var request = require('request');

let cmd = []

telnet({ tty: true }, function(client) {
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

      //client.write("b: " + b)
      // if enter/carriage return then check for command
      if (b == "\r") {
        let fullCommand = cmd.join('')
        console.log(fullCommand)
        screen.data.main.setContent(`Hämtar ${fullCommand} ...`);
        screen.render();
        checkCommand(fullCommand)
        cmd = []
      } else {
        cmd.push(b)
        let typingCommand = cmd.join('')
        screen.data.main.setContent(`Ange nummer på sida att hämta: ${typingCommand}`);
        screen.render();
      }

  })

  var screen = blessed.screen({
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
    content: 'Välkommen till Text TV:s Telnet-server'
  });

  screen.render();
}).listen(2300);

/**
 * cmd = string
 */
function checkCommand (cmd) {

  console.log(`check if ${cmd} is valid command`)
  var pageNumber = parseInt(cmd, 10);
  if (isNaN(pageNumber)) {
    return false;
  }

  if (pageNumber < 100 || pageNumber > 999) {
    return false;
  }

  // ok, valid number
  // http://api.texttv.nu/api/get/100?app=apiexempelsidan


}
