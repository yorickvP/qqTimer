/* jshint esversion: 6, browser: true, -W041 */
var startTime;
var curTime;
var inspectionTime;
var timerStatus; // 0 = stopped, 1 = running, 2 = inspecting, 3 = waiting, 4 = memo
var times = [];
var notes = [];
var comments = [];
var scrambleArr = [];
var scramble;
var lastscramble;
var importScrambles=[];
var timerID;
var inspectionID;
var memoID;
var highlightStart;
var highlightStop;
var highlightID;
var sessionID=0;
var initoncesq1 = 1;
var nightMode = false;

function $(str){return document.getElementById(str);}

function loadsettings() {
  return {
    styleName: "style" + getCookie('style', 0) + ".css",
    timerupdate: getCookie('timerupdate', 1),
    timerSize: getCookie("timerSize", 2)
  };
}

var settings = loadsettings();
timerupdate = settings.timerupdate;

// #################### TIMER STUFF ####################

// deal with styles
document.writeln(`<link rel='stylesheet' type='text/css' href='${settings.styleName}'>`);

// firefox 9.0.1 bugfix
window.onkeydown = function(event) {checkKey(event.keyCode); };
window.onkeyup = function(event) {startTimer(event.keyCode); };

function initialize(lookForTimes, checkQueryString) {
 loadOptBoxes();
 var query = ""; // query string for scrambles
 if (checkQueryString) {
  query = window.location.search.substring(1);
 }
 if (lookForTimes) {
  getSession(); // see if there is a session saved
 } else {
  times = [];
  notes = [];
  comments = [];
  scrambleArr = [];
  window.focus();
 }
 showOptions = 0;
 //toggleOptions(); // options are shown by default
 avgSizes = [50,5,12,100,1000];
 moSize = 3;
 bestAvg = [[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]];
 lastAvg = [[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]];
 bestMo = [-1,0];
 lastMo = [-1,0];
 bestAvgIndex = [0,0,0,0,0];
 bestMoIndex = 0;
 bestTime = -1;
 bestTimeIndex = 0;
 worstTime = -1;
 worstTimeIndex = 0;
 clearHighlight();
 if (timerStatus != 0) {clearInterval(timerID); clearInterval(inspectionID);}
 timerStatus = 3;
 var len, type;

 $('toggler').innerHTML = ["off", "on", "seconds only", "inspection only"][timerupdate];
 useMilli = getCookie("useMilli", 0);
 $('millisec').innerHTML = (useMilli==1) ? "1\/1000 sec" : "1\/100 sec";
 var oldManualEnter = manualEnter;
 manualEnter = getCookie("manualEnter", 0);
 if (manualEnter!=oldManualEnter) {
  toggleInput();
  manualEnter = 1-manualEnter;
 }
 $('tcol').value = getCookie("tColor", "00ff00");
 $('bcol').value = getCookie("bColor", "white");
 $('fcol').value = getCookie("fColor", "black");
 $('lcol').value = getCookie("lColor", "blue");
 $('hcol').value = getCookie("hColor", "yellow");
 $('memcol').value = getCookie("memColor", "green");
 $('inputTimes').innerHTML = (manualEnter==1) ? "typing" : "timer";
 $('theTime').innerHTML = (manualEnter==1) ?
  "<input id='timeEntry' size=12 style='font-size:100%'>"+
  " <span onclick='stopTimer(13);' class='a' style='color:"+
  parseColor($('lcol').value)+"'>enter</span>" : "ready";
 scrambleSize = +getCookie("scrSize", 16);
 $('scramble').style.fontSize = scrambleSize + "px";
 $('getlast').style.fontSize = scrambleSize + "px";
 applyTimerSize();
 inspection = getCookie("inspection", 0);
 $('inspec').innerHTML = (inspection==1) ? "WCA" : "no";
 if (inspection==0) { useBld = getCookie("useBld", 0); }
 else { useBld = 0; setCookie("useBld", 0); }
 $('bldmode').innerHTML = (useBld==1) ? "on" : "off";
 useAvgN = getCookie("useAvgN", 0);
 $('avgn').innerHTML = (useAvgN==1) ? "using" : "not using";
 useMoN = getCookie("useMoN", 0);
 $('mon').innerHTML = (useMoN==1) ? "using" : "not using";
 useMono = getCookie("useMono", 0);
 $('monospace').innerHTML = (useMono==1) ? "on" : "off";
 $('scramble').style.fontFamily = (useMono==1) ? "monospace" : "serif";
 $('getlast').style.color = parseColor($('lcol').value);
 type = getCookie("scrType", "333");
 if (query.length > 0) type = query;
 
 loadList();
 getStats(true);

 curTime = new Date(0);
 $('leng').value = len;
 var obj = $('optbox');
 for(var i = 0; i < scrdata.length; i++) {
  for (var j = 0; j < scrdata[i][1].length; j++) {
   if(scrdata[i][1][j][1] == type) {
    obj.selectedIndex = i;
    rescramble(false);
    $('optbox2').selectedIndex = j;
   }
  }
 }
 changeColor();
 scramble = "";
 rescramble2();
}

function rescramble(scramble) {
 var obj = $('optbox');
 var obj2 = $('optbox2');

 var box2 = scrdata[obj.selectedIndex][1];
 for (var i=obj2.options.length-1; i>0; i--)
  obj2.remove(i);
 for (var i=0; i<box2.length; i++)
  obj2.options[i] = new Option(box2[i][0],box2[i][1]);
 len = box2[0][2];
 $('leng').value = len;
 type = box2[0][1];
 if (scramble) {
  setCookie("scrType", type);
  scrambleIt();
  $('getlast').innerHTML = "get last scramble";
 }
}

function rescramble2() {
 var obj = $('optbox');
 var obj2 = $('optbox2');
 var newType = obj2.options[obj2.selectedIndex].value;

 var box2 = scrdata[obj.selectedIndex][1];
 len = box2[obj2.selectedIndex][2];
 $('leng').value = len;
 type = newType;
 setCookie("scrType", type);

 scrambleIt();
 $('getlast').innerHTML = "get last scramble";
}

function rescramble3() {
 len = $('leng').value;
 scrambleIt();
 $('getlast').innerHTML = "get last scramble";
}

