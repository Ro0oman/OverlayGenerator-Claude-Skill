// node tests/twitch_parse.test.js  → checks the Twitch IRC parser with real-looking lines
global.window = {}; require('../overlay-generator/assets/engine/twitch.js');
const T = window.OVGTwitch; let fails = 0;
const ev = l => T.toEvents(T.parseLine(l), 'en');
const eq = (a, b, m) => { const ok = JSON.stringify(a) === JSON.stringify(b); console.log((ok ? 'PASS ' : 'FAIL ') + m + (ok ? '' : ' → ' + JSON.stringify(a))); if (!ok) fails++; };
const L = {
  chat: '@badge-info=;badges=moderator/1;color=#1E90FF;display-name=NightOwl;id=a1;mod=1;subscriber=0 :nightowl!nightowl@nightowl.tmi.twitch.tv PRIVMSG #mika_aloft :!turb now',
  bits: '@badges=;bits=150;display-name=Tiny;id=b1 :tiny!tiny@tiny.tmi.twitch.tv PRIVMSG #mika_aloft :Cheer150 nice',
  sub: '@badges=;display-name=Newbie;id=s1;login=newbie;msg-id=sub;msg-param-sub-plan=1000 :tmi.twitch.tv USERNOTICE #mika_aloft',
  resub: '@display-name=Marta;id=r1;msg-id=resub;msg-param-cumulative-months=7;msg-param-sub-plan=1000 :tmi.twitch.tv USERNOTICE #mika_aloft :still here',
  gift: '@display-name=Gifter;id=g1;msg-id=subgift;msg-param-recipient-display-name=Lucky;msg-param-sub-plan=1000 :tmi.twitch.tv USERNOTICE #mika_aloft',
  giftInBomb: '@display-name=Gifter;id=g2;msg-id=subgift;msg-param-community-gift-id=123;msg-param-recipient-display-name=X :tmi.twitch.tv USERNOTICE #mika_aloft',
  bomb: '@display-name=Gifter;id=m1;msg-id=submysterygift;msg-param-mass-gift-count=5 :tmi.twitch.tv USERNOTICE #mika_aloft',
  anonBomb: '@id=m2;msg-id=anonsubmysterygift;msg-param-mass-gift-count=3 :tmi.twitch.tv USERNOTICE #mika_aloft',
  raid: '@display-name=BigFriend;id=x1;msg-id=raid;msg-param-displayName=BigFriend;msg-param-viewerCount=42 :tmi.twitch.tv USERNOTICE #mika_aloft',
  space: '@display-name=Ana\\sMaria;id=z1;msg-id=sub :tmi.twitch.tv USERNOTICE #mika_aloft'
};
const c = ev(L.chat)[0]; eq([c.type, c.name, c.text, c.role.mod, c.role.broadcaster], ['chat', 'NightOwl', '!turb now', true, false], 'chat line with mod badge');
eq(ev(L.bits).map(e => e.type + (e.amount || '')), ['chat', 'bits150'], 'cheer gives chat + bits');
eq(ev(L.sub).map(e => [e.type, e.name]), [['sub', 'Newbie']], 'sub');
eq(ev(L.resub).map(e => [e.type, e.months]), [['resub', 7]], 'resub with months');
eq(ev(L.gift).map(e => [e.type, e.to]), [['gift', 'Lucky']], 'single gift');
eq(ev(L.giftInBomb), [], 'gifts inside a bomb are not separate alerts');
eq(ev(L.bomb).map(e => [e.type, e.count]), [['bomb', 5]], 'sub bomb');
eq(ev(L.anonBomb).map(e => [e.type, e.name, e.count]), [['bomb', 'Anonymous', 3]], 'anonymous bomb');
eq(ev(L.raid).map(e => [e.type, e.name, e.viewers]), [['raid', 'BigFriend', 42]], 'raid');
eq(ev(L.space)[0].name, 'Ana Maria', 'escaped spaces in tags');
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
