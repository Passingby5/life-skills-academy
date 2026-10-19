// UI. Renders screens into #app. All actions are taps (data-act), guarded against double taps.
(function () {
  var KEY = 'lsa_save', app = document.getElementById('app');
  var guard = LSA.tapGuard(300);
  var U = { screen: 'home', notice: '', mm: null, age: null, name: '' };
  var ld = LSA.loadSave(localStorage.getItem(KEY));
  if (ld.broken) { try { localStorage.setItem(KEY + '_broken', localStorage.getItem(KEY)); } catch (e) { } U.notice = 'Your saved game could not be read, so we started fresh.'; }
  var S = ld.save;
  function save() { try { localStorage.setItem(KEY, LSA.dumpSave(S)); } catch (e) { } }
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function P() { return S.active ? S.profiles[S.active] : null; }
  function decks() { var all = LSA.knowDecks(); return (S.decks || all).filter(function (d) { return all.indexOf(d) >= 0; }); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function b(act, label, cls, extra) { return '<button data-act="' + act + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '>' + label + '</button>'; }
  function ver() { return '<div class="ver" id="ver">' + esc(LSA_BUILD.label) + '</div>'; }
  function ageName(a) { return a === 'ya' ? 'Young adults (15 to 30)' : 'Adults (30+)'; }
  function go(s) { U.screen = s; S.screen = s; save(); render(); window.scrollTo(0, 0); }

  var R = {};
  R.home = function () {
    var ids = Object.keys(S.profiles), h = '<h1>Life Skills Academy</h1><p>Know It: fast real life myths. Pick, say how sure you are, then see the fix.</p>';
    if (U.notice) h += '<p class="note">' + esc(U.notice) + '</p>';
    h += '<h2>Who is playing?</h2>';
    ids.forEach(function (id) { var p = S.profiles[id]; h += b('prof', '👤 ' + esc(p.name) + ' <span class="muted">' + (p.age === 'ya' ? '15 to 30' : '30+') + '</span>', '', ' data-id="' + id + '"'); });
    h += b('newprof', '➕ Add a player', 'main') + b('about', 'About and sources', 'ghost');
    return h + ver();
  };
  R.newprof = function () {
    var a = U.age, edit = U.edit;
    return '<h1>' + (edit ? 'Change age group' : 'New player') + '</h1>' +
      (edit ? '' : '<label for="nm">Name</label><input id="nm" maxlength="20" autocomplete="off" value="' + esc(U.name) + '">') +
      '<h2>Age group</h2>' + b('age', 'Young adults (15 to 30)', a === 'ya' ? 'on' : '', ' data-a="ya"') + b('age', 'Adults (30+)', a === 'adult' ? 'on' : '', ' data-a="adult"') +
      b('saveprof', 'Save', 'main', a ? '' : ' disabled') + b(edit ? 'menu' : 'home', 'Back', 'ghost');
  };
  R.menu = function () {
    var p = P(), live = p.round && p.round.stage !== 'done', seen = LSA.MM.seenCards(p, decks()).length;
    var h = '<h1>Hi, ' + esc(p.name) + '</h1><p class="muted">' + ageName(p.age) + ' · ' + Object.keys(p.boxes).length + ' cards seen · ' + p.stats.rounds + ' rounds</p>';
    h += b('play', live ? '▶ Resume round' : '▶ Play Gut Check', 'main');
    h += b('match', '🧩 Myth Match', 'alt', seen < 2 ? ' disabled' : '') + (seen < 2 ? '<p class="muted">Myth Match opens after you see a few cards.</p>' : '');
    h += '<h2>Decks</h2>';
    LSA.knowDecks().forEach(function (id) { var d = LSA.decks[id], on = decks().indexOf(id) >= 0; h += b('deck', d.icon + ' ' + esc(d.name) + (on ? ' ✓' : ''), on ? 'on' : 'ghost', ' data-id="' + id + '"'); });
    h += b('editage', 'Change age group', 'ghost') + b('about', 'About and sources', 'ghost') + b('home', 'Switch player', 'ghost');
    return h + ver();
  };
  R.play = function () {
    var p = P(), st = p.round;
    if (!st || st.stage === 'done') return R.recap();
    var it = LSA.GC.cur(st), c = LSA.GC.card(st), base = st.q.filter(function (x) { return !x.again; }).length;
    var top = '<div class="top"><span class="muted">Card ' + (st.i + 1) + ' of ' + st.q.length + (it.again ? ' · one more try' : '') + '</span>' + b('menu', 'Quit', 'ghost') + '</div>';
    if (st.stage === 'fix') return top + fix(c, it);
    var h = '<div class="play"><div class="card"><div class="scene" id="scene">' + esc(LSA.scenario(c, p.age)) + '</div>';
    if (st.stage === 'conf') h += '<p class="muted">How sure are you?</p>';
    h += '</div><div>';
    if (st.stage === 'ask') it.order.forEach(function (ci, pos) { h += b('ans', esc(c.c[ci]), 'ans', ' data-p="' + pos + '"'); });
    else {
      h += '<button class="pick" disabled>' + esc(c.c[it.order[it.pick]]) + '</button>';
      LSA.CONF.forEach(function (t, k) { h += b('conf', t, k === 2 ? 'main' : '', ' data-k="' + k + '"'); });
    }
    return top + h + '</div></div>';
  };
  function fix(c, it) {
    var d = LSA.decks[c.deck], s = d.sources[c.src];
    var h = '<div class="card fix" id="fix">';
    if (it.wow) h += '<div class="wow" id="wow">😮 Wow!</div><p class="muted">You were sure, but it was a myth. Big surprises stick best.</p>';
    h += '<p class="' + (it.right ? 'ok' : 'wrong') + '">' + (it.right ? '✅ You got it.' : '❌ Not this time.') + '</p>';
    h += '<p><span class="lab">Many people think:</span> ' + esc(c.m) + '</p><p class="wrong">That is wrong.</p>';
    h += '<p><span class="lab">Do this:</span> ' + esc(c.f) + '</p><p><span class="lab">Why:</span> ' + esc(c.w) + '</p>';
    h += '<a class="src" href="' + esc(s[1]) + '" target="_blank" rel="noopener">Source: ' + esc(s[0]) + '</a></div>';
    return h + b('next', 'Next', 'main');
  }
  R.recap = function () {
    var p = P(), st = p.round;
    if (!st) return R.menu();
    var h = '<h1>Round done</h1><p>You got ' + st.right + ' of ' + st.q.length + ' right.</p><div class="card" id="recap"><h2>😮 Wow cards</h2>';
    if (!st.wows.length) h += '<p class="muted">No Wow cards this round. No sure-but-wrong answers.</p>';
    else h += '<ul class="list">' + st.wows.map(function (id) { var c = LSA.cardIndex[id]; return '<li><b>Myth:</b> ' + esc(c.m) + '<br><b>Fix:</b> ' + esc(c.f) + '</li>'; }).join('') + '</ul>';
    return h + '</div>' + b('play', 'Play another round', 'main') + b('match', '🧩 Myth Match', 'alt') + b('menu', 'Menu', 'ghost');
  };
  R.match = function () {
    var st = U.mm;
    if (!st) return R.menu();
    var h = '<div class="top"><h1>Myth Match</h1>' + b('menu', 'Back', 'ghost') + '</div><p class="muted">Tap a myth (blue), then its fix (green).</p><div class="tiles" id="tiles">';
    st.tiles.forEach(function (t, i) {
      var c = LSA.cardIndex[t.id], cls = 'tile ' + t.k + (st.cleared[i] ? ' gone' : '') + (st.sel === i ? ' sel' : '') + (U.miss && U.miss.indexOf(i) >= 0 ? ' miss' : '');
      h += b('tile', esc(t.k === 'm' ? c.m : c.f), cls, ' data-i="' + i + '"');
    });
    h += '</div>';
    if (st.done) h += '<p class="ok" id="mmdone">🎉 All matched in ' + st.tries + ' tries!</p>' + b('match', 'Play again', 'main') + b('menu', 'Menu', 'ghost');
    return h;
  };
  R.about = function () {
    var h = '<div class="top"><h1>About</h1>' + b(P() ? 'menu' : 'home', 'Back', 'ghost') + '</div>';
    h += '<p>Each card is a real moment where the quick answer is often wrong. You pick, say how sure you are, then see the fix and its source. Cards come back on a schedule (1, 3, 7, 14 days) when you get them right. Built for families. No ads, no account, your progress stays on this phone.</p>';
    h += '<h2>Why it works</h2><ul class="list" id="research">';
    LSA.RESEARCH.forEach(function (r) { h += '<li>' + esc(r[0]) + '<br><span class="muted">' + esc(r[1]) + '</span><a class="src" href="' + r[2] + '" target="_blank" rel="noopener">' + r[2] + '</a></li>'; });
    h += '</ul><p class="muted">The real life scene format is our design choice. We did not find one strong review that proves scenes beat plain questions.</p><h2>Card sources</h2>';
    LSA.knowDecks().forEach(function (id) {
      var d = LSA.decks[id]; h += '<h2>' + d.icon + ' ' + esc(d.name) + '</h2><ul class="list">';
      Object.keys(d.sources).forEach(function (k) { h += '<li><a class="src" data-sid="' + k + '" href="' + esc(d.sources[k][1]) + '" target="_blank" rel="noopener">' + esc(d.sources[k][0]) + '</a></li>'; });
      h += '</ul>';
    });
    h += '<p class="muted">This is general info, not medical, legal or money advice. In an emergency call 911.</p>';
    return h + ver();
  };

  function render() { app.innerHTML = (R[U.screen] || R.home)(); }

  var A = {
    home: function () { U.notice = ''; S.active = null; go('home'); },
    menu: function () { go(P() ? 'menu' : 'home'); },
    about: function () { go('about'); },
    prof: function (el) { S.active = el.dataset.id; U.notice = ''; go('menu'); },
    newprof: function () { U.age = null; U.name = ''; U.edit = false; go('newprof'); },
    editage: function () { U.age = P().age; U.edit = true; go('newprof'); },
    age: function (el) { var nm = document.getElementById('nm'); if (nm) U.name = nm.value; U.age = el.dataset.a; render(); },
    saveprof: function () {
      if (!U.age) return;
      if (U.edit) { var p = P(); if (p.age !== U.age) { p.age = U.age; p.round = null; } }
      else { var nm = document.getElementById('nm'); LSA.addProfile(S, (nm && nm.value.trim()) || 'Player', U.age); }
      go('menu');
    },
    deck: function (el) {
      var cur = decks(), id = el.dataset.id, i = cur.indexOf(id);
      if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); } else cur.push(id);
      S.decks = cur; P().round = null; save(); render();
    },
    play: function () {
      var p = P();
      if (!p.round || p.round.stage === 'done') p.round = LSA.GC.start(p, decks(), today(), (Date.now() ^ (Math.random() * 1e9)) >>> 0);
      go('play');
    },
    ans: function (el) { LSA.GC.pick(P().round, +el.dataset.p); save(); render(); },
    conf: function (el) { LSA.GC.confirm(P().round, P(), +el.dataset.k); save(); render(); window.scrollTo(0, 0); },
    next: function () { LSA.GC.next(P().round, P()); go('play'); },
    match: function () { U.mm = LSA.MM.start(P(), decks(), (Date.now() ^ (Math.random() * 1e9)) >>> 0, 4); U.miss = null; go(U.mm ? 'match' : 'menu'); },
    tile: function (el) {
      var i = +el.dataset.i, j = U.mm.sel, res = LSA.MM.tap(U.mm, i);
      U.miss = res === 'miss' ? [i, j] : null; render();
      if (res === 'miss') setTimeout(function () { U.miss = null; if (U.screen === 'match') render(); }, 600);
    }
  };
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    var act = el.dataset.act;
    // One guard for the whole screen: a double tap never counts twice, even when the screen changes under the finger.
    if (!guard('tap', Date.now())) return;
    if (A[act]) A[act](el);
  });
  // Resume where we left off (also after an auto update reload).
  if (P() && S.screen && ['menu', 'play', 'about'].indexOf(S.screen) >= 0) U.screen = S.screen;
  LSA.UI = { save: save, S: function () { return S; }, U: U, render: render };
  render();
})();