function loadOptBoxes() {
 for (var i=0; i<scrdata.length; i++) {
  $('optbox').options[i] = new Option(scrdata[i][0],"");
 }
}

function startTimer(keyCode) {
 if (timerStatus == 0 && manualEnter == 0 && keyCode == 32 && importFocus == 0) {
  timerStatus = 3;
 } else if (timerStatus == 3 && manualEnter == 0 && keyCode == 32 && (new Date()).getTime() - curTime.getTime() >= 300 && importFocus == 0) {
  if (type=="sqrs") { $('scramble').innerHTML = "scramble: loading... "; }
  if (inspection == 1) {
   timerStatus = 2;
   inspectionTime = new Date();
   $('theTime').style.color = "red";
   if (timerupdate != 0) {inspectionID = setInterval(updateInspec, (timerupdate==1)?10:100);}
   else {$('theTime').innerHTML = "inspecting";}
  } else if (useBld == 1) {
   timerStatus = 4;
   memoTime = new Date();
   $('theTime').style.color = $('memcol').value;
   if (timerupdate==1 || timerupdate==2) {memoID = setInterval(updateMemo, (timerupdate==1)?10:100);}
   else {$('theTime').innerHTML = "memorizing";}
  } else {
   timerStatus = 1;
   startTime = new Date();
   penalty = 0;
   $('theTime').style.color = (nightMode ? "#fff" : $('fcol').value);
   if (timerupdate==1 || timerupdate==2) {timerID = setInterval(updateTimer, (timerupdate==1)?10:100);}
   else {$('theTime').innerHTML = "running";}
  }
 } else if (timerStatus == 4 && keyCode == 32) {
  timerStatus = 1;
  startTime = new Date();
  $('theTime').style.color = (nightMode ? "#fff" : $('fcol').value);
  var memoLength = startTime.getTime() - memoTime.getTime();
  if (timerupdate==1 || timerupdate==2) {
   clearInterval(memoID);
   timerID = setInterval(updateMemo, (timerupdate==1)?10:100);
  }
  else {$('theTime').innerHTML = "running";}
 } else if (timerStatus == 2 && keyCode == 32) {
  timerStatus = 1;
  startTime = new Date();
  $('theTime').style.color = (nightMode ? "#fff" : $('fcol').value);
  var inspecLength = startTime.getTime() - inspectionTime.getTime();
  penalty = (inspecLength < 15000) ? 0 : (inspecLength < 17000) ? 2 : 1;
  clearInterval(inspectionID);
  if (timerupdate==1 || timerupdate==2) {
   timerID = setInterval(updateTimer, (timerupdate==1)?10:100);
  }
  else {$('theTime').innerHTML = "running";}
 }
}

function stopTimer(keyCode) {
 if (keyCode == 32) {
  $('optbox').blur();
  $('leng').blur();
 }
 if (manualEnter == 1) {
  if (keyCode == 13) {
   var timeStr = $('timeEntry').value;
   var nonzero = false;
   if (timeStr.match(/.* .*/)) {
    nonzero = parseTime(timeStr.replace(/(.*) .*/, "$1"), true);
    if (nonzero) { // if time breaks, ignore comments/notes
     comments[times.length-1] = timeStr.replace(/.*? (.*)$/, "$1");
     notes[times.length-1] = 0;
     loadList(); // unfortunately have to do this twice ;|
     getStats(false);
    }
   } else {
    nonzero = parseTime(timeStr, false);
   }
   $('timeEntry').value = "";
   if (nonzero) scrambleArr[scrambleArr.length] = scramble;
   rescramble3();
  }
 } else if(timerStatus == 1) {
  timerStatus = (keyCode == 32) ? 0 : 3;
  if (timerupdate==1 || timerupdate==2) {clearInterval(timerID);}
  getTime(penalty);
  scrambleArr[scrambleArr.length] = scramble;
  rescramble3();
 }
}

function checkKey(keyCode) {
 if (keyCode == 13 || manualEnter == 0) stopTimer(keyCode);
}


function updateTimer() {
 curTime = new Date();
 var time = curTime.getTime() - startTime.getTime();
 if (timerupdate == 1) {
  $('theTime').innerHTML = pretty(time);
 } else {
  $('theTime').innerHTML = pretty(time).split(".")[0];
 }
}

function updateMemo() {
 curTime = new Date();
 var time = curTime.getTime() - memoTime.getTime();
 if (timerupdate == 1) {
  $('theTime').innerHTML = pretty(time);
 } else {
  $('theTime').innerHTML = pretty(time).split(".")[0];
 }
}

function updateInspec() {
 curTime = new Date();
 var time = curTime.getTime() - inspectionTime.getTime();
 $('theTime').innerHTML = (time > 17000) ? "DNF" : (time > 15000) ? "+2" : 15-Math.floor(time/1000);
}

function getTime(note) {
 curTime = new Date();
 var time, mtime;
 if (useBld==1) { 
  time = curTime.getTime() - memoTime.getTime(); 
  mtime = startTime.getTime() - memoTime.getTime();	
 } 
 else {
  time = curTime.getTime() - startTime.getTime();
 }
 times[times.length] = time;
 notes[notes.length] = note;
 if (useBld==1) { 
  comments[comments.length] = pretty(mtime) ;
 }
 else { 
  comments[comments.length] = ""; 
 }
 $('theTime').innerHTML = pretty(time);
 clearHighlight();
 loadList();
 getStats(true); // should be false, but it doesn't hurt
}

function parseTime(s, importing) {
 var time = 0;
 var arr = s.split(":");
 if (arr.length == 3) {
  time = 3600000 * parseInt(arr[0]) + 60000 * parseInt(arr[1]) + 1000 * parseFloat(arr[2]);
 } else if (arr.length == 2) {
  time = 60000 * parseInt(arr[0]) + 1000 * parseFloat(arr[1]);
 } else if (arr.length == 1) {
  time = 1000 * parseFloat(arr[0]);
 }
 time = Math.round(time);
 if (isNaN(time)) time = 0;
 if (time != 0) {	// don't insert zero-times
  if (!importing) {
   notes[notes.length] = 0;
   comments[comments.length] = "";
  } else if (notes[times.length] == 2) {
   time -= 2000;
  }
  times[times.length] = time;
  clearHighlight();
  loadList();
  getStats(false);
  return true;
 } else {
  return false;
 }
}

