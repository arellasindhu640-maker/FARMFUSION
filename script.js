/* Farm Fusion – prototype logic. All market/transport data is sample data; state is kept in LocalStorage. */
const $=s=>document.querySelector(s), money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);

/* ---------- Sample data ---------- */
const MK=[ // order matches the price arrays below
 {id:'rythu',name:'Rythu Bazar',area:'Secunderabad',km:8,min:25,hrs:'6:00 AM – 2:00 PM',ph:'040-2345-6781',buy:'Retail buyers and small traders',open:true},
 {id:'whole',name:'Wholesale Market',area:'Bowenpally',km:12,min:35,hrs:'4:00 AM – 6:00 PM',ph:'040-2345-6782',buy:'Bulk traders and commission agents',open:true},
 {id:'local',name:'Local Market',area:'Kukatpally',km:6,min:20,hrs:'5:00 AM – 12:00 PM',ph:'040-2345-6783',buy:'Local vendors and shops',open:true},
 {id:'mandi',name:'Nearby Mandi',area:'Medchal',km:10,min:30,hrs:'5:00 AM – 4:00 PM',ph:'040-2345-6784',buy:'Bulk and retail buyers',open:true}];
const PR={Tomato:[28,31,29,30],Onion:[25,27,24,26],Potato:[22,24,21,23],Rice:[36,39,37,38],Maize:[21,23,22,22],Cotton:[68,72,70,71],Chilli:[115,124,118,120]};
const IC={Tomato:'🍅',Onion:'🧅',Potato:'🥔',Rice:'🌾',Maize:'🌽',Cotton:'🌿',Chilli:'🌶️'};
const VEH=[{n:'Mini Tractor',i:'🚜',cap:500,base:700,who:'Suresh Reddy',eta:'20 min'},
 {n:'Small Truck',i:'🚚',cap:1000,base:1200,who:'Anil Transport',eta:'30 min'},
 {n:'Medium Truck',i:'🚛',cap:2000,base:2000,who:'Sri Sai Logistics',eta:'45 min'}];
const STEPS=['Request Confirmed','Driver Assigned','Vehicle On The Way','Pickup Completed','Arrived At Mandi'];
const NT={2:'Driver is on the way.',3:'Pickup completed.',4:'Vehicle is arriving at the mandi.',5:'Your produce arrived at the mandi.'};
const NAV=[['home','🏠','Home'],['products','🌾','My Products'],['prices','📊','Market Prices'],['mandis','📍','Nearby Mandis'],['compare','🔄','Compare Prices'],['transport','🚚','Transportation'],['sales','📦','My Sales'],['support','👨‍🌾','Farmer Support']];
const NAV_T=[['thome','🏠','Home'],['vehicle','🚛','My Vehicle'],['requests','📥','Pickup Requests'],['deliveries','📦','My Deliveries'],['support','👨‍🌾','Help & Support']];
const LOC=['Hyderabad','Secunderabad','Medchal','Shamshabad'];
const REQ_SEED=[
 {id:'PR-501',farmer:'Padma Reddy',crop:'Tomato',qty:18,unit:'quintal',pickup:'Ghatkesar village',mandi:'Rythu Bazar',km:11,status:'pending'},
 {id:'PR-502',farmer:'Suresh Goud',crop:'Cotton',qty:25,unit:'quintal',pickup:'Bhongir village',mandi:'Wholesale Market',km:9,status:'pending'},
 {id:'PR-503',farmer:'Lakshmi Naik',crop:'Rice',qty:40,unit:'quintal',pickup:'Medchal village',mandi:'Nearby Mandi',km:4,status:'pending'}];

