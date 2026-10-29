"""Mock of obs-websocket v5 for the tests: auth, scenes, inputs, scene items, persistent data, custom events.
   python3 tests/mock_obs.py <password>   (listens on 127.0.0.1:4455)"""
import asyncio, base64, hashlib, json, os, sys
import websockets

PASSWORD = sys.argv[1] if len(sys.argv) > 1 else 'clave123'
clients = {}            # ws -> eventSubscriptions
scenes = {}             # name -> [ {sceneItemId, sourceName, sceneItemEnabled} ]
inputs = {}             # name -> {kind, settings}
persistent = {}
program = {'scene': None}
next_id = [1]
log = open(os.devnull, 'w')
transforms = {}


def b64sha(s):
    return base64.b64encode(hashlib.sha256(s.encode()).digest()).decode()


async def emit(event_type, data, category_bit):
    msg = json.dumps({'op': 5, 'd': {'eventType': event_type, 'eventIntent': category_bit, 'eventData': data}})
    for c, subs in list(clients.items()):
        if subs & category_bit:
            try:
                await c.send(msg)
            except Exception:
                pass


async def handle_request(t, d):
    """Returns (ok, code, responseData, comment)."""
    if t == 'BroadcastCustomEvent':
        await emit('CustomEvent', d['eventData'], 1)
        return True, 100, None, ''
    if t == 'CreateScene':
        if d['sceneName'] in scenes:
            return False, 601, None, 'A scene with that name already exists.'
        scenes[d['sceneName']] = []
        return True, 100, {'sceneUuid': 'u-' + d['sceneName']}, ''
    if t == 'CreateInput':
        if d['inputName'] in inputs:
            return False, 601, None, 'A source already exists by that input name.'
        if d.get('sceneName') not in scenes:
            return False, 600, None, 'No scene was found by that name.'
        inputs[d['inputName']] = {'kind': d['inputKind'], 'settings': d.get('inputSettings', {})}
        sid = next_id[0]; next_id[0] += 1
        scenes[d['sceneName']].append({'sceneItemId': sid, 'sourceName': d['inputName'], 'sceneItemEnabled': d.get('sceneItemEnabled', True)})
        return True, 100, {'inputUuid': 'i-' + d['inputName'], 'sceneItemId': sid}, ''
    if t == 'SetInputSettings':
        if d['inputName'] not in inputs:
            return False, 600, None, 'No source was found.'
        inputs[d['inputName']]['settings'].update(d['inputSettings'])
        return True, 100, None, ''
    if t == 'RemoveInput':
        if d['inputName'] not in inputs:
            return False, 600, None, 'No source was found.'
        del inputs[d['inputName']]
        for items in scenes.values():
            items[:] = [i for i in items if i['sourceName'] != d['inputName']]
        return True, 100, None, ''
    if t == 'GetInputKindList':
        return True, 100, {'inputKinds': ['browser_source', 'color_source', 'color_source_v2', 'color_source_v3', 'image_source', 'text_gdiplus_v3']}, ''
    if t == 'GetSceneItemList':
        if d.get('sceneName') not in scenes:
            return False, 600, None, 'No scene was found by that name.'
        return True, 100, {'sceneItems': scenes[d['sceneName']]}, ''
    if t == 'SetSceneItemEnabled':
        for it in scenes.get(d['sceneName'], []):
            if it['sceneItemId'] == d['sceneItemId']:
                changed = it['sceneItemEnabled'] != d['sceneItemEnabled']
                it['sceneItemEnabled'] = d['sceneItemEnabled']
                if changed:
                    await emit('SceneItemEnableStateChanged', {'sceneName': d['sceneName'], 'sceneUuid': 'u-' + d['sceneName'],
                                                               'sceneItemId': d['sceneItemId'], 'sceneItemEnabled': d['sceneItemEnabled']}, 1 << 7)
                return True, 100, None, ''
        return False, 600, None, 'No scene item found.'
    if t == 'GetPersistentData':
        return True, 100, {'slotValue': persistent.get((d['realm'], d['slotName']))}, ''
    if t == 'SetPersistentData':
        persistent[(d['realm'], d['slotName'])] = d['slotValue']
        return True, 100, None, ''
    if t == 'GetSceneItemId':
        for it in scenes.get(d['sceneName'], []):
            if it['sourceName'] == d['sourceName']:
                return True, 100, {'sceneItemId': it['sceneItemId']}, ''
        return False, 600, None, 'No scene items were found.'
    if t == 'CreateSceneItem':
        if d['sceneName'] not in scenes or d['sourceName'] not in inputs:
            return False, 600, None, 'Not found.'
        sid = next_id[0]; next_id[0] += 1
        scenes[d['sceneName']].append({'sceneItemId': sid, 'sourceName': d['sourceName'], 'sceneItemEnabled': d.get('sceneItemEnabled', True)})
        return True, 100, {'sceneItemId': sid}, ''
    if t == 'SetSceneItemIndex':
        items = scenes.get(d['sceneName'], [])
        it = next((i for i in items if i['sceneItemId'] == d['sceneItemId']), None)
        if not it: return False, 600, None, 'No scene item.'
        items.remove(it); items.insert(min(d['sceneItemIndex'], len(items)), it)
        return True, 100, None, ''
    if t == 'SetSceneItemTransform':
        transforms[(d['sceneName'], d['sceneItemId'])] = d['sceneItemTransform']
        return True, 100, None, ''
    if t == 'GetCurrentProgramScene':
        return True, 100, {'currentProgramSceneName': program['scene'], 'sceneName': program['scene']}, ''
    if t == 'SetCurrentProgramScene':
        if d['sceneName'] not in scenes:
            return False, 600, None, 'No scene.'
        program['scene'] = d['sceneName']
        await emit('CurrentProgramSceneChanged', {'sceneName': d['sceneName']}, 1 << 2)
        return True, 100, None, ''
    if t == 'MockDump':   # tests only
        return True, 100, {'scenes': scenes, 'inputs': inputs, 'transforms': {f'{k[0]}|{k[1]}': v for k, v in transforms.items()}, 'program': program['scene'], 'persistent': {f'{k[0]}|{k[1]}': v for k, v in persistent.items()}}, ''
    return False, 204, None, 'Unknown request type.'