function resetTimes() {
 if (confirm("Are you sure you want to delete ALL of your times?")) {
  initialize(false, false);
 }
}

var added_event_listener = false;
function loadList() {
 var data = [-1,[null],[null]];
 var s = "times (<span onclick='resetTimes();' class='a'>reset</span>, <span onclick='toggleImport();' class='a'>import</span>):<br>"
 // get the best and worst time for the highlighted average
 if (highlightStop != -1 && (highlightStop - highlightStart) > 1) {
  var mean = 0;
  if (highlightID > 10 && (highlightID%10)>1) mean = 1; // check to see if this is a mean-of-N or not
  if (mean) {
   data = getMeanSD(highlightStart, highlightStop - highlightStart + 1, false);
  } else {
   data = getAvgSD(highlightStart, highlightStop - highlightStart + 1, false);
  }
 }
 function surround(condition, a, b, c) {
  return condition ? (a + c + b) : c;
 }
 var time_spans = new Array(times);
 for (var i = 0; i < times.length; i++) {
  time_spans[i] = {
    id: i,
    time: notes[i] == 2 ? times[i] + 2000 : times[i],
    dnf: notes[i] != 0 && notes[i] != 2,
    comment: comments[i] ? `[${comments[i]}]` : '',
    starthighlight: i == highlightStart,
    stophighlight: i == highlightStop,
    //highlight: i >= highlightStart && i <= highlightstop,
    emph: data[1].indexOf(i-highlightStart)>-1 || data[2].indexOf(i-highlightStart)>-1,
  };
 }
 s = time_spans.map((time) => {
  let ret = '';
  if (time.starthighlight) ret += `<span style='background-color: ${highlightColor}'>`;
  ret += `<span class='b' data-id='${time.id}'>`;
  ret += surround(time.dnf, "DNF(", ")", surround(time.emph, "(", ")", pretty(time.time)));
  ret += time.comment;
  ret += `</span>`;
  if (time.stophighlight)  ret += `</span>`;
  return ret;
 }).join(', ');
 $('theList').innerHTML = s;
 saveSession();
 // move scrollbar to bottom:
 var window = $('theList');
 window.scrollTop = window.scrollHeight;
 changeColor();
 if (!added_event_listener) {
    $('theList').addEventListener('click', function(evt) {
      console.log(evt);
      var x = evt.target;
      while(x != $('theList') && x.getAttribute('data-id') === undefined) x = x.parentNode;
      console.log(x)
      if (x == $('theList')) return;
      var id = +x.getAttribute('data-id');
      del(id);
    }, false);
    added_event_listener = true;
 }
}


function del(index) {
 if (confirm("Are you sure you want to delete the " +
     pretty((notes[index]==1)?-1:times[index]+1000*notes[index]) + "?")) {
  for (var i = index; i < times.length - 1; i++) {
   times[i] = times[i+1];
   notes[i] = notes[i+1];
   comments[i] = comments[i+1];
   scrambleArr[i] = scrambleArr[i+1];
  }
  times.pop();
  notes.pop();
  comments.pop();
  scrambleArr.pop();
  clearHighlight();
  loadList();
  getStats(true);
 }
}

function getlastscramble() {
 $('scramble').innerHTML = "scramble: " + scramble + "<br> last scramble: " + lastscramble;
 $('getlast').innerHTML = "";
}

function comment() {
 var newComment = prompt("Enter your comment for the most recent solve:",comments[comments.length-1]);
 if (newComment != null) { comments[comments.length-1] = newComment } else { comments[comments.length-1] = ""; }
 loadList();
}

function getBrowser() {
 // http://www.quirksmode.org/js/detect.html
 var versionSearchString;
 var dataBrowser = [
  {string:navigator.userAgent, subString:"Chrome", identity:"Chrome"},
  {string:navigator.userAgent, subString:"Safari", identity:"Chrome"},
  {string:navigator.userAgent, subString:"Firefox", identity:"Firefox"},
  {string:navigator.userAgent, subString:"MSIE", identity:"IE", versionSearch:"MSIE"}];

 function searchString(data) {
  for (var i=0;i<data.length;i++) {
   var dataString = data[i].string;
   var dataProp = data[i].prop;
   if (dataString) {
    if (dataString.indexOf(data[i].subString) != -1)
     return data[i].identity;
   } else if (dataProp)
    return data[i].identity;
  }
 };
 
 return searchString(dataBrowser) || "An unknown browser";
}


// #################### OPTIONS ####################


var useMilli = 0;
var manualEnter = 0;
var showOptions = 0;
var scrambleSize = 16;
var inspection = 0;
var useBld = 0;
var penalty = 0;
var useAvgN = 0;
var viewstats = 1;
var importFocus = 0;
var validColors = ["black","brown","white","purple","violet","red","orange","yellow","green","cyan","blue","gray","grey","pink"];
var highlightColor;

function toggleImport() {
 if ($('import').style.display == 'block') {
  $('import').style.display = 'none';
  importFocus = 0;
 } else {
  $('import').style.display = 'block';
  importFocus = 1;
 }
}

function toggleTimer() {
 stopTimer();
 timerupdate = (timerupdate + 1)%4;
 setCookie("timerupdate", timerupdate);
 $('toggler').innerHTML =
	(timerupdate==0) ? "off" :
	(timerupdate==1) ? "on" :
	(timerupdate==2) ? "seconds only" :
	"inspection only";
}

function toggleMilli() {
 useMilli = 1 - useMilli;
 setCookie("useMilli", useMilli);
 $('millisec').innerHTML = (useMilli==1) ? "1\/1000 sec" : "1\/100 sec";
 loadList();
 getStats(true);
}

function toggleBld() {
 if (inspection==0) { useBld = 1 - useBld; }
 setCookie("useBld", useBld);
 $('bldmode').innerHTML = (useBld==1) ? "on" : "off";
}

function toggleMono() {
 useMono = 1 - useMono;
 setCookie("useMono", useMono);
 $('monospace').innerHTML = (useMono==1) ? "on" : "off";
 $('scramble').style.fontFamily = (useMono==1) ? "monospace" : "serif";
 $('getlast').style.color = parseColor($('lcol').value);
}

