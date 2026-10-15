/* obs-link.js · OverlayGenerator engine
   Minimal client for the WebSocket server built into OBS (obs-websocket v5).
   It works as a mailman: one page sends a message and OBS hands it to every other connected page.

     const link = new ObsLink({ password, onMessage(msg){}, onStatus(s){}, onEvent(type, data){} });
     link.send({ type: 'state', ... });             // every other page receives it
     const r = await link.request('CreateScene', {sceneName});   // { ok, code, comment, data }

   Status codes: connecting · connected · no-password · bad-password · disconnected · error
*/
(function () {
  const APP = 'ovg';           // tag to ignore custom events from other tools
  const enc = new TextEncoder();

  // ---- Pure JS SHA-256: crypto.subtle is missing in non-secure contexts such as local files in OBS ----
  const K = [], H0 = [];
  (function () {
    const isPrime = n => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
    const frac = x => ((x - Math.floor(x)) * 4294967296) >>> 0;
    for (let n = 2, k = 0; k < 64; n++) {
      if (!isPrime(n)) continue;
      if (k < 8) H0[k] = frac(Math.sqrt(n));
      K[k++] = frac(Math.cbrt(n));
    }
  })();
  const ror = (x, n) => (x >>> n) | (x << (32 - n));
  function sha256(bytes) {
    const l = bytes.length, padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    padded.set(bytes); padded[l] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, (l * 8) >>> 0);
    dv.setUint32(padded.length - 8, Math.floor(l / 536870912));
    const W = new Uint32Array(64), H = H0.slice();
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = ror(W[t - 15], 7) ^ ror(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = ror(W[t - 2], 17) ^ ror(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) >>> 0;
        const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, k) => { H[k] = (H[k] + v) >>> 0; });
    }
    const out = new Uint8Array(32), odv = new DataView(out.buffer);
    H.forEach((v, k) => odv.setUint32(k * 4, v));
    return out;
  }
  const b64 = bytes => btoa(String.fromCharCode(...bytes));
  const authString = (password, salt, challenge) => b64(sha256(enc.encode(b64(sha256(enc.encode(password + salt))) + challenge)));

  // ---- Connection ----
  class ObsLink {
    constructor(opts) {
      this.url = opts.url || 'ws://127.0.0.1:4455';
      this.password = opts.password || '';
      this.onMessage = opts.onMessage || (() => {});
      this.onStatus = opts.onStatus || (() => {});
      this.onEvent = opts.onEvent || (() => {});               // regular OBS events (scene item shown/hidden, scene changed…)
      this.pending = new Map();                                // requests waiting for an answer
      this.subs = opts.subscriptions || ((1 << 0) | (1 << 2) | (1 << 7));   // General (CustomEvent) · Scenes · SceneItems
      this.id = Math.random().toString(36).slice(2, 10);   // to recognise my own messages
      this.ready = false;
      this.retry = 0;
      this.n = 0;
      this.connect();
    }

    status(state, detail) { this.state = state; this.onStatus({ state, detail: detail || '' }); }

    connect() {
      this.status('connecting');
      let ws;
      try { ws = new WebSocket(this.url); } catch (e) { this.status('error', e.message); return this.later(); }
      this.ws = ws;
      ws.onmessage = ev => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (m.op === 0) {                                     // Hello
          const ident = { rpcVersion: 1, eventSubscriptions: this.subs };
          const auth = m.d && m.d.authentication;
          if (auth) {
            if (!this.password) { this.status('no-password', 'OBS asks for a password'); ws.close(); return; }
            ident.authentication = authString(this.password, auth.salt, auth.challenge);
          }
          ws.send(JSON.stringify({ op: 1, d: ident }));       // Identify
        } else if (m.op === 2) {                              // Identified
          this.ready = true; this.retry = 0;
          this.status('connected', 'obs-websocket v5');
        } else if (m.op === 5 && m.d && m.d.eventType === 'CustomEvent') {
          const data = m.d.eventData;
          if (data && data.app === APP && data.from !== this.id) this.onMessage(data.msg, data);
        } else if (m.op === 5 && m.d) {
          this.onEvent(m.d.eventType, m.d.eventData || {});
        } else if (m.op === 7 && m.d) {
          const st = m.d.requestStatus || {};
          const p = this.pending.get(m.d.requestId);
          if (p) { this.pending.delete(m.d.requestId); p({ ok: !!st.result, code: st.code, comment: st.comment || '', data: m.d.responseData || {} }); }
          else if (!st.result) console.warn('OBS refused', m.d.requestType, st);
        }
      };
      ws.onclose = ev => {
        const wasReady = this.ready;
        this.ready = false;
        this.pending.forEach(p => p({ ok: false, code: -1, comment: 'connection closed', data: {} }));
        this.pending.clear();
        // 4009 = wrong password (obs-websocket v5)
        if (ev.code === 4009) this.status('bad-password', 'Wrong password');
        else if (this.state !== 'no-password') this.status('disconnected', wasReady ? 'closed' : 'not-found');
        if (ev.code !== 4009 && this.state !== 'no-password') this.later();
      };
      ws.onerror = () => {};
    }

    later() { clearTimeout(this.t); this.t = setTimeout(() => this.connect(), Math.min(10000, 1000 * ++this.retry)); }

    setPassword(pw) {
      this.password = pw;
      clearTimeout(this.t);
      try { this.ws && this.ws.close(); } catch (e) { /* ignore */ }
      this.ready = false;
      setTimeout(() => this.connect(), 100);
    }

    send(msg) {
      if (!this.ready) return false;
      this.ws.send(JSON.stringify({ op: 6, d: {
        requestType: 'BroadcastCustomEvent',
        requestId: this.id + '-' + (++this.n),
        requestData: { eventData: { app: APP, from: this.id, msg } }
      } }));
      return true;
    }

    // Regular OBS request (create scene, create input…). Resolves to { ok, code, comment, data }.
    request(requestType, requestData) {
      return new Promise(resolve => {
        if (!this.ready) return resolve({ ok: false, code: -1, comment: 'not connected to OBS', data: {} });
        const requestId = this.id + '-' + (++this.n);
        this.pending.set(requestId, resolve);
        this.ws.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData: requestData || {} } }));
        setTimeout(() => { if (this.pending.delete(requestId)) resolve({ ok: false, code: -2, comment: 'OBS did not answer', data: {} }); }, 8000);
      });
    }
  }

  window.ObsLink = ObsLink;
  window.__obsLinkTest = { sha256, b64, authString };   // tests only
})();