/* ---------- State ---------- */
let S=JSON.parse(localStorage.getItem('ff')||'null')||{user:null,acct:null,loc:'Hyderabad',cnt:0,cur:null,tr:null,sales:[],
 prod:[{crop:'Tomato',cat:'Vegetables',qty:250,unit:'kg',harvest:today(),loc:'Hyderabad',sell:today()}],
 n:[{t:'Market price for Tomato updated.'},{t:'Wholesale Market price increased to ₹31/kg.'}],
 vehicle:null,reqs:JSON.parse(JSON.stringify(REQ_SEED)),deliv:[]};
const save=()=>localStorage.setItem('ff',JSON.stringify(S));
let page='home',auth='login',det=null,PC='Tomato',F={sort:'price',st:'all'},selRole='sell',authStep='splash';
const note=t=>{S.n.unshift({t})};
function toast(m){const t=$('#toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',2200)}

/* ---------- Calculations ---------- */
const toKg=(q,u)=>q*({kg:1,quintal:100,tonne:1000}[u]||1);
const vcost=(v,m)=>Math.round(v.base*m.km/12/10)*10;       // base cost is for a 12 km trip
const eligible=q=>VEH.filter(v=>v.cap>=q);
function rows(){const c=S.cur;if(!c)return[];const q=toKg(c.qty,c.unit),v=eligible(q)[0]||VEH[2];
 return MK.map((m,i)=>({...m,price:PR[c.crop][i],value:PR[c.crop][i]*q,tc:vcost(v,m)}))}
const chosen=()=>S.cur&&S.cur.mandi&&rows().find(r=>r.id==S.cur.mandi);