function toggleInput() {
 if (manualEnter == 0) stopTimer();
 manualEnter = 1 - manualEnter;
 setCookie("manualEnter", manualEnter);
 $('inputTimes').innerHTML = (manualEnter==1) ? "typing" : "timer";
 $('theTime').innerHTML = (manualEnter==1) ?
  "<input id='timeEntry' size=12 style='font-size:100%'>"+
  " <span onclick='stopTimer(13);' class='a' style='color:"+
  parseColor($('lcol').value)+"'>enter</span>" : "ready";
}

function toggleOptions() {
 showOptions = 1 - showOptions;
 $('showOpt').innerHTML = (showOptions==1) ? "hide" : "show";
 $('options').style.display = (showOptions==1) ? "" : "none"; 
}

function increaseSize() {
 settings.timerSize++;
 setCookie("timerSize", settings.timerSize);
 applyTimerSize();
}

function decreaseSize() {
 if (settings.timerSize >= 2) settings.timerSize--;
 setCookie("timerSize", settings.timerSize);
 applyTimerSize();
}

function applyTimerSize() {
  var timerSize = settings.timerSize;
 $('theTime').style.fontSize = timerSize + "em";
 $('theList').style.height = Math.max(20, (timerSize * 1.5)) + "em";
 $('stats').style.height = Math.max(20, (timerSize * 1.5)) + "em";
}

function increaseScrambleSize() {
 scrambleSize+=4;
 setCookie("scrSize", scrambleSize);
 $('scramble').style.fontSize = scrambleSize + "px";
 $('getlast').style.fontSize = scrambleSize + "px";
}

function decreaseScrambleSize() {
 if (scrambleSize > 8) scrambleSize-=4;
 setCookie("scrSize", scrambleSize);
 $('scramble').style.fontSize = scrambleSize + "px";
 $('getlast').style.fontSize = scrambleSize + "px";
}

function toggleInspection() {
 inspection = 1 - inspection;
 if (inspection==1) { useBld = 0; }
 setCookie("useBld", useBld);
 setCookie("inspection", inspection);
 $('inspec').innerHTML = (inspection==1) ? "WCA" : "no";
 $('bldmode').innerHTML = (useBld==1) ? "on" : "off";
}

function toggleAvgN() {
 useAvgN = 1 - useAvgN;
 setCookie("useAvgN", useAvgN);
 $('avgn').innerHTML = (useAvgN==1) ? "using" : "not using";
 getStats(true);
}

function toggleMoN() {
 useMoN = 1 - useMoN;
 setCookie("useMoN", useMoN);
 $('mon').innerHTML = (useMoN==1) ? "using" : "not using";
 getStats(true);
}

function toggleStatView() {
 viewstats = 1 - viewstats;
 getStats(viewstats);
}

function changeColor() {
  var cols = {};
 ;["tcol", "bcol", "fcol", "lcol", "hcol", "memcol"].forEach((color) => {
  cols[color] = parseColor($(color).value);
  $(color + "_ex").style.color = cols[color];
 });
 $('menu').bgColor = cols.tcol;
 if (nightMode) {
  document.bgColor = "#000";
  document.body.style.color = "#fff";
 } else {
  document.bgColor = cols.bcol;
  document.body.style.color = cols.fcol;
 }

 if (getBrowser() != "IE") {
  var links = document.getElementsByClassName('a');
  for (var i = 0; i < links.length; i++) {
   links[i].style.color = cols.lcol;
  }
 } else {
  var links = document.getElementsByTagName('span');
  for (var i = 0; i < links.length; i++) {
   if (links[i].className == "a") {
    links[i].style.color = cols.lcol;
   }
  }
 }

 highlightColor = cols.hcol;
 $('getlast').style.color = cols.lcol;
 setCookie("tColor", $('tcol').value);
 setCookie("bColor", $('bcol').value);
 setCookie("fColor", $('fcol').value);
 setCookie("lColor", $('lcol').value);
 setCookie("hColor", $('hcol').value);
 setCookie("memColor", $('memcol').value);
}

function parseColor(str) {
 for (var i=0; i<validColors.length; i++) {
  if (str == validColors[i]) {
   return str;
  }
 }
 while (str.length < 6) str += "0";
 return "#"+str;
}

function resetColors() {
 $('tcol').value = "00ff00";
 $('bcol').value = "white";
 $('fcol').value = "black";
 $('lcol').value = "blue";
 $('hcol').value = "yellow";
 $('memcol').value = "green";
 changeColor();
}

function toggleNightMode() {
 nightMode = !nightMode;
 if (nightMode) {
  document.bgColor = "#000";
  document.body.style.color = "#fff";
 } else {
  document.bgColor = parseColor($('bcol').value);
  document.body.style.color = parseColor($('fcol').value);
 }
}

/* setCookie and getCookie functions originally from http://www.quirksmode.org/js/cookies.html */
function setCookie(name,value) {
 if (window.localStorage !== undefined) {
  window.localStorage.setItem(name,value);
  return;
 }
 var expires = "; expires=" + new Date(3000, 00, 01).toGMTString() + "; path=/";
 var cookies = document.cookie.split(';');
 var x = "qqTimer=";
 var found = false;
 for (var i=0; i<cookies.length; i++) {
  var c = cookies[i];
  while (c.charAt(0)==' ') c = c.substring(1,c.length);
  if (c.indexOf(x) == 0) { // this is the qqtimer cookie
   found = true;
   var str = c.substring(x.length,c.length);
   var options = str.split('.');
   var good = false;
   for (var j=0; j<options.length; j++) {
    if (options[j].split(',')[0] == name) {
     good = true;
     options[j] = name + "," + value;
    }
   }
   if (!good) {
    options[options.length] = name + "," + value;
   }
   var s = x;
   for (var j=0; j<options.length; j++) {
    if (j>0) s+=".";
    s+=options[j];
   }
   document.cookie = s + expires;
  }
 }
 if (!found) {
  document.cookie = x + name + "," + value + expires;
 }
}

