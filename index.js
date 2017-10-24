var Imap = require('imap'),
    inspect = require('util').inspect,
    fs = require('fs'),
    readline = require('readline'),
    xoauth2 = require('xoauth2');



function authorize(credentials, callback) {
  var options = {};
  options.user = "headtubeangle@gmail.com"
  options.clientId = credentials.installed.client_id;
  options.clientSecret = credentials.installed.client_secret;
  // options.accessToken = "ya29.GlvpBFrUkHJWOUnrjoZsAf6rblwkQe8JaMqAgFHZiUS5Kl5N2WBwlk9L4rdIGSg0rJksxOcGbTUq74s1poyyCp-aaxB1Jwpn92zr4hr2PZ9B0mLVGlv4Dy2Qih_Z";
  options.refreshToken = "1/OgIrqNa2eiQlLsjanDsnz9PaCsicRfFauShk7aXsrAg";
  console.log(options);
  // options.redirectUrl = credentials.installed.redirect_uris[0];
  var xoauth2Object = xoauth2.createXOAuth2Generator(options);
  xoauth2Object.getToken(function(err, token){
    if(err){
        return console.log(err);
    }
    console.log("AUTH XOAUTH2 " + token);
    callback(token);
  });
}

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

function connect(xoauth2){
  var imap = new Imap({
    // user: 'headtubeangle@gmail.com',
    // password: 'trafficfordays',
    xoauth2: xoauth2,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    debug: console.log
  });


  imap.once('ready', function() {
    imap.openBox('INBOX', true, function(err, box) {
      if (err) throw err;      
    });
    // // openInbox(function(err, box) {
    //   if (err) throw err;
    //   var f = imap.seq.fetch('1:3', {
    //     bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
    //     struct: true
    //   });
    //   f.on('message', function(msg, seqno) {
    //     console.log('Message #%d', seqno);
    //     var prefix = '(#' + seqno + ') ';
    //     msg.on('body', function(stream, info) {
    //       var buffer = '';
    //       stream.on('data', function(chunk) {
    //         buffer += chunk.toString('utf8');
    //       });
    //       stream.once('end', function() {
    //         console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
    //       });
    //     });
    //     msg.once('attributes', function(attrs) {
    //       console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
    //     });
    //     msg.once('end', function() {
    //       console.log(prefix + 'Finished');
    //     });
    //   });
    //   f.once('error', function(err) {
    //     console.log('Fetch error: ' + err);
    //   });
    //   f.once('end', function() {
    //     console.log('Done fetching all messages!');
    //     // imap.end();
    //   });
    // });
  });
  imap.on('mail', function(numNew) {
    console.log("Mail Event !!! New mails: " + numNew);
    imap.openBox('INBOX', true, function(err, box) {
    // openInbox(function(err, box) {
      if (err) throw err;
      var f = imap.seq.fetch(box.messages.total + ':*', {
        bodies: '',
        struct: true
      });
      f.on('message', function(msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
          var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
            var body = Imap.parseHeader(buffer);
            console.log("date: " + body.date);
            console.log("date/time sent: " + new Date(body.date));
            console.log("date/time received: " + body.received);
            console.log("date/time processed: " + new Date().toString());
          });
        });
        msg.once('attributes', function(attrs) {
          // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        });
        msg.once('end', function() {
          console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
      });
    });
  });
  imap.once('error', function(err) {
    console.log(err);
  });
  imap.once('end', function() {
    console.log('Connection ended');
  });

  imap.connect();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter \'quit\' to close connection.', (answer) => {
    console.log('we have an answer: ' + answer);
    if(answer === 'quit'){
      imap.end();
      rl.close();
    }
  });
  rl.on('line', (answer) => {
    if(answer === 'quit'){
      imap.end();
      rl.close();
    }
  });
}


// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  authorize(JSON.parse(content), connect);
});