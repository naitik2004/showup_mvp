(function(){var $=function(s){return document.querySelector(s)},iv=[],setInterval=function(f,t){var i=window.setInterval(f,t);iv.push(i);return i};
window.boardStop=function(){iv.forEach(clearInterval);iv=[]};
window.boardInit=function(){boardStop();
var CH=' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:';
function mk(el,n){var h='';for(var i=0;i<n;i++)h+='<span class="f" data-c=" "> </span>';el.innerHTML=h}
function pulse(c){c.classList.remove('t');void c.offsetWidth;c.classList.add('t')}
function put(el,str,d){d=d||0;str=String(str).toUpperCase();var cs=el.children;for(var i=0;i<cs.length;i++){(function(c,i){var t=str.charAt(i)||' ';if(c.dataset.c===t)return;var k=0,n=3+Math.floor(Math.random()*4);setTimeout(function(){(function step(){if(k<n){c.textContent=CH.charAt(Math.floor(Math.random()*CH.length));pulse(c);k++;setTimeout(step,58)}else{c.textContent=t;c.dataset.c=t;pulse(c)}})()},d+i*26)})(cs[i],i)}}
/* games */
var P=window.boardData();
var rows=[],pool=P.slice(),R=$('#rows');
function st(g){return g.me?'YOU':g.l?'LIVE':g.j>=g.c?'FULL':'OPEN'}
function sp(g){var n=g.c-g.j;return g.l?'LIVE':n<=0?'FULL':n+' LEFT'}
function cls(g){var s=st(g);return 'g st '+(s==='YOU'?'y':s==='LIVE'?'l':s==='FULL'?'x':'o')}
function build(i){var e=document.createElement('div');e.className='rw';e.innerHTML='<div class="g tm"></div><div class="g sp"></div><div class="g pn"></div><div class="g sc"></div><div class="'+cls({})+'"></div><button class="jb">JOIN →</button>';R.appendChild(e);[['.tm',5],['.sp',10],['.pn',16],['.sc',7],['.st',4]].forEach(function(a){mk(e.querySelector(a[0]),a[1])});return e}
function paint(r,d,full){var g=r.g,e=r.e;if(full){put(e.querySelector('.tm'),g.t,d);put(e.querySelector('.sp'),g.s,d+60);put(e.querySelector('.pn'),g.p,d+120)}put(e.querySelector('.sc'),sp(g),d+(full?180:0));put(e.querySelector('.st'),st(g),d+(full?220:40));e.querySelector('.st').className=cls(g);var dead=g.l||g.j>=g.c||g.me;e.classList.toggle('x',!g.me&&(g.l||g.j>=g.c));e.classList.toggle('me',g.me);var b=e.querySelector('.jb');b.disabled=dead;b.textContent=g.me?'✓ IN':g.l?'LIVE':g.j>=g.c?'FULL':'JOIN →'}
function setRow(r,g,d){r.g=g;paint(r,d,true)}
var started=false;function start(){if(started)return;started=true;for(var i=0;i<6;i++){var e=build(i),g=pool.splice(Math.floor(Math.random()*pool.length),1)[0],r={e:e,g:g};rows.push(r);e.querySelector('.jb').onclick=(function(r){return function(){join(r)}})(r);setRow(r,g,i*220)}
setInterval(function(){var o=rows.filter(function(r){return !r.g.l&&r.g.j<r.g.c-0&&!r.g.me&&!r.g.gid});if(!o.length)return;var r=o[Math.floor(Math.random()*o.length)];r.g.j++;paint(r,0,false)},2600);
setInterval(function(){var o=rows.filter(function(r){return !r.g.me});var r=o[Math.floor(Math.random()*o.length)];pool.push(r.g);var g=pool.splice(Math.floor(Math.random()*(pool.length-1)),1)[0];if(g.me)g.me=false;setRow(r,g,0)},5600)}
var tt;function toast(h){var t=$('#toast');t.innerHTML=h;t.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('on')},4200)}
function join(r){var g=r.g;if(g.gid)return window.boardJoin(g.gid);var last=g.c-g.j===1,b=r.e.querySelector('.jb');b.disabled=true;b.textContent='...';setTimeout(function(){if(last&&Math.random()<.5){g.j=g.c;paint(r,0,false);toast('<b>Spot taken.</b> Kabir tapped 0.2s earlier. The database gives the last seat to exactly one player. 3 more games nearby.')}else{g.j++;g.me=true;paint(r,0,false);toast('<b>You’re in.</b> '+g.s.toLowerCase()+' at '+g.p.toLowerCase()+', '+g.t+'. Your match pass is ready.')}},700)}
new IntersectionObserver(function(es,o){if(es[0].isIntersecting){start();o.disconnect()}},{threshold:.15}).observe($('#board'));
setTimeout(start,1800);
function clock(){var d=new Date();$('#clk').textContent=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}clock();setInterval(clock,10000)}})();