function getCookie(name, fallback) {
 if (window.localStorage !== undefined) {
  var value = window.localStorage.getItem(name);
  if (value != null) return value;
 }
 
 var cookies = document.cookie.split(';');
 var x = "qqTimer=";
 for (var i=0; i<cookies.length; i++) {
  var c = cookies[i];
  while (c.charAt(0)==' ') c = c.substring(1,c.length);
  if (c.indexOf(x) == 0) { // this is the qqtimer cookie
   var str = c.substring(x.length,c.length);
   var options = str.split('.');
   for (var j=0; j<options.length; j++) {
    if (options[j].split(',')[0] == name) {
     return options[j].split(',')[1];
    }
   } 
  }
 }
 return (fallback === undefined ? null : fallback);
}

function saveSession() {
 var id = (document.getElementById("sessbox").selectedIndex==null) ? 0 : document.getElementById("sessbox").selectedIndex;
 var name = "session"+id;

 if (window.localStorage !== undefined) {
  var value = "";
  for (var i=0; i<times.length; i++) {
   value+=times[i];
   if(comments[i]!="" && comments[i]!==null) { value+="|" + comments[i]; } 
   if(notes[i]==1) value+="-";
   if(notes[i]==2) value+="+";
   if (i<times.length-1) value+=",";
  }
  value += ">";
 
  window.localStorage.setItem(name,value);
  return;
 }
 
 // format: cookie name "sessionY|X", comma separated, ">" at end
 // X is a number and we use another one if we run out of space
 // Y is the session number
 // time (in ms) with + for +2 or - for DNF
 var expires = "; expires=" + new Date(3000, 00, 01).toGMTString() + "; path=/";
 var cnt = 1;
 var s = name+"|"+cnt+"=";
 for (var i=0; i<times.length; i++) {
  if (s.length < 3950) { // just in case!
   s+=times[i];
   if(comments[i]!="" && comments[i]!==null) { s+="|" + comments[i]; } 
   if(notes[i]==1) s+="-";
   if(notes[i]==2) s+="+";
   if (i<times.length-1) s+=",";
  } else {
   document.cookie = s + expires;
   cnt++;
   s = name+"|"+cnt+"=";
   i--;
  }
 }
 document.cookie = s + ">" + expires;
}

function getSession() {
 var id = (document.getElementById("sessbox").selectedIndex==null) ? 0: document.getElementById("sessbox").selectedIndex;
 times = [];
 notes = [];
 comments = [];
 scrambleArr = [];
 
 var s = null;
 if (window.localStorage !== undefined) { // try to load text from localStorage
  s = window.localStorage.getItem("session"+id);
 }
 
 if (s == null) { // not in localStorage, load from cookie
  s = "";
  var cookies = document.cookie.split(';');
  var cnt = 1;
  var x = "session"+id+"|"+cnt+"=";
  var found = true;
  while (found) {
   found = false;
   for (var i=0; i<cookies.length; i++) {
    var c = cookies[i];
    while (c.charAt(0)==' ') c = c.substring(1, c.length);
    if (c.indexOf(x) == 0) { // the right cookie
     s += c.substring(x.length, c.length);
     if (s.indexOf(">") == -1) {
      found = true; cnt++; x = "session"+id+"|"+cnt+"="; break;
     }
    }
   }
  }
 }

 if (s == null) {
  return;
 } else if (s.length == 0) {
  return;
 }

 var t = s.split(",");
 if (t[0] != ">") {
   for (var j=0; j<t.length; j++) {
    
    if (t[j].slice(-1) == ">") { t[j] = t[j].slice(0,t[j].length-1); }
    if (t[j].slice(-1) == "-") {
     notes[j] = 1;
     t[j] = t[j].slice(0,t[j].length-1);
    } else if (t[j].slice(-1) == "+") {
     notes[j] = 2;
     t[j] = t[j].slice(0,t[j].length-1);
    } else { notes[j] = 0; }
    var q = t[j].split("|");
    times[j] = parseInt(q[0]);
    comments[j] = (q[1]!=null && q[1]!="") ? q[1] : "";
    scrambleArr[j] = "";
   }
 }
 clearHighlight();
}


// #################### STATISTICS ####################


var avgSizes, bestAvg, lastAvg, bestAvgIndex;
var bestTime, bestTimeIndex, worstTime, worstTimeIndex;
var moSize, bestMo, lastMo, bestMoIndex;

function getStats(recalc) {
 var avgSizes2 = (avgSizes.slice(1 - useAvgN)).sort(numsort);
 var numdnf=0, sessionavg, sessionmean;
 if (recalc) {
  var theStats = getAllStats();
  numdnf = theStats[0];
  sessionavg = theStats[1];
  sessionmean = theStats[2];
 } else {
  // update averages and best time / worst time.
  var index = times.length - 1;
  var thisTime = (notes[index] == 1) ? -1 : times[index] + notes[index] * 1000;
  if (bestTime < 0 || (thisTime != -1 && thisTime < bestTime)) {
   bestTime = thisTime;
   bestTimeIndex = index;
  }
  if (thisTime > worstTime) {
   worstTime = thisTime;
   worstTimeIndex = index;
  }
  for (var j = 0; j < avgSizes2.length; j++) {
   if (times.length < avgSizes2[j]) {
    break;
   } else {
    lastAvg[j] = getAvgSD(times.length - avgSizes2[j], avgSizes2[j], true);
    if (bestAvg[j][0] < 0 || (lastAvg[j][0] != -1 && lastAvg[j][0] < bestAvg[j][0])) {
     bestAvg[j] = lastAvg[j];
     bestAvgIndex[j] = times.length - avgSizes2[j];
    }
   }
  }
  if (times.length >= moSize) {
   lastMo = getMeanSD(times.length - moSize, moSize, true);
   if (bestMo[0] < 0 || (lastMo[0] != -1 && lastMo[0] < bestMo[0])) {
    bestMo = lastMo;
    bestMoIndex = times.length - moSize;
   }
  }
  var sessionsum = 0;
  for (var i = 0; i < times.length; i++) {
   var thisTime = (notes[i] == 1) ? -1 : times[i] + notes[i] * 1000;
   if (thisTime == -1) {numdnf++;}
   else {sessionsum += thisTime;}
  }
  sessionavg = getAvgSD(0, times.length, true);
  sessionmean = (numdnf == times.length) ? -1 : (sessionsum / (times.length - numdnf));
 }

 function section(header, opts) {
  return `<div class="section_hdr">${header}</div>` +
    Object.keys(opts).map((name) => `<div class="section_left">${name}</div>${opts[name]}<br>`).join('');
 }

  function getentry({start, nsolves, id, time: [time, sigma]}) {
    return `<span onclick='setHighlight(${start}, ${nsolves}, ${id});loadList();' class='a'>
      ${pretty(time)}
    </span>` + (sigma ? `(&sigma; = ${trim(sigma, 2)})` : '');
  }
 function getsection(name, curr, best) {
  return section(name, {
    current: getentry(curr), best: getentry(best)
  });
 }

 var s = "stats: (<span id='hidestats' onclick='toggleStatView()' class='a'>" + (viewstats?"hide":"show") + "</span>)<br>";
 s += "number of times: " + (times.length - numdnf) + "/" + times.length;
 if (viewstats) {
  s += section("time", {
    best: getentry({start: bestTimeIndex, nsolves: 1, id: 0, time: [bestTime]}),
    worst: getentry({start: worstTimeIndex, nsolves: 1, id: 1, time: [worstTime]}),
  });
  if (useMoN==1 && times.length >= moSize) {
    s += getsection("mo"+moSize, {
      time: lastMo, start: times.length - moSize, nsolves: moSize, id: moSize + '2'
    }, {
      time: bestMo, start: bestMoIndex, nsolves: moSize, id: moSize + '3'
    });
  }
  for (var j = 0; j < avgSizes2.length; j++) {
   if (times.length >= avgSizes2[j]) {
    s += getsection("avg"+avgSizes2[j], {
      time: lastAvg[j], start: times.length - avgSizes2[j], nsolves: avgSizes2[j], id: avgSizes2[j] + '1'
    }, {
      time: bestAvg[j], start: bestAvgIndex[j], nsolves: avgSizes2[j], id: avgSizes2[j] + '0'
    });
   }
  }

  s += section("session", {
    avg: getentry({ start: 0, nsolves: times.length, id: 2, time: sessionavg }),
    mean: getentry({ start: 0, nsolves: times.length, id: 2, time: [sessionmean] }),
  });
 }
 $('stats').innerHTML = s;
 var window = $('stats');
 window.scrollTop = 0; // IE workaround (lol)
 changeColor();
}

