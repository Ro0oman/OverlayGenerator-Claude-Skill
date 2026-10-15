const {chromium}=require('playwright');
const DIR=process.argv[2];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);c?pass++:fail++;};
(async()=>{
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:460,height:900}});
 const errs=[];
 const panel=await ctx.newPage();panel.on('pageerror',e=>errs.push('panel:'+e.message));
 await panel.goto('file://'+DIR+'/panel.html?tab=setup');await sleep(600);
 await panel.fill('[data-field="__pw"]','wrong');await panel.click('[data-connect]');await sleep(1500);
 ok(await panel.evaluate(()=>document.querySelector('#pills').textContent.includes('wrong password')),'bad password is reported');
 await panel.fill('[data-field="__pw"]','secret1');await panel.click('[data-connect]');await sleep(2000);
 ok(await panel.evaluate(()=>document.querySelector('#pills').textContent.includes('connected')),'connects with the right password');
 await panel.click('[data-install]');await sleep(4000);
 const ovp=await ctx.newPage();ovp.on('pageerror',e=>errs.push('overlay:'+e.message));
 await ovp.goto('file://'+DIR+'/overlays/flight.html?pw=secret1');await sleep(2500);
 const dump=await ovp.evaluate(()=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){const r=await l.request('MockDump',{});res(r.data);}}});}));
 const sc=Object.keys(dump.scenes);
 ok(sc.length===6 && sc.includes('MK-21 · In flight') && sc.includes('MK-21 · Controls'),'install creates 5 scenes + controls: '+sc.join(', '));
 const inp=dump.inputs['MK-21 · In flight · overlay'];
 ok(inp && inp.kind==='browser_source' && /overlays\/flight\.html\?pw=secret1$/.test(inp.settings.url) && inp.settings.shutdown===false,'browser source url+settings ok');
 ok(dump.scenes['MK-21 · Controls'].length===4 && dump.scenes['MK-21 · Controls'].every(i=>!i.sceneItemEnabled),'4 hidden hotkey sources');
 ok(dump.program==='MK-21 · In flight','switches to the game scene');
 // run install again: no duplicates
 await panel.click('[data-install]');await sleep(4000);
 const dump2=await ovp.evaluate(()=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){const r=await l.request('MockDump',{});res(r.data);}}});}));
 ok(Object.keys(dump2.scenes).length===6 && dump2.scenes['MK-21 · In flight'].length===1 && dump2.scenes['MK-21 · Controls'].length===4,'second install does not duplicate');
 // hotkey trick
 const item=dump2.scenes['MK-21 · Controls'].find(i=>i.sourceName.includes('+1 turbulence'));
 await ovp.evaluate(id=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){await l.request('SetSceneItemEnabled',{sceneName:'MK-21 · Controls',sceneItemId:id,sceneItemEnabled:true});res();}}});}),item.sceneItemId);
 await sleep(1500);
 ok(await panel.evaluate(()=>panel.state.turbulence)===1,'hotkey (Show) runs +1 turbulence');
 ok(await ovp.evaluate(()=>document.getElementById('turb').textContent)==='01','overlay shows 01');
 const dump3=await ovp.evaluate(()=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){const r=await l.request('MockDump',{});res(r.data);}}});}));
 ok(!dump3.scenes['MK-21 · Controls'].find(i=>i.sceneItemId===item.sceneItemId).sceneItemEnabled,'helper hidden again');
 // chat commands
 await panel.evaluate(()=>{panel.simulate({type:'chat',name:'mod1',text:'!turb',role:{mod:true}});panel.simulate({type:'chat',name:'rando',text:'!approach',role:{}});});await sleep(800);
 ok(await panel.evaluate(()=>panel.state.turbulence===2 && panel.state.approach===false),'mod command works, non-mod ignored');
 // alerts + effects
 const before=await panel.evaluate(()=>({f:OVGCore.timerLeft(panel.state.fuel),s:panel.state.seats}));
 await panel.evaluate(()=>panel.simulate({type:'sub',name:'newbie',plan:'1000'}));await sleep(1200);
 const after=await panel.evaluate(()=>({f:OVGCore.timerLeft(panel.state.fuel),s:panel.state.seats,m:panel.state.manifest}));
 ok(after.f-before.f>=298 && after.s===before.s+1 && after.m.includes('newbie'),'sub adds fuel, seat and manifest');
 ok(await ovp.evaluate(()=>document.getElementById('alert').classList.contains('show') && document.querySelector('#alert .what').textContent==='boarding pass issued'),'overlay shows the sub alert');
 await panel.evaluate(()=>panel.simulate({type:'bits',name:'tiny',amount:50}));await sleep(300);
 ok(await panel.evaluate(()=>panel.queue)===0,'bits below minimum: no alert');
 // hold during approach
 await sleep(8600);
 await panel.evaluate(()=>{panel.simulate({type:'chat',name:'mod1',text:'!approach',role:{mod:true}});});await sleep(2200);
 await panel.evaluate(()=>panel.simulate({type:'raid',name:'bigfriend',viewers:42}));await sleep(1500);
 ok(await panel.evaluate(()=>panel.queue)===1,'raid held during final approach');
 await panel.evaluate(()=>{panel.simulate({type:'chat',name:'mod1',text:'!approach',role:{mod:true}});});await sleep(2600);
 ok(await panel.evaluate(()=>panel.queue)===0 && await ovp.evaluate(()=>document.querySelector('#alert .what').textContent.includes('42 passengers')),'held alert plays after approach (42 passengers)');
 // persistence through cache clear
 await sleep(1000);
 await panel.evaluate(()=>localStorage.clear());await panel.reload();await sleep(400);
 await panel.evaluate(()=>{});
 // pw is gone with the cache: type it again
 await panel.evaluate(()=>panel.showTab('setup'));await panel.fill('[data-field="__pw"]','secret1');await panel.click('[data-connect]');await sleep(2500);
 ok(await panel.evaluate(()=>panel.state.turbulence)===2 && (await panel.evaluate(()=>panel.state.manifest)).includes('newbie'),'state restored from OBS after clearing the cache');
 // panel closed warning
 await panel.close();await sleep(14500);
 ok(await ovp.evaluate(()=>{const w=document.querySelector('[data-ovg=warn]');return w&&w.style.display==='block'&&w.textContent.includes('Panel closed');}),'overlay warns when the panel is closed');
 console.log('errors:',errs);console.log(`\n${pass} passed, ${fail} failed`);await b.close();process.exit(fail?1:0);
})();
