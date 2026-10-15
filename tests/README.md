# Tests

```bash
node tests/twitch_parse.test.js                       # Twitch chat parser
python3 overlay-generator/scripts/build_pack.py overlay-generator/assets/example/flight-deck --out /tmp/ovg
python3 tests/mock_obs.py secret1 &                    # fake OBS on 127.0.0.1:4455
NODE_PATH=$(npm root -g) node tests/e2e_obs.test.js /tmp/ovg/mika-flight-deck
```

`e2e_obs.test.js` drives the real panel and overlay in Chromium against the fake OBS: wrong and right password, Install in OBS (twice, no duplicates), the hotkey trick, mod-only chat commands, alerts with their effects, holding alerts, restoring the state after clearing the cache, and the "panel closed" notice.