function getAllStats() {
 var avgSizes2 = (avgSizes.slice(1 - useAvgN)).sort(numsort);
 bestAvg = [[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]];
 lastAvg = [[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]];
 bestAvgIndex = [0,0,0,0,0];
 bestTime = -1;
 bestTimeIndex = 0;
 worstTime = -1;
 worstTimeIndex = 0;
 var numdnf = 0;
 var sessionsum = 0;
 bestMo = [-1,0];
 lastMo = [-1,0];
 bestMoIndex = 0;
 for (var i = 0; i < times.length; i++) {
  var thisTime = (notes[i] == 1) ? -1 : times[i] + notes[i] * 1000;
  if (bestTime < 0 || (thisTime != -1 && thisTime < bestTime)) {
   bestTime = thisTime;
   bestTimeIndex = i;
  }
  if (thisTime > worstTime) {
   worstTime = thisTime;
   worstTimeIndex = i;
  }
  if (thisTime == -1) {numdnf++;}
  else {sessionsum += thisTime;}

  // calculate averages
  for (var j = 0; j < avgSizes2.length; j++) {
   if (times.length - i < avgSizes2[j]) {
    break;
   } else {
    lastAvg[j] = getAvgSD(i, avgSizes2[j], true);
    if (bestAvg[j][0] < 0 || (lastAvg[j][0] != -1 && lastAvg[j][0] < bestAvg[j][0])) {
     bestAvg[j] = lastAvg[j];
     bestAvgIndex[j] = i;
    }
   }
  }

  // calculate mean
  if (times.length - i >= moSize) {
   lastMo = getMeanSD(i, moSize, true);
   if (bestMo[0] < 0 || (lastMo[0] != -1 && lastMo[0] < bestMo[0])) {
    bestMo = lastMo;
    bestMoIndex = i;
   }
  }
 }

 var sessionavg = getAvgSD(0, times.length, true);
 var sessionmean = (numdnf == times.length) ? -1 : (sessionsum / (times.length - numdnf));

 return [numdnf, sessionavg, sessionmean];
}

function numsort(a,b) {
 return a - b;
}

function setHighlight(start, nsolves, id) {
 // if we're trying to set a highlight that has same ID as the current one, clear it.
 if (id == highlightID) {
  clearHighlight();
 } else {
  var mean = 0;
  if (id > 10 && (id%10)>1) mean = 1; // check to see if this is a mean-of-N or not
  highlightStart = start;
  highlightStop = start + nsolves - 1;
  highlightID = id;

  if (times.length == 0) return;
  var data = [0,[null],[null]];
  if (highlightStop != -1 && (highlightStop - highlightStart) > 1) {
   if (mean) {
    data = getMeanSD(highlightStart, highlightStop - highlightStart + 1, false);
   } else {
    data = getAvgSD(highlightStart, highlightStop - highlightStart + 1, false);
   }
  }
  var s="";
  if (id > 1) {
   if (id==2) {
    s += "Session average";
   } else if (mean) {
    s += "Mean of "+Math.floor(id/10);
   } else {
    s += "Average of "+Math.floor(id/10);
   }
   s += ": " + pretty(data[0]) + "<br>";
  }
  for (var i=0; i<nsolves; i++) {
   s += (i+1) + ". ";
   if (data[1].indexOf(i)>-1 || data[2].indexOf(i)>-1) s += "(";
   s += (notes[start+i]==1?"DNF(":"") + pretty(times[start+i]+(notes[start+i]==2?2000:0)) + (notes[start+i]==1?")":"");
   s += ((notes[start+i]==2)?"+":"") + (comments[start+i] ? "[" + comments[start+i] + "]" : "");
   if (data[1].indexOf(i)>-1 || data[2].indexOf(i)>-1) s += ")";
   s += " &nbsp; " + scrambleArr[start+i] + "<br>";
  }
  $('avgdata').innerHTML = "<td colspan='3'>" + s + "<\/td>";
  $('avgdata').style.display = "";
 }
}

function clearHighlight() {
 highlightStart = -1;
 highlightStop = -1;
 highlightID = -1;
 $('avgdata').style.display = "none";
}