async def handler(ws):
    salt = base64.b64encode(os.urandom(32)).decode()
    challenge = base64.b64encode(os.urandom(32)).decode()
    await ws.send(json.dumps({'op': 0, 'd': {'obsStudioVersion': '32.0.1', 'obsWebSocketVersion': '5.6.0', 'rpcVersion': 1,
                                              'authentication': {'challenge': challenge, 'salt': salt}}}))
    try:
        async for raw in ws:
            m = json.loads(raw)
            if m['op'] == 1:
                if m['d'].get('authentication') != b64sha(b64sha(PASSWORD + salt) + challenge):
                    await ws.close(4009, 'Authentication failed.')
                    return
                clients[ws] = m['d'].get('eventSubscriptions', 0x7FF)
                await ws.send(json.dumps({'op': 2, 'd': {'negotiatedRpcVersion': 1}}))
            elif m['op'] == 6 and ws in clients:
                d = m['d']
                ok, code, data, comment = await handle_request(d['requestType'], d.get('requestData') or {})
                log.write('%s %s %s\n' % (d['requestType'], 'ok' if ok else 'ERR', code))
                resp = {'requestType': d['requestType'], 'requestId': d['requestId'], 'requestStatus': {'result': ok, 'code': code}}
                if comment:
                    resp['requestStatus']['comment'] = comment
                if data is not None:
                    resp['responseData'] = data
                await ws.send(json.dumps({'op': 7, 'd': resp}))
    finally:
        clients.pop(ws, None)


async def main():
    async with websockets.serve(handler, '127.0.0.1', 4455):
        await asyncio.Future()

asyncio.run(main())
