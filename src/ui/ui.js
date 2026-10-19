// UI. Renders screens into #app. All actions are taps (data-act), guarded against double taps.
(function () {
  var KEY = 'lsa_save', app = document.getElementById('app');
  var guard = LSA.tapGuard(300);
  var U = { screen: 'home', notice: '', mm: null, age: null, name: '' };
  var FRESH = 'Your saved game could not be read, so we started fresh.';
  var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { }
  var ld = LSA.loadSave(raw);
  function backup() { try { if (raw) localStorage.setItem(KEY + '_broken', raw); } catch (e) { } }
  if (ld.broken) { backup(); U.notice = FRESH; }
  else if (ld.repaired) { backup(); U.notice = 'Part of your saved game could not be read and was reset.'; }
  var S = ld.save;
  function save() { try { localStorage.setItem(KEY, LSA.dumpSave(S)); } catch (e) { } }
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function P() { return S.active ? S.profiles[S.active] : null; }
  function decks() { var all = LSA.knowDecks(); return (S.decks || LSA.defaultDecks()).filter(function (d) { return all.indexOf(d) >= 0; }); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function b(act, label, cls, extra) { return '<button data-act="' + act + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '>' + label + '</button>'; }
  function ver() { return '<div class="ver" id="ver">' + esc(LSA_BUILD.label) + '</div>'; }
  function ageName(a) { return a === 'ya' ? 'Young adults (15 to 30)' : 'Adults (30+)'; }
  // Back button support: screens past the menu push a history entry, so Back returns to the menu.
  function go(s) {
    var deep = ['about', 'match', 'newprof', 'play'].indexOf(s) >= 0;
    try { if (deep && U.screen !== s) history.pushState({ s: s }, ''); else history.replaceState({ s: s }, ''); } catch (e) { }
    U.screen = s; S.screen = s; save(); render(); window.scrollTo(0, 0);
  }
  window.addEventListener('popstate', function () {
    var to = P() ? 'menu' : 'home';
    if (U.screen === to) return;
    U.screen = to; S.screen = to; save(); render(); window.scrollTo(0, 0);
  });

  // Deck picker grouped by section. Each section folds open; Everyday and any section with a deck on start open.
  function picker() {
    var on = decks(), h = '<div class="picker" id="picker">';
    LSA.sectionsOf(LSA.knowDecks()).forEach(function (g) {
      var n = g.ids.filter(function (id) { return on.indexOf(id) >= 0; }).length, open = g.name === 'Everyday' || n > 0;
      h += '<details class="sect"' + (open ? ' open' : '') + ' data-sect="' + esc(g.name) + '"><summary>' + esc(g.name) + ' <span class="muted">' + n + ' of ' + g.ids.length + ' on</span></summary><div class="decks">';
      g.ids.forEach(function (id) { var d = LSA.decks[id], k = on.indexOf(id) >= 0; h += b('deck', d.icon + ' ' + esc(d.name) + (k ? ' ✓' : ''), k ? 'on' : 'ghost', ' data-id="' + id + '" aria-pressed="' + k + '"'); });
      h += '</div></details>';
    });
    return h + '</div>';
  }
  function pic(c) { return c.img ? '<img class="cimg" src="' + esc(c.img) + '" alt="' + esc(LSA.imgAlt(c)) + '">' : ''; }
  var R = {};
  R.home = function () {
    var ids = Object.keys(S.profiles), h = '<h1>Life Skills Academy</h1><p>Know It: fast real life myths. Pick, say how sure you are, then see the fix.</p>';
    if (U.notice) h += '<p class="note">' + esc(U.notice) + '</p>';
    h += '<h2>Who is playing?</h2>';
    ids.forEach(function (id) { var p = S.profiles[id]; h += b('prof', '👤 ' + esc(p.name) + ' <span class="muted">' + (p.age === 'ya' ? '15 to 30' : '30+') + '</span>', '', ' data-id="' + id + '"'); });
    h += b('newprof', '➕ Add a player', 'main');
    if (ids.length) h += '<h2>Decks</h2>' + picker();
    h += b('about', 'About and sources', 'ghost');
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
    var h = (U.notice ? '<p class="note">' + esc(U.notice) + '</p>' : '') + '<h1>Hi, ' + esc(p.name) + '</h1><p class="muted">' + ageName(p.age) + ' · ' + Object.keys(p.boxes).length + ' cards seen · ' + p.stats.rounds + ' rounds</p>';
    h += b('play', live ? '▶ Resume round' : '▶ Play Gut Check', 'main');
    h += b('match', '🧩 Myth Match', 'alt', seen < 2 ? ' disabled' : '') + (seen < 2 ? '<p class="muted">Myth Match opens after you see a few cards.</p>' : '');
    h += '<h2>Decks</h2>' + (live ? '<p class="muted" id="decknote">Deck changes start with your next round. Your round in progress is kept.</p>' : '');
    h += picker();
    h += b('editage', 'Change age group', 'ghost') + b('about', 'About and sources', 'ghost') + b('home', 'Switch player', 'ghost') + b('delask', 'Delete this player', 'ghost danger');
    return h + ver();
  };
  R.delask = function () {
    var p = P();
    return '<h1>Delete ' + esc(p.name) + '?</h1><p>This removes this player and all of their progress from this phone. It cannot be undone.</p>' +
      b('delyes', 'Yes, delete ' + esc(p.name), 'danger') + b('menu', 'Cancel, keep this player', 'main');
  };
  R.play = function () {
    var p = P(), st = p.round;
    if (!st || st.stage === 'done') return R.recap();
    var it = LSA.GC.cur(st), c = LSA.GC.card(st), pr = LSA.GC.progress(st);
    var top = '<div class="top"><span class="muted" id="prog">' + (pr.retry ? 'One more try (card ' + pr.n + ' of ' + pr.total + ')' : 'Card ' + pr.n + ' of ' + pr.total) + '</span>' + b('menu', 'Quit', 'ghost') + '</div>';
    if (st.stage === 'fix') return top + fix(c, it);
    var h = '<div class="play"><div class="card">' + pic(c) + '<div class="scene" id="scene">' + esc(LSA.scenario(c, p.age)) + '</div>';
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
    var h = '<div class="card fix" id="fix">' + pic(c);
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
    var tries = st.q.length - LSA.GC.progress(st).total;
    var h = '<h1>Round done</h1><p>You got ' + st.right + ' of ' + st.q.length + ' answers right' + (tries === 1 ? ' (1 was a second try)' : tries ? ' (' + tries + ' were second tries)' : '') + '.</p><div class="card" id="recap"><h2>😮 Wow cards</h2>';
    if (!st.wows.length) h += '<p class="muted">No Wow cards this round. No sure-but-wrong answers.</p>';
    else h += '<ul class="list">' + st.wows.map(function (id) { var c = LSA.cardIndex[id]; return '<li><b>Myth:</b> ' + esc(c.m) + '<br><b>Fix:</b> ' + esc(c.f) + '</li>'; }).join('') + '</ul>';
    if (st.carried && st.carried.length) h += '<p class="muted" id="carry">' + (st.carried.length === 1 ? '1 card you missed at the end comes back first next round.' : st.carried.length + ' cards you missed at the end come back first next round.') + '</p>';
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

  // After any screen change, ignore all taps for 350 ms, so a double tap never lands on the next screen's button.
  var LOCK_MS = 350, lockUntil = 0, lastKey = null;
  function screenKey() {
    var p = P(), st = p && p.round;
    if (U.screen === 'play' && st) return 'play:' + st.i + ':' + st.stage;
    if (U.screen === 'match') return 'match:' + !!(U.mm && U.mm.done);
    return U.screen;
  }
  function render() {
    app.innerHTML = (R[U.screen] || R.home)();
    var k = screenKey();
    if (lastKey !== null && k !== lastKey) lockUntil = Date.now() + LOCK_MS;
    lastKey = k;
  }

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
      S.decks = cur; save(); render();
    },
    delask: function () { go('delask'); },
    delyes: function () { LSA.deleteProfile(S, S.active); U.notice = ''; go('home'); },
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
    var act = el.dataset.act, key = act + ':' + (el.dataset.i || el.dataset.p || el.dataset.k || el.dataset.id || el.dataset.a || '');
    // Per control: two taps on the same control within 300 ms count as one. Other controls work right away.
    if (Date.now() < lockUntil) return;
    if (!guard(key, Date.now())) return;
    U.notice = '';
    try { if (A[act]) A[act](el); }
    catch (err) {
      // Never leave a blank page: drop the round that broke and go back to the menu.
      var p = P(); if (p) p.round = null; U.notice = 'Something went wrong, so that round was reset.'; U.screen = p ? 'menu' : 'home'; save(); render();
    }
  });
  // Resume where we left off (also after an auto update reload).
  if (P()) U.screen = ['play', 'about'].indexOf(S.screen) >= 0 ? S.screen : 'menu';
  LSA.UI = { save: save, S: function () { return S; }, U: U, render: render };
  // Any error at startup shows the fresh-start notice instead of a blank page.
  try { try { history.replaceState({ s: U.screen }, ''); } catch (e) { } render(); }
  catch (e) {
    backup(); S = LSA.newSave(); U.screen = 'home'; U.notice = FRESH;
    try { localStorage.setItem(KEY, LSA.dumpSave(S)); } catch (e2) { }
    render();
  }
})();