function timesort(a,b) {
 // deal with DNFs; if they are both DNF it doesn't matter what we return
 var a2 = a[0], b2 = b[0];
 if (a2<0) a2=b2+1;
 if (b2<0) b2=a2+1;
 return a2 - b2;
}

// gets average and SD
function getAvgSD(start, nsolves, SD) {
 if (nsolves < 3) {return [-1,-1,-1];}

 // get list of times
 var timeArr = [], t, j;
 for (j=0; j<nsolves; j++) {
  t = (notes[start+j]==1 ? -1 : times[start+j]/10 + notes[start+j]*100);
  t = (useMilli==0 ? 10*Math.round(t) : 10*t);
  timeArr[timeArr.length] = [t, j];
 }

 // sort and take the average
 timeArr.sort(timesort);
 var trim = Math.ceil(nsolves/20); // trimmed amount per side
 var sum = 0;
 for (j=trim; j<nsolves-trim; j++) {
  sum += timeArr[j][0];
 }
 sum = (timeArr[nsolves-trim-1][0]<0 ? -1 : sum/(nsolves-2*trim));

 // get SD
 if (SD) {
  var variance = 0;
  for (j=trim; j<nsolves-trim; j++) {
   variance += Math.pow((timeArr[j][0] - sum)/1000, 2);
  }
  variance = Math.sqrt(variance / (nsolves - trim*2. - 1));
  return [sum, variance];
 } else {
  return [sum, dropTime(timeArr).slice(0,trim), dropTime(timeArr).slice(-trim)];
 }
}

function dropTime(arr) {
 var newArr = [];
 for (var i=0; i<arr.length; i++) {
  newArr[newArr.length] = arr[i][1];
 }
 return newArr;
}

function getMeanSD(start, nsolves, SD) {
 // get list of times
 var timeArr = [], t, j;
 for (j=0; j<nsolves; j++) {
  t = (notes[start+j]==1 ? -1 : times[start+j]/10 + notes[start+j]*100);
  t = (useMilli==0 ? 10*Math.round(t) : 10*t);
  timeArr[timeArr.length] = [t, j];
 }

 // sort and take the average
 timeArr.sort(timesort);
 var sum = 0;
 for (j=0; j<nsolves; j++) {
  sum += timeArr[j][0];
 }
 var mean = (timeArr[nsolves-1][0]<0 ? -1 : sum/nsolves);

 // get SD
 if (SD) {
  var variance = 0; 
  for (j=0; j<nsolves; j++) {
   variance += Math.pow((timeArr[j][0] - mean)/1000, 2);
  }
  variance = Math.sqrt(variance / (nsolves - 1));
  return [mean, variance];
 } else {
  return [mean, [], []];
 }
}

function trim(number, nDigits) {
 if (!number || number == Number.POSITIVE_INFINITY || number == Number.NEGATIVE_INFINITY) number = 0;
 var power = Math.pow(10, nDigits);
 var trimmed = "" + Math.round(number * power);
 while (trimmed.length < nDigits + 1) {
  trimmed = "0" + trimmed;
 }
 var len = trimmed.length;
 return trimmed.substr(0,len - nDigits) + "." + trimmed.substr(len - nDigits, nDigits);
}

function pretty(time) {
 if (time < 0) {return "DNF";}
 time = Math.round(time / (useMilli==1 ? 1 : 10));
 var bits = time % (useMilli==1 ? 1000 : 100);
 time = (time - bits) / (useMilli==1 ? 1000 : 100);
 var secs = time % 60;
 var mins = ((time - secs) / 60) % 60;
 var hours = (time - secs - 60 * mins) / 3600;
 var s = "" + bits;
 if (bits < 10) {s = "0" + s;}
 if (bits < 100 && useMilli==1) {s = "0" + s;}
 s = secs + "." + s;
 if (secs < 10 && (mins > 0 || hours > 0)) {s = "0" + s;}
 if (mins > 0 || hours > 0) {s = mins + ":" + s;}
 if (mins < 10 && hours > 0) {s = "0" + s;}
 if (hours > 0) {s = hours + ":" + s;}
 return s;
}

function changeNotes(i) {
 // 0 is normal solve, 1 is DNF, 2 is +2
 notes[notes.length - 1] = i;
 clearHighlight();
 loadList();
 getStats(true);
}

function changeAvgN() {
 var n = parseInt($("avglen").value);
 if (isNaN(n) || n < 3 || n > 10000) n = 50;
 avgSizes[0] = n;
 clearHighlight();
 loadList();
 getStats(true);
}

function changeMoN() {
 var n = parseInt($("molen").value);
 if (isNaN(n) || n < 2 || n > 10000) n = 3;
 moSize = n;
 clearHighlight();
 loadList();
 getStats(true);
}


function importTimes() {
 // split
 var imported = $('importedTimes').value;
 var itimes = imported.split("\n");
 if (itimes.length == 1) {
  itimes = imported.split(",");
 }

 // each element is either of the form (a) time, or (b) number. time scramble
 var index = times.length;
 for (var i=0; i<itimes.length; i++) {
  var t = itimes[i];
  while(t.match(/^ /)) {t = t.slice(1);} // dump spaces on start
  while(t.match(/ $/)) {t = t.slice(0,t.length-1);} // dump spaces on end
  var dot = (t.split(" ")[0]).slice(-1);

  // get to the time-only form
  if (dot != ".") { // concise
   scrambleArr[index] = "";
  } else { // verbose
   t = t.slice(t.indexOf(". ")+2); // get rid of time number
   var scr = "";
   if(t.match(/.*\[.*\].*/)) { // comment, might contain spaces
    scr = t.slice(t.indexOf("] ")+2);
    t = t.slice(0, t.indexOf("] ")+1);
   } else {
    if(t.indexOf(" ")>-1) {
     scr = t.slice(t.indexOf(" ")+1);
     t = t.slice(0, t.indexOf(" "));
    } else {
     scr = "";
    }
   }
   scrambleArr[index] = scr;
  }

  // parse
  if(t.match(/^\(.*\)$/)) {t = t.slice(1,t.length-1);} // dump parens
  if(t.match(/.*\[.*\]/)) { // look for comments
   comments[index] = t.replace(/.*\[(.*)\]/, "$1");
   t = t.split("[")[0];
  } else {comments[index] = "";}
  if(t.match(/DNF\(.*\)/)) { // DNF
   t = t.replace(/DNF\((.*)\)/, "$1");
   notes[index] = 1;
  } else if(t.match(/.*\+/)) { // +2
   t = t.slice(0,t.length-1);
   notes[index] = 2;
  } else {
   notes[index] = 0;
  }
  parseTime(t, true);
  index++;
 }

 toggleImport();
 importFocus = false;
 loadList();
}
var scrambleworker = new Worker("scramble.js");
scrambleworker.onerror = (({data}) => {throw data;});
function scrambleIt() {
  $("scramble").innerHTML = "loading...";
  scrambleworker.onmessage = ({data}) => {
    lastscramble = scramble;
    scramble = data.scramble;
    $("scramble").innerHTML = "scramble: " + scramble;
  };
  scrambleworker.postMessage({len, type});
}