/* ---------- Views ---------- */
const noCrop=()=>`<div class=card><h2>Choose a crop first</h2><p class=mu>Add your crop and quantity to see nearby mandis.</p><button class=btn data-go=products>Add Product</button></div>`;
const selbar=()=>{const m=chosen();return m?`<div class=selbar><div><b>${m.name} selected</b><br><small>Estimated product value ${money(m.value)} (an estimate, not guaranteed)</small></div><button class="btn gold" data-go=transport>Arrange Transport</button></div>`:''};
const greet=()=>{const h=new Date().getHours();return h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'};
const trLabel=t=>t.step>=5?'Arrived At Mandi':STEPS[t.step];

const V={
home(){const p=S.prod[0],cr=S.cur?S.cur.crop:(p?p.crop:'Tomato'),best=Math.max(...PR[cr]);
 const card=(g,i,t,s)=>`<button class=card data-go=${g}><span>${i}</span><h3>${t}</h3><p class=mu>${s}</p></button>`;
 return `<section class=hero><div><h1>${greet()}, ${esc(S.user.name)}!</h1><p>Farm Fusion brings market discovery, price comparison and transportation assistance together in one simple platform for farmers.</p><button class="btn gold" data-go=products>Sell a crop</button></div>
 <div><label for=loc>📍 Current location</label><select id=loc data-loc>${LOC.map(l=>`<option ${l==S.loc?'selected':''}>${l}</option>`).join('')}</select></div></section>
 <div class=stats><div><small>Ready for sale</small><b>${p?esc(p.crop)+' '+p.qty+' '+p.unit:'None yet'}</b></div><div><small>Best nearby price (${cr})</small><b>${money(best)}/kg</b></div><div><small>Nearby mandis</small><b>${MK.length} markets found</b></div><div><small>Transport requests</small><b>${S.tr&&S.tr.step<5?1:0} active</b></div></div>
 <ul class=journey>${['Select crop','Quantity','Nearby mandis','Compare prices','Choose market','Arrange transport','Sell'].map(x=>`<li>${x}</li>`).join('')}</ul>
 <div class=grid>${card('products','🌾','My Products',S.prod.length+' ready to sell')+card('prices','📊','Market Prices','Today’s rates by crop')+card('mandis','📍','Nearby Mandis',MK.length+' markets near you')+card('compare','🔄','Compare Prices','Find the best price')+card('transport','🚚','Transportation','Book a vehicle')+card('sales','📦','My Orders','Sales and transport status')+card('support','👨‍🌾','Farmer Support','Tips, schemes, help')}</div>`},
products(){const c=S.cur||{};
 return `<h2>Add Product</h2><form id=addp class=card><div class=cols><div><label>Crop</label><select name=crop>${Object.keys(PR).map(k=>`<option ${k==(c.crop||'Tomato')?'selected':''}>${k}</option>`).join('')}</select></div>
 <div><label>Category</label><select name=cat><option>Vegetables</option><option>Grains</option><option>Cash crops</option><option>Spices</option></select></div>
 <div><label>Quantity</label><input name=qty type=number min=1 value=${c.qty||250} required></div>
 <div><label>Unit</label><select name=unit><option>kg</option><option>quintal</option><option>tonne</option></select></div>
 <div><label>Harvest date</label><input name=harvest type=date value=${today()}></div>
 <div><label>Farm location</label><select name=loc>${LOC.map(l=>`<option ${l==S.loc?'selected':''}>${l}</option>`).join('')}</select></div>
 <div><label>Preferred selling date</label><input name=sell type=date value=${today()}></div></div>
 <div class=row><button class="btn gold">Find Markets</button></div></form>
 <h3>My products</h3>${S.prod.map((p,i)=>`<div class=card><b>${IC[p.crop]} ${esc(p.crop)}</b> – ${p.qty} ${p.unit} ready to sell<br><small class=mu>${esc(p.cat)} · ${esc(p.loc)} · sell by ${p.sell}</small><div class=row><button class="btn line" data-act=find data-i=${i}>Find Markets</button></div></div>`).join('')}`},
prices(){const p=PR[PC],mx=Math.max(...p);
 return `<h2>Market Prices</h2><div class=chips>${Object.keys(PR).map(k=>`<button class="${k==PC?'on':''}" data-act=pc data-k=${k}>${IC[k]} ${k}</button>`).join('')}</div>
 <div class=card><table><tr><th>Market</th><th>Area</th><th>Price</th></tr>${MK.map((m,i)=>`<tr><td><b>${m.name}</b></td><td>${m.area}</td><td>${money(p[i])}/kg ${p[i]==mx?'<span class=pill>Highest</span>':''}</td></tr>`).join('')}</table><p class=note>Sample prices for the prototype. Real mandi rates can differ.</p>
 <div class=row><button class=btn data-act=sellcrop data-k=${PC}>Sell ${PC}</button></div></div>`},
mandis(){if(!S.cur)return noCrop();const c=S.cur;let r=rows().filter(m=>F.st=='all'||(F.st=='open')==m.open);
 r.sort((a,b)=>F.sort=='price'?b.price-a.price:F.sort=='km'?a.km-b.km:a.tc-b.tc);const best=Math.max(...rows().map(m=>m.price));
 return `<h2>Nearby Mandis</h2><p class=mu>${IC[c.crop]} ${c.crop} · ${c.qty} ${c.unit} · from ${esc(S.loc)}</p>
 <div class=filters><label>Sort by<select data-f=sort><option value=price ${F.sort=='price'?'selected':''}>Highest price</option><option value=km ${F.sort=='km'?'selected':''}>Nearest market</option><option value=tc ${F.sort=='tc'?'selected':''}>Lowest transport cost</option></select></label>
 <label>Market status<select data-f=st><option value=all>All</option><option value=open ${F.st=='open'?'selected':''}>Open</option><option value=closed ${F.st=='closed'?'selected':''}>Closed</option></select></label></div>
 <div class=grid>${r.map(m=>`<article class="card mc ${m.price==best?'best':''} ${c.mandi==m.id?'sel':''}">${m.price==best?'<span class=tag>Highest price</span>':''}<h3>🏪 ${m.name}</h3><p class=mu>${m.area}</p><div class=big>${money(m.price)}<small>/kg</small></div>
 <ul><li>📍 ${m.km} km away</li><li>⏱️ ${m.min} min travel</li><li>🚚 Transport from ${money(m.tc)}</li><li>Status: <b class=${m.open?'ok':'no'}>${m.open?'Open':'Closed'}</b></li></ul>
 <div class=row><button class="btn line" data-act=det data-id=${m.id}>View Details</button><button class=btn data-act=sel data-id=${m.id}>${c.mandi==m.id?'✓ Selected':'Select Mandi'}</button></div></article>`).join('')||'<p class=mu>No markets match these filters.</p>'}</div>
 <p><button class=link data-go=compare>Compare prices side by side</button></p>${selbar()}`},
compare(){if(!S.cur)return noCrop();const c=S.cur,r=rows(),mx=Math.max(...r.map(m=>m.price)),top=r.find(m=>m.price==mx),q=toKg(c.qty,c.unit);
 return `<h2>Compare Prices</h2><p class=mu>${IC[c.crop]} ${c.crop} · ${q} kg</p>
 <div class=card><h3>Highest Available Price</h3><div class=big>${money(mx)}<small>/kg · ${top.name}</small></div>
 ${r.map(m=>`<div class="bar ${m.price==mx?'hi':''}"><span>${m.name}</span><div><i style="width:${m.price/mx*100}%"></i></div><b>${money(m.price)}</b></div>`).join('')}</div>
 <div class=card><h3>Estimated Product Value</h3><p>${q} kg × ${money(mx)} = <b>${money(top.value)}</b> at ${top.name}</p>
 <table><tr><th>Market</th><th>Est. value</th><th>Transport</th><th>After transport</th><th></th></tr>${r.map(m=>`<tr><td>${m.name}</td><td>${money(m.value)}</td><td>${money(m.tc)}</td><td><b>${money(m.value-m.tc)}</b></td><td><button class="btn line" data-act=sel data-id=${m.id}>${c.mandi==m.id?'✓':'Select'}</button></td></tr>`).join('')}</table>
 <p class=note>These are estimates based on the displayed market prices and sample transport costs. They are not guaranteed income. “After transport” is the estimated amount after transport.</p></div>${selbar()}`},
transport(){const m=chosen();if(!S.cur)return noCrop();if(!m)return `<div class=card><h2>Select a mandi first</h2><p class=mu>Pick the market you want to sell at, then arrange transport.</p><button class=btn data-go=mandis>Choose a Mandi</button></div>`;
 const c=S.cur,q=toKg(c.qty,c.unit),ok=eligible(q);if(c.veh==null||!ok[c.veh])c.veh=ok.length?VEH.indexOf(ok[0]):null;const v=VEH[c.veh],cost=v?vcost(v,m):0;
 return `<h2>Transportation</h2><div class=card><b>📍 ${esc(S.loc)} farm</b> → <b>🏪 ${m.name}</b> · ${m.km} km</div>
 ${VEH.map((x,i)=>{const fit=x.cap>=q;return `<div class="card veh ${c.veh==i?'on':''} ${fit?'':'off'}" ${fit?`data-act=veh data-i=${i}`:''}><span>${x.i}</span><div><b>${x.n}</b> · up to ${x.cap} kg<br><small class=mu>${x.who} · ${fit?'Available · arrives in '+x.eta:'Too small for '+q+' kg'}</small></div><b style="margin-left:auto">${money(vcost(x,m))}</b></div>`}).join('')}
 ${ok.length?`<form id=book class=card><h3>Transport Request</h3><div class=cols><div><label>Pickup location</label><input name=pickup value="${esc((S.user.village||S.loc)+' farm')}" required></div><div><label>Destination</label><input value="${m.name}" readonly></div>
 <div><label>Crop</label><input value="${c.crop}" readonly></div><div><label>Quantity</label><input value="${c.qty} ${c.unit}" readonly></div>
 <div><label>Pickup date</label><input name=date type=date value=${today()} required></div><div><label>Pickup time</label><input name=time type=time value=07:00 required></div></div>
 <p>Vehicle: <b>${v.n}</b> · Transport cost ${money(cost)}</p><p>Estimated product value ${money(m.value)}<br>Estimated amount after transport: <b>${money(m.value-cost)}</b></p>
 <p class=note>Estimates only, not guaranteed income.</p><button class="btn gold wide">Confirm Transport</button></form>`:'<p class=note>This load is above 2000 kg. Split it into smaller loads to book vehicles.</p>'}`},
track(){const t=S.tr;if(!t)return `<div class=card><h2>No transport request yet</h2><p class=mu>Book a vehicle to start tracking.</p><button class=btn data-go=transport>Arrange Transport</button></div>`;
 return `<h2>Transport Tracking</h2><div class=card><h3>✅ Transport Request Confirmed</h3><p>Transport ID: <b>${t.id}</b><br>Status: <span class=pill>${trLabel(t)}</span></p><p class=mu>${t.veh} (${esc(t.who)}) · ${esc(t.pickup)} → ${t.mandi} · ${t.date} ${t.time}</p></div>
 <div class=card><ul class=steps>${STEPS.map((s,i)=>`<li class="${i<t.step?'done':i==t.step?'now':''}"><b>${i<t.step?'✓':i==t.step?'●':'○'}</b>${s}</li>`).join('')}</ul><p class=note>Tracking is simulated for this prototype and updates every few seconds.</p>
 <div class=row><button class="btn line" data-act=next ${t.step>=5?'disabled':''}>Simulate next step</button><button class=btn data-go=sales>View My Sales</button></div></div>`},
sales(){return `<h2>My Sales</h2>${S.sales.map((s,i)=>{const t=S.tr&&S.tr.id==s.tid?S.tr:null,done=!t||t.step>=5;
 return `<div class=card><h3>${IC[s.crop]} ${s.crop} · ${s.qty} ${s.unit}</h3><p>${s.mandi} · ${money(s.price)}/kg<br>Estimated value: <b>${money(s.value)}</b> · Transport ${money(s.cost)}</p><p>Transport: <span class=pill>${t?trLabel(t):'Delivered'}</span> Status: <span class=pill>${s.sold?'Sold':'Ready for Sale'}</span> <small class=mu>${s.tid}</small></p>
 ${s.sold?'':`<button class=btn data-act=sold data-i=${i} ${done?'':'disabled'}>${done?'Mark as Sold':'Waiting for delivery'}</button>`}</div>`}).join('')||`<div class=card><p class=mu>No sales yet. Compare prices, pick a mandi and book transport to start.</p><button class=btn data-go=products>Add Product</button></div>`}`},
support(){const it=[['🌱 Crop Guidance','Tomato needs steady watering and staking. Sell soon after harvest, as ripe tomatoes spoil fast.'],['🌦️ Weather Information','Sample forecast: 31°C, partly cloudy, light rain possible in the evening. Check IMD for official forecasts.'],['🏛️ Government Schemes','PM-KISAN offers income support to eligible farmers. Ask your local agriculture office to check your eligibility.'],['📚 Farming Tips','Grade your produce, use clean crates, and load vehicles in the cool morning hours.'],['❓ FAQs','Are prices guaranteed? No. They are estimates from sample data. Do I pay to compare? No.'],['☎️ Help / Support','Kisan Call Centre: 1800-180-1551. Farm Fusion help: support@farmfusion.example']];
 return `<h2>Farmer Support</h2>${it.map(x=>`<details><summary>${x[0]}</summary><p class=mu>${x[1]}</p></details>`).join('')}`},
notifs(){return `<h2>Notifications</h2>${S.n.map(n=>`<div class=card>🔔 ${esc(n.t)}</div>`).join('')}`}};

/* ---------- Transport-provider views ---------- */
const fare=r=>Math.round(r.km*45/10)*10;
const T={
thome(){const pend=S.reqs.filter(r=>r.status=='pending').length,active=S.deliv.filter(d=>d.step<4).length,done=S.deliv.filter(d=>d.step>=4).length;
 const card=(g,i,t,s)=>`<button class=card data-go=${g}><span>${i}</span><h3>${t}</h3><p class=mu>${s}</p></button>`;
 return `<section class=hero><div><h1>${greet()}, ${esc(S.user.name)}!</h1><p>Farmers near ${esc(S.loc)} are looking for help moving their produce to market. Register your vehicle and start accepting pickups.</p>${S.vehicle?'':'<button class="btn gold" data-go=vehicle>Register your vehicle</button>'}</div></section>
 <div class=stats><div><small>Your vehicle</small><b>${S.vehicle?S.vehicle.type:'Not registered'}</b></div><div><small>Pickup requests</small><b>${pend} pending</b></div><div><small>Active deliveries</small><b>${active}</b></div><div><small>Completed</small><b>${done}</b></div></div>
 <div class=grid>${card('vehicle','🚛','My Vehicle',S.vehicle?'Edit your listing':'Register to get requests')+card('requests','📥','Pickup Requests',pend+' farmers nearby need transport')+card('deliveries','📦','My Deliveries',active+' in progress')+card('support','👨‍🌾','Help & Support','Tips and contact info')}</div>`},
vehicle(){const v=S.vehicle||{};
 return `<h2>My Vehicle</h2><form id=vform class=card><div class=cols>
 <div><label>Vehicle type</label><select name=type>${VEH.map(x=>`<option ${v.type==x.n?'selected':''}>${x.n}</option>`).join('')}</select></div>
 <div><label>Base location</label><select name=loc>${LOC.map(l=>`<option ${(v.loc||S.loc)==l?'selected':''}>${l}</option>`).join('')}</select></div></div>
 <label><input type=checkbox name=avail ${v.avail!==false?'checked':''} style="width:auto;min-height:auto;margin-right:8px">Available for pickups right now</label>
 <div class=row><button class="btn gold wide">Save vehicle</button></div></form>
 ${S.vehicle?`<p class=note>Farmers searching near ${esc(S.vehicle.loc)} can now see your ${esc(S.vehicle.type)} ${S.vehicle.avail!==false?'as available':'(currently hidden — turn availability on to be seen)'}.</p>`:''}`},
requests(){const pend=S.reqs.filter(r=>r.status=='pending');
 return `<h2>Pickup Requests</h2>${!S.vehicle?'<p class=note>Register your vehicle first so farmers can find you.</p>':''}
 ${pend.map(r=>`<div class=card><h3>${IC[r.crop]||'🌾'} ${r.crop} · ${r.qty} ${r.unit}</h3><p class=mu>Farmer: ${esc(r.farmer)}</p><ul><li>📍 Pickup: ${esc(r.pickup)}</li><li>🏪 Drop at: ${r.mandi}</li><li>${r.km} km away</li><li>💰 Suggested fare: ${money(fare(r))}</li></ul>
 <div class=row><button class="btn line" data-act=decline data-id=${r.id}>Decline</button><button class="btn gold" data-act=accept data-id=${r.id} ${S.vehicle?'':'disabled'}>Accept</button></div></div>`).join('')||'<div class=card><p class=mu>No pending requests right now — check back soon.</p></div>'}`},
deliveries(){return `<h2>My Deliveries</h2>${S.deliv.map((d,i)=>`<div class=card><h3>${IC[d.crop]||'🌾'} ${d.crop} · ${d.qty} ${d.unit} · ${esc(d.farmer)}</h3>
 <p class=mu>${esc(d.pickup)} → ${d.mandi} · ${d.km} km · Fare ${money(fare(d))}</p>
 <p>Status: <span class=pill>${d.step>=4?'Delivered':STEPS[d.step]}</span></p>
 ${d.step<4?`<button class=btn data-act=advance data-i=${i}>Simulate next step</button>`:'<p class=note>Delivery completed.</p>'}</div>`).join('')||'<div class=card><p class=mu>Accept a pickup request to start a delivery.</p><button class=btn data-go=requests>View Requests</button></div>'}`}};
T.support=V.support;

function modal(){const m=det&&rows().find(r=>r.id==det);if(!m)return'';
 return `<div class=modal data-act=close><div class=sheet><h2>🏪 ${m.name}</h2><p>${m.area}, Hyderabad region</p><ul><li>📍 ${m.km} km · ${m.min} min</li><li>Price: <b>${money(m.price)}/kg</b></li><li>🕒 Open ${m.hrs}</li><li>☎️ ${m.ph}</li><li>Buyers: ${m.buy}</li></ul>
 <p>Estimated selling value: <b>${money(m.value)}</b><br><small class=mu>Estimate based on the displayed price, not guaranteed.</small></p>
 <div class=row><button class="btn line" data-act=sel data-id=${m.id}>Select This Mandi</button><button class="btn gold" data-act=arrange data-id=${m.id}>Arrange Transport</button></div><button class=link data-act=close>Close</button></div></div>`}

function splashView(){
 return `<div class=splash><div class="logo-mark xl">🌾</div><h1>Farm Fusion</h1><p class=mu>Connect. Compare. Sell. Transport.</p>
 <button class=arrow-btn data-act=begin aria-label="Continue to login">&#8594;</button></div>`}

function authView(){
 return `<div class=auth><aside><div class="logo-mark lg">🌾</div><h1>Farm Fusion</h1><h2>Connect. Compare. Sell. Transport.</h2><p>Better Markets. Better Prices. Better Farming.</p><p>Farm Fusion brings market discovery, price comparison and transportation assistance together in one simple platform for farmers and transport helpers.</p></aside>
 <section><h2>Welcome to Farm Fusion</h2><p class=mu>Tell us who you are to get started.</p>
 <form id=onboard>
 <label>Your name</label><input name=name placeholder="e.g. Ravi Kumar" required>
 <label>Mobile number</label><input name=mobile type=tel placeholder="10-digit number" maxlength=10 required>
 <label>Location</label><select name=location>${LOC.map(l=>`<option>${l}</option>`).join('')}</select>
 <label>I want to</label>
 <div class=cols style="margin-top:6px">
  <button type=button class="card veh ${selRole=='sell'?'on':''}" data-act=role data-r=sell><span>🌾</span><div><b>Sell my produce</b><br><small class=mu>Compare mandi prices & get transport</small></div></button>
  <button type=button class="card veh ${selRole=='transport'?'on':''}" data-act=role data-r=transport><span>🚛</span><div><b>Provide transport service</b><br><small class=mu>List your vehicle & accept pickups</small></div></button>
 </div>
 <div class=row><button class="btn gold wide">Get Started</button></div></form>
 <p class=note>Demo: any mobile number works, no password needed.</p></section></div>`}

/* ---------- Render ---------- */
function render(){const app=$('#app');
 if(!S.user){app.innerHTML=authStep=='splash'?splashView():authView();return}
 const isT=S.user.role=='transport',nav=isT?NAV_T:NAV,views=isT?T:V;
 if(!views[page])page=isT?'thome':'home';
 app.innerHTML=`<header class=top><div class="logo-mark sm">🌾</div><b>Farm Fusion</b><button data-go=notifs aria-label="Notifications">🔔 ${S.n.length}</button><button data-act=logout>Logout</button></header>
 <nav>${nav.map(n=>`<button class="${page==n[0]?'on':''}" data-go=${n[0]}><span>${n[1]}</span>${n[2]}</button>`).join('')}</nav><main>${views[page]()}</main>${modal()}`}
function go(p){page=p;det=null;render();scrollTo(0,0)}

/* ---------- Actions ---------- */
function pick(id){S.cur.mandi=id;const m=chosen();note(m.name+' selected for '+S.cur.crop+'.');save();toast(m.name+' selected')}
const ACT={
 role(d){selRole=d.r;render()},
 begin(){authStep='onboard';render()},
 logout(){S.user=null;auth='login';save();render()},
 pc(d){PC=d.k;render()},
 sellcrop(d){S.cur={crop:d.k,qty:250,unit:'kg',loc:S.loc,mandi:null,veh:null};save();go('products')},
 find(d){const p=S.prod[d.i];S.cur={crop:p.crop,qty:p.qty,unit:p.unit,loc:p.loc,mandi:null,veh:null};save();go('mandis')},
 det(d){det=d.id;render()},close(d,e,t){if(e.target===t){det=null;render()}},
 sel(d){pick(d.id);render()},arrange(d){pick(d.id);go('transport')},
 veh(d){S.cur.veh=+d.i;save();render()},
 next(){if(S.tr&&S.tr.step<5)tick()},
 sold(d){const s=S.sales[d.i];s.sold=true;note(s.crop+' sale at '+s.mandi+' marked as sold.');save();render()},
 accept(d){const r=S.reqs.find(x=>x.id==d.id);r.status='accepted';S.deliv.unshift({...r,step:0});note('Accepted pickup for '+esc(r.farmer)+'.');save();go('deliveries')},
 decline(d){const r=S.reqs.find(x=>x.id==d.id);r.status='declined';save();render()},
 advance(d){const dl=S.deliv[d.i];dl.step=Math.min(4,dl.step+1);note(dl.step>=4?'Delivery completed for '+esc(dl.farmer)+'.':'Delivery update: '+esc(dl.farmer)+' — '+STEPS[dl.step]+'.');save();render()}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-go],[data-act]');if(!t)return;
 if(t.dataset.go)return go(t.dataset.go);ACT[t.dataset.act]?.(t.dataset,e,t)});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.f){F[t.dataset.f]=t.value;render()}
 if(t.dataset.loc!==undefined){S.loc=t.value;save();toast('Location set to '+t.value)}});
