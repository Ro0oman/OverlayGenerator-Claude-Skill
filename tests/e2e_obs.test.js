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
 // an old pack version left one full-screen source: install must replace it with one source per piece
 const pre=await ctx.newPage();await pre.goto('file://'+DIR+'/overlays/flight.html?pw=secret1');await sleep(800);
 await pre.evaluate(()=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){await l.request('CreateScene',{sceneName:'MK-21 · In flight'});await l.request('CreateInput',{sceneName:'MK-21 · In flight',inputName:'MK-21 · In flight · overlay',inputKind:'browser_source',inputSettings:{}});res();}}});}));
 await pre.close();
 await panel.click('[data-install]');await sleep(5000);
 const ovp=await ctx.newPage();ovp.on('pageerror',e=>errs.push('overlay:'+e.message));
 await ovp.goto('file://'+DIR+'/overlays/flight.html?pw=secret1');await sleep(2500);
 const dump=await ovp.evaluate(()=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){const r=await l.request('MockDump',{});res(r.data);}}});}));
 const sc=Object.keys(dump.scenes);
 ok(sc.length===6 && sc.includes('MK-21 · In flight') && sc.includes('MK-21 · Controls'),'install creates 5 scenes + controls: '+sc.join(', '));
 const inp=dump.inputs['MK-21 · In flight · Flight strip'];
 ok(inp && inp.kind==='browser_source' && /overlays\/flight\.html\?pw=secret1&src=strip&b=\d+,\d+,\d+,\d+$/.test(inp.settings.url) && inp.settings.shutdown===false && inp.settings.width<1920,'one browser source per piece group, sized to its box: '+(inp&&inp.settings.width)+'×'+(inp&&inp.settings.height));
 ok(dump.scenes['MK-21 · In flight'].map(i=>i.sourceName).join('|')==='MK-21 · In flight · Camera frame|MK-21 · In flight · Flight strip|MK-21 · In flight · Alerts','in flight: camera frame, flight strip and alerts, and the old full-screen source is gone');
 const stripItem=dump.scenes['MK-21 · In flight'].find(i=>i.sourceName.endsWith('Flight strip'));
 const box=JSON.parse(await ovp.evaluate(()=>JSON.stringify(PACK.scenes.find(s=>s.id==='flight').sources.find(x=>x.id==='strip').box)));
 const tf=dump.transforms['MK-21 · In flight|'+stripItem.sceneItemId];
 ok(tf && tf.positionX===box[0] && tf.positionY===box[1],'source placed at its box ('+box.join(',')+')');
 // the streamer moves the strip: a second install must keep it there
 await ovp.evaluate(id=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){await l.request('SetSceneItemTransform',{sceneName:'MK-21 · In flight',sceneItemId:id,sceneItemTransform:{positionX:77,positionY:88,scaleX:1.5,scaleY:1.5}});res();}}});}),stripItem.sceneItemId);
 ok(dump.scenes['MK-21 · Controls'].length===4 && dump.scenes['MK-21 · Controls'].every(i=>!i.sceneItemEnabled),'4 hidden hotkey sources');
 ok(dump.program==='MK-21 · In flight','switches to the game scene');
 // run install again: no duplicates
 await panel.click('[data-install]');await sleep(4000);
 const dump2=await ovp.evaluate(()=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){const r=await l.request('MockDump',{});res(r.data);}}});}));
 ok(Object.keys(dump2.scenes).length===6 && dump2.scenes['MK-21 · In flight'].length===3 && dump2.scenes['MK-21 · Controls'].length===4,'second install does not duplicate');
 ok(dump2.transforms['MK-21 · In flight|'+stripItem.sceneItemId].positionX===77,'second install keeps where the streamer moved the source');
 // a new pack version moves the strip's box: install resizes the source and moves it so the strip stays where it was on screen
 const obs=(fn,arg)=>ovp.evaluate(([f,a])=>new Promise(res=>{const l=new ObsLink({password:'secret1',onStatus:async s=>{if(s.state==='connected'){res(await (new Function('l','a','return ('+f+')(l,a)'))(l,a));}}});}),[fn.toString(),arg]);
 const stripName='MK-21 · In flight · Flight strip';
 const urlNow=dump2.inputs[stripName].settings.url;
 await obs(async(l,a)=>{await l.request('SetInputSettings',{inputName:a.name,inputSettings:{url:a.url,width:a.b[2],height:a.b[3]}});},{name:stripName,url:urlNow.replace(/&b=[\d,]+$/,'&b='+[box[0]-100,box[1]-40,box[2],box[3]].join(',')),b:box});
 await panel.click('[data-install]');await sleep(4000);
 let d3=await obs(async l=>(await l.request('MockDump',{})).data);
 let t3=d3.transforms['MK-21 · In flight|'+stripItem.sceneItemId];
 ok(Math.abs(t3.positionX-(77+100*1.5))<0.01 && Math.abs(t3.positionY-(88+40*1.5))<0.01 && t3.scaleX===1.5,'box moved inside the page: the source moves with it and keeps its scale ('+t3.positionX+','+t3.positionY+')');
 ok(/&b=/.test(d3.inputs[stripName].settings.url) && d3.inputs[stripName].settings.width===box[2],'the source records its new box in the URL');
 // a source left full screen by an older pack (no b=, 1920×1080): its pieces stay where they were too
 await obs(async(l,a)=>{await l.request('SetInputSettings',{inputName:a.name,inputSettings:{url:a.url,width:1920,height:1080}});await l.request('SetSceneItemTransform',{sceneName:'MK-21 · In flight',sceneItemId:a.id,sceneItemTransform:{positionX:10,positionY:20,scaleX:1,scaleY:1}});},{name:stripName,url:urlNow.replace(/&b=[\d,]+$/,''),id:stripItem.sceneItemId});
 await panel.click('[data-install]');await sleep(4000);
 d3=await obs(async l=>(await l.request('MockDump',{})).data);
 t3=d3.transforms['MK-21 · In flight|'+stripItem.sceneItemId];
 ok(t3.positionX===10+box[0] && t3.positionY===20+box[1] && d3.inputs[stripName].settings.width===box[2],'full-screen source from an older pack: shrunk to its box, strip stays put ('+t3.positionX+','+t3.positionY+')');
 // a source page shows only its pieces, moved to its top-left corner
 const sp=await ctx.newPage();await sp.setViewportSize({width:box[2],height:box[3]});
 await sp.goto('file://'+DIR+'/overlays/flight.html?pw=secret1&src=strip');await sleep(1200);
 ok(await sp.evaluate(b=>{const v=e=>getComputedStyle(e).display!=='none';const r=document.getElementById('strip').getBoundingClientRect();return v(document.getElementById('strip'))&&!v(document.getElementById('alert'))&&!v(document.querySelector('[data-piece=camera]'))&&r.left>=0&&r.right<=b[2]&&r.top>=0;},box),'?src=strip shows only the flight strip, inside its box');
 await sp.close();
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