// data for all scramblers
var scrdata = [["===WCA PUZZLES===",[["--","blank",0]]],
 ["2x2x2",[["random state","222so",11],["optimal random state","222o",0],["3-gen","2223",25],["6-gen",2226,25]]],
 ["3x3x3",[["random state","333",0],["old style","333o",25]]],
 ["4x4x4",[["SiGN","444",40],["WCA","444wca",40],["YJ (place fixed center on Urf)","444yj",40]]],
 ["5x5x5",[["SiGN","555",60],["WCA","555wca",60]]],
 ["6x6x6",[["SiGN","666si",80],["prefix","666p",80],["suffix","666s",80]]],
 ["7x7x7",[["SiGN","777si",100],["prefix","777p",100],["suffix","777s",100]]],
 ["Clock",[["Jaap order","clk",0],["concise","clkc",0],["efficient pin order","clke",0],["WCA","clkwca",0]]],
 ["Megaminx",[["Pochmann","mgmp",70],["old style","mgmo",70]]],
 ["Pyraminx",[["random state","pyrso",11],["optimal random state","pyro",0],["random moves","pyrm",25]]],
 ["Skewb",[["random state","skbso",11],["optimal random state","skbo",0],["U L R B","skb",25]]],
 ["Square-1",[["face turn metric","sq1h",40],["twist metric","sq1t",20],["random state","sqrs",0]]],
 ["===OTHER PUZZLES===",[["--","blank",0]]],
 ["15 puzzle",[["piece moves","15p",80],["blank moves","15pm",80]]],
 ["1x3x3 (Floppy Cube)",[["U D L R","flp",25]]],
 ["2x3x3 (Domino)",[[" ","223",25]]],
 ["3x3x4",[[" ","334",40]]],
 ["3x3x5",[["shapeshifting","335",25]]],
 ["3x3x6",[[" ","336",40]]],
 ["3x3x7",[["shapeshifting","337",40]]],
 ["4x4x6",[[" ","446",40]]],
 ["8x8x8",[["SiGN","888",120]]],
 ["9x9x9",[["SiGN","999",120]]],
 ["10x10x10",[["SiGN","101010",120]]],
 ["11x11x11",[["SiGN","111111",120]]],
 ["Cmetrick",[[" ","cm3",25]]],
 ["Cmetrick Mini",[[" ","cm2",25]]],
 ["Domino (2x3x3)",[[" ","223",25]]],
 ["Floppy Cube (1x3x3)",[["U D L R","flp",25]]],
 ["FTO (Face-Turning Octahedron)",[[" ","fto",25]]],
 ["Gigaminx",[["Pochmann","giga",300]]],
 ["Helicopter Cube",[[" ","heli",40]]],
 ["Pyraminx Crystal",[["Pochmann","prcp",70],["old style","prco",70]]],
 ["Siamese Cube (1x1x3 block)",[[" ","sia113",25]]],
 ["Siamese Cube (1x2x3 block)",[[" ","sia123",25]]],
 ["Siamese Cube (2x2x2 block)",[[" ","sia222",25]]],
 ["Square-2",[[" ","sq2",20]]],
 ["Super Floppy Cube",[[" ","sfl",25]]],
 ["Super Square-1",[["twist metric","ssq1t",20]]],
 ["UFO",[["Jaap style","ufo",25]]],
 ["===SPECIALTY SCRAMBLES===",[["--","blank",0]]],
 ["1x1x1",[["x y z","111",25]]],
 ["3x3x3 subsets",[["2-generator <R,U>","2gen",25],["2-generator <L,U>","2genl",25],
  ["Roux-generator <M,U>","roux",25],["3-generator <F,R,U>","3gen_F",25],["3-generator <R,U,L>","3gen_L",25],
  ["3-generator <R,r,U>","RrU",25],["half turns only","half",25],["edges only","edges",0],
  ["corners only","corners",0],["last layer","ll",0],["CMLL+LSE","cmll",0],
  ["last slot + last layer","lsll2",0],["ZBLL","zbll",0],["2GLL","2gll",0],["PLL","pll",0],["ZZ last slot + last layer","zzls",0],
  ["last slot + last layer (old)","lsll",15]]],
 ["Bandaged Cube (Bicube)",[["","bic",30]]],
 ["Bandaged Square-1 </,(1,0)>",[["twist metric","bsq",25]]],
 ["Bigcube subsets",[["<R,r,U,u>","RrUu",40],["4x4x4 edges","4edge",8],["5x5x5 edges","5edge",8],
  ["6x6x6 edges","6edge",8],["7x7x7 edges","7edge",8]]],
 ["Megaminx subsets",[["2-generator <R,U>","minx2g",30],["last slot + last layer","mlsll",20]]],
 ["Relays",[["lots of 3x3x3s","r3",5],["234 relay","r234",0],["2345 relay","r2345",0],["23456 relay","r23456",0],["234567 relay","r234567",0],["Guildford Challenge","guildford",0],["Mini Guildford Challenge","miniguild",0]]],
 ["===JOKE SCRAMBLES===",[["--","blank",0]]],
 ["-1x-1x-1 (micro style)",[[" ","-1",25]]],
 ["1x1x2",[[" ","112",25]]],
 ["3x3x3 for noobs",[[" ","333noob",25]]],
 ["LOL",[[" ","lol",25]]],
 ["Derrick Eide",[[" ","eide",25]]]];