const FORMS={
 onboard(v){S.user={name:v.name,mobile:v.mobile,village:v.location,role:selRole};S.loc=v.location;
  page=selRole=='transport'?'thome':'home';save();render()},
 addp(v){const p={crop:v.crop,cat:v.cat,qty:+v.qty,unit:v.unit,harvest:v.harvest,loc:v.loc,sell:v.sell};S.prod.unshift(p);S.loc=v.loc;
  S.cur={crop:p.crop,qty:p.qty,unit:p.unit,loc:p.loc,mandi:null,veh:null};note(p.crop+' added: '+p.qty+' '+p.unit+'.');save();go('mandis')},
 vform(v){S.vehicle={type:v.type,loc:v.loc,avail:v.avail=='on'};note('Vehicle listing saved: '+v.type+' at '+v.loc+'.');save();toast('Vehicle listing saved');render()},
 book(v){const c=S.cur,m=chosen(),ve=VEH[c.veh];S.cnt++;const id='FF-TR-'+(1024+S.cnt);
  S.tr={id,step:1,crop:c.crop,qty:c.qty,unit:c.unit,mandi:m.name,veh:ve.n,who:ve.who,cost:vcost(ve,m),date:v.date,time:v.time,pickup:v.pickup};
  S.sales.unshift({tid:id,crop:c.crop,qty:c.qty,unit:c.unit,mandi:m.name,price:m.price,value:m.value,cost:S.tr.cost,sold:false});
  note('Your transport request has been confirmed.');save();go('track')}};
document.addEventListener('submit',e=>{e.preventDefault();FORMS[e.target.getAttribute('id')]?.(Object.fromEntries(new FormData(e.target)))});

/* Simulated tracking: advances one step every few seconds */
function tick(){const t=S.tr;t.step++;note(NT[t.step]);save();toast(NT[t.step]);if(page=='track'||page=='sales')render()}
setInterval(()=>{if(S.user&&S.tr&&S.tr.step<5)tick()},9000);
render();