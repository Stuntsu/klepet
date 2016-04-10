
var jeSlika = false;
var jeYoutube = false;
function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = sporocilo.indexOf('<img') > -1;
  var jeYoutube = sporocilo.indexOf('<iframe src="https://www.youtube.com/embed/') > -1;
  
  if (jeSmesko || jeSlika || jeYoutube) {
   sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />').replace(/\&lt;iframe/gi, '<iframe').replace(/allowfullscreen\&gt;/gi, 'allowfullscreen>').replace(/\&lt;\/iframe&gt;/gi,'</iframe>').replace(/px"\&gt;/gi, 'px">');

    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}


function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajYoutube(sporocilo);
  sporocilo = dodajSlike(sporocilo);



  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
      }
      
    $('#seznam-uporabnikov div').click(function() {
      var trenutniVzdevek = $(this).text();
      $('#poslji-sporocilo').val('/zasebno "' + trenutniVzdevek + '" ');
      $('#poslji-sporocilo').focus();
      
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajSlike(vhodnoBesedilo){
  
  var besede = vhodnoBesedilo.split(' ');
  
  for(var i=0; i<besede.length; i++){
      var trenutnaBeseda = besede[i];
      
      if(trenutnaBeseda.substring(0, 7).toLowerCase() == 'http://' || trenutnaBeseda.substring(0, 8).toLowerCase() == 'https://'){
        
        if(trenutnaBeseda.substring(trenutnaBeseda.length - 4, trenutnaBeseda.length) == '.jpg' || 
        trenutnaBeseda.substring(trenutnaBeseda.length - 4, trenutnaBeseda.length == '.png' || 
        trenutnaBeseda.substring(trenutnaBeseda.length - 4, trenutnaBeseda.length) == '.gif')){
          
          trenutnaBeseda += ' <img src="' + trenutnaBeseda + '" width="200" style="margin-left:20px">'
          besede[i] = trenutnaBeseda;
        }
      }
  }
  vhodnoBesedilo = '';
  
  for(var j=0; j < besede.length; j++){
    if(besede.length == 1 || j == (besede.length - 1)){
      vhodnoBesedilo += besede[j];
    }else{
      vhodnoBesedilo += besede[j];
      vhodnoBesedilo += ' ';
    }
  }

  return vhodnoBesedilo;
}

function dodajYoutube(vhodnoBesedilo){
  var besede = vhodnoBesedilo.split(' ');
  
  for(var i=0; i < besede.length; i++){
    var trenutnaBeseda = besede[i];
    
    if(trenutnaBeseda.substring(0, 32).toLowerCase() == "https://www.youtube.com/watch?v="){
      var hash = besede[i];
       hash = hash.replace('https://www.youtube.com/watch?v=', '');
       
       trenutnaBeseda += ' <iframe src="https://www.youtube.com/embed/' + hash + '" width="200" height="150" style="margin-left:20px" allowfullscreen></iframe>';
       besede[i] = trenutnaBeseda;
    }
  }
  vhodnoBesedilo = '';
  for(var j=0; j < besede.length; j++){
    if(besede.length == 1 || j == (besede.length - 1)){
      vhodnoBesedilo += besede[j];
    }else{
      vhodnoBesedilo += besede[j];
      vhodnoBesedilo += ' ';
    }
  }
  return vhodnoBesedilo;
}
