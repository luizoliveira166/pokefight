 // =====================================================
// TYPE THEMES
// =====================================================
const TYPE = {
  fire:     {bg:'linear-gradient(150deg,#180600,#240c00)',glow:'#ff4400',pill:'#ff4400',txt:'#fff'},
  water:    {bg:'linear-gradient(150deg,#000c1a,#001428)',glow:'#0088ff',pill:'#0088ff',txt:'#fff'},
  grass:    {bg:'linear-gradient(150deg,#021000,#031a00)',glow:'#00bb44',pill:'#00bb44',txt:'#fff'},
  electric: {bg:'linear-gradient(150deg,#181200,#221b00)',glow:'#ffcc00',pill:'#ffcc00',txt:'#111'},
  psychic:  {bg:'linear-gradient(150deg,#18000e,#240015)',glow:'#ff0080',pill:'#ff0080',txt:'#fff'},
  ice:      {bg:'linear-gradient(150deg,#001818,#002424)',glow:'#00ccff',pill:'#00ccff',txt:'#000'},
  dragon:   {bg:'linear-gradient(150deg,#070012,#0e0020)',glow:'#7700ff',pill:'#7700ff',txt:'#fff'},
  dark:     {bg:'linear-gradient(150deg,#080808,#111)',glow:'#555',pill:'#666',txt:'#fff'},
  fairy:    {bg:'linear-gradient(150deg,#180014,#240020)',glow:'#ff55cc',pill:'#ff55cc',txt:'#fff'},
  normal:   {bg:'linear-gradient(150deg,#0d0d0d,#181818)',glow:'#888',pill:'#888',txt:'#fff'},
  fighting: {bg:'linear-gradient(150deg,#180000,#240000)',glow:'#cc2000',pill:'#cc2200',txt:'#fff'},
  flying:   {bg:'linear-gradient(150deg,#000c18,#001322)',glow:'#5599ff',pill:'#5599ff',txt:'#fff'},
  poison:   {bg:'linear-gradient(150deg,#0e000e,#180018)',glow:'#aa00ff',pill:'#aa00ff',txt:'#fff'},
  ground:   {bg:'linear-gradient(150deg,#0e0700,#1a1000)',glow:'#cc7700',pill:'#cc7700',txt:'#111'},
  rock:     {bg:'linear-gradient(150deg,#0d0a04,#181408)',glow:'#998855',pill:'#998855',txt:'#fff'},
  bug:      {bg:'linear-gradient(150deg,#080e00,#101800)',glow:'#88cc00',pill:'#88cc00',txt:'#111'},
  ghost:    {bg:'linear-gradient(150deg,#04000e,#0a0018)',glow:'#6600cc',pill:'#6600cc',txt:'#fff'},
  steel:    {bg:'linear-gradient(150deg,#090d11,#10161e)',glow:'#aabbcc',pill:'#aabbcc',txt:'#000'},
};
const DEF_TYPE = {bg:'linear-gradient(150deg,#0e0e0e,#181818)',glow:'#444',pill:'#555',txt:'#fff'};
 
function typeOf(name){return TYPE[name]||DEF_TYPE}
 
function statColor(v){
  if(v>=120)return'#00e676';
  if(v>=90) return'#69f0ae';
  if(v>=60) return'#ffee58';
  if(v>=35) return'#ffa726';
  return'#ef5350';
}
 
const STAT_LABELS = {
  hp:'HP','attack':'FORÇA','defense':'DEFESA',
  'special-attack':'SP.ATK','special-defense':'SP.DEF','speed':'VELOC.'
};
 
// =====================================================
// STATE
// =====================================================
let cache   = [];
let slots   = [null,null];
let roster  = [];
let running = false;
 
// =====================================================
// UTILS
// =====================================================
const sleep = ms => new Promise(r=>setTimeout(r,ms));
 
function sprite(p){
  return p.sprites?.other?.['official-artwork']?.front_default
    || p.sprites?.front_default || '';
}
function stat(p,n){return p.stats?.find(s=>s.stat.name===n)?.base_stat??45}
function bst(p){return p.stats?.reduce((a,s)=>a+s.base_stat,0)??0}
 
function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast '+type;
  void t.offsetWidth; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2600);
}
 
// =====================================================
// NAV
// =====================================================
function switchTab(tab){
  document.querySelectorAll('.nav-btn[data-tab],.tab-btn[data-tab]').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===tab);
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+tab)?.classList.add('active');
  rebuildBtns();
}
function toggleMenu(){
  document.getElementById('ham').classList.toggle('open');
  document.getElementById('mob-nav').classList.toggle('open');
}
function closeMenu(){
  document.getElementById('ham').classList.remove('open');
  document.getElementById('mob-nav').classList.remove('open');
}
 
// =====================================================
// API
// =====================================================
async function api(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error(r.status);
  return r.json();
}
async function fetchPoke(q){
  const k=String(q).toLowerCase().trim();
  const hit=cache.find(p=>p.name===k||String(p.id)===k);
  if(hit)return hit;
  const d=await api(`https://pokeapi.co/api/v2/pokemon/${k}`);
  cache.push(d); return d;
}
async function fetchSpecies(id){
  try{return await api(`https://pokeapi.co/api/v2/pokemon-species/${id}`)}catch{return null}
}
async function fetchEvo(url){
  try{return await api(url)}catch{return null}
}
function parseEvo(chain){
  const out=[];
  let n=chain?.chain;
  while(n){out.push(n.species.name);n=n.evolves_to?.[0]??null}
  return out;
}
 
// =====================================================
// BUILD CARD
// =====================================================
async function buildCard(data,species){
  const types  = data.types.map(t=>t.type.name);
  const theme  = typeOf(types[0]);
  const sp     = sprite(data);
  const total  = bst(data);
 
  const flavor = species?.flavor_text_entries
    ?.find(f=>f.language.name==='en')
    ?.flavor_text?.replace(/[\f\n]/g,' ')?.replace(/\s+/g,' ')?.trim() ?? '';
 
  const genus = species?.genera?.find(g=>g.language.name==='en')?.genus ?? '';
 
  // Evolutions
  let evoHTML = '';
  if(species?.evolution_chain?.url){
    const chain = await fetchEvo(species.evolution_chain.url);
    const names = parseEvolutions(chain);
    if(names.length>1){
      evoHTML=`<div style="margin-bottom:10px">
        <div class="stats-title">LINHA EVOL.</div>
        <div class="evo-row">${names.map((n,i)=>
          `${i>0?'<span class="evo-arrow">▸</span>':''}
           <span class="evo-name">${n}</span>`
        ).join('')}</div></div>`;
    }
  }
 
  // Abilities
  const abHTML = data.abilities?.map(a=>{
    const cl = a.is_hidden?'ability hidden-ab':'ability';
    return `<span class="${cl}" title="${a.is_hidden?'Habilidade oculta':''}">${a.ability.name.replace(/-/g,' ')}</span>`;
  }).join('') ?? '';
 
  // Stats
  const statsHTML = data.stats.map(s=>{
    const lbl = STAT_LABELS[s.stat.name]??s.stat.name;
    const pct = Math.min(100,(s.base_stat/255)*100);
    const col = statColor(s.base_stat);
    return `<div class="stat-row">
      <span class="stat-name">${lbl}</span>
      <span class="stat-val">${s.base_stat}</span>
      <div class="stat-track"><div class="stat-bar" data-pct="${pct.toFixed(1)}" style="background:${col}"></div></div>
    </div>`;
  }).join('');
 
  // Pills
  const pillsHTML = types.map(t=>{
    const th=typeOf(t);
    return `<span class="pill" style="background:${th.pill}20;border-color:${th.pill}55;color:${th.pill}">${t}</span>`;
  }).join('');
 
  const card = document.createElement('div');
  card.className = 'poke-card';
  card.style.background = theme.bg;
 
  card.innerHTML = `
    <div class="card-strip" style="background:${theme.glow}"></div>
    <div class="card-content">
      <div class="card-head">
        <span class="card-num">#${String(data.id).padStart(4,'0')}</span>
        <div class="pills">${pillsHTML}</div>
      </div>
      <div class="card-hero">
        <div>
          <div class="card-name">${data.name}</div>
          ${genus?`<div class="card-genus">${genus}</div>`:''}
        </div>
        <div class="card-sprite-wrap">
          <img class="card-sprite" src="${sp}" alt="${data.name}" loading="lazy">
        </div>
      </div>
      ${flavor?`<div class="card-flavor">"${flavor.slice(0,125)}${flavor.length>125?'…':''}"</div>`:''}
      <div class="stats-title">ATRIBUTOS</div>
      ${statsHTML}
      ${abHTML?`<div class="abilities">${abHTML}</div>`:''}
      ${evoHTML}
      <div class="card-meta">
        <div class="meta-item"><div class="meta-val">${(data.weight/10).toFixed(1)}</div><div class="meta-lbl">KG</div></div>
        <div class="meta-item"><div class="meta-val">${(data.height/10).toFixed(1)}</div><div class="meta-lbl">METRO</div></div>
        <div class="meta-item"><div class="meta-val">${total}</div><div class="meta-lbl">BST</div></div>
        <div class="meta-item"><div class="meta-val">${data.base_experience??'?'}</div><div class="meta-lbl">EXP</div></div>
      </div>
      <div class="card-btns">
        <button class="card-btn" id="cb-${data.name}" onclick="addToSlot(event,'${data.name}')">⚔ BATALHA</button>
        <button class="card-btn" id="cc-${data.name}" onclick="addToRoster(event,'${data.name}')">🏆 CAMPEONATO</button>
      </div>
    </div>`;
 
  // Add hover glow
  card.addEventListener('mouseenter',()=>{
    card.style.boxShadow=`0 0 28px ${theme.glow}35, 0 8px 36px rgba(0,0,0,.6)`;
    card.style.transform='translateY(-4px)';
    card.style.borderColor=theme.glow+'25';
  });
  card.addEventListener('mouseleave',()=>{
    card.style.boxShadow='';
    card.style.transform='';
    card.style.borderColor='';
  });
 
  // Animate stat bars
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      card.querySelectorAll('.stat-bar').forEach(el=>{
        el.style.width = el.dataset.pct+'%';
      });
    },80);
  });
 
  return card;
}
 
function parseEvolutions(chain){
  const out=[];let n=chain?.chain;
  while(n){out.push(n.species.name);n=n.evolves_to?.[0]??null}
  return out;
}
 
// =====================================================
// SEARCH
// =====================================================
async function verPokemon(){
  const q    = document.getElementById('buscador').value.trim();
  const grid = document.getElementById('pikomons');
  const spin = document.getElementById('spinner');
  if(!q){toast('Digite um nome ou número!','err');return}
 
  spin.classList.add('show');
  grid.innerHTML='';
 
  try{
    const data    = await fetchPoke(q);
    const species = await fetchSpecies(data.id);
    spin.classList.remove('show');
    const card = await buildCard(data,species);
    grid.appendChild(card);
    rebuildBtns();
  }catch{
    spin.classList.remove('show');
    grid.innerHTML=`<div class="empty-state"><div class="empty-icon">?</div><p>"${q}"<br>NÃO ENCONTRADO</p></div>`;
  }
}
 
async function randomPokemon(){
  document.getElementById('buscador').value = Math.floor(Math.random()*898)+1;
  await verPokemon();
}
 
function rebuildBtns(){
  cache.forEach(p=>{
    const cb=document.getElementById('cb-'+p.name);
    const cc=document.getElementById('cc-'+p.name);
    if(cb){
      const has=slots.includes(p.name);
      cb.classList.toggle('in-slot',has);
      cb.textContent=has?'✓ NO SLOT':'⚔ BATALHA';
    }
    if(cc){
      const has=roster.some(r=>r.name===p.name);
      cc.classList.toggle('in-roster',has);
      cc.textContent=has?'✓ ROSTER':'🏆 CAMPEONATO';
    }
  });
}
 
// =====================================================
// BATTLE SLOTS
// =====================================================
async function addToSlot(e,name){
  e.stopPropagation();
  if(slots[0]===name||slots[1]===name){toast(`${name} já está em um slot!`,'err');return}
  const p=await fetchPoke(name);
  if(slots[0]===null){
    slots[0]=name; fillSlot('a',p); toast(`${name} → Slot 1`,'ok');
  } else if(slots[1]===null){
    slots[1]=name; fillSlot('b',p); toast(`${name} → Slot 2`,'ok');
  } else {
    // Replace slot A
    slots[0]=name; fillSlot('a',p);
    document.getElementById('live-arena').classList.remove('show');
    toast(`Slot 1 atualizado para ${name}`,'ok');
  }
  rebuildBtns();
}
 
function fillSlot(id,p){
  const el=document.getElementById('slot-'+id);
  const types=p.types.map(t=>t.type.name);
  const th=typeOf(types[0]);
  el.classList.add('has-fighter');
  el.style.borderColor=th.glow+'55';
  el.innerHTML=`
    <img class="fighter-img" src="${sprite(p)}" alt="${p.name}">
    <div class="fighter-name">${p.name}</div>
    <div class="fighter-types">${types.map(t=>{
      const tt=typeOf(t);
      return `<span class="pill" style="background:${tt.pill}20;border-color:${tt.pill}55;color:${tt.pill};font-size:10px;padding:2px 7px">${t}</span>`;
    }).join('')}</div>
    <div class="fighter-bst">BST: ${bst(p)}</div>`;
}
 
function clearBattle(){
  slots=[null,null];
  ['a','b'].forEach((s,i)=>{
    const el=document.getElementById('slot-'+s);
    el.classList.remove('has-fighter');
    el.style.borderColor='';
    el.innerHTML=`<div class="slot-empty-txt">SLOT ${i+1}</div><div class="slot-empty-sub">VAZIO</div>`;
  });
  document.getElementById('live-arena').classList.remove('show');
  document.getElementById('winner').classList.remove('show');
  rebuildBtns();
}
 
// =====================================================
// BATTLE ENGINE
// =====================================================
async function startBattle(){
  if(!slots[0]||!slots[1]){toast('Adicione 2 Pokémon diferentes!','err');return}
  if(slots[0]===slots[1]){toast('Pokémon repetido nos slots!','err');return}
 
  const a=await fetchPoke(slots[0]);
  const b=await fetchPoke(slots[1]);
  const arena=document.getElementById('live-arena');
  arena.classList.add('show');
  document.getElementById('winner').classList.remove('show');
  document.getElementById('terminal').innerHTML='';
 
  let hpA=stat(a,'hp'), hpB=stat(b,'hp');
  const mA=hpA, mB=hpB;
  const atkA=stat(a,'attack'), defA=stat(a,'defense');
  const atkB=stat(b,'attack'), defB=stat(b,'defense');
 
  document.getElementById('hp-name-a').textContent=a.name;
  document.getElementById('hp-name-b').textContent=b.name;
  setHP('a',hpA,mA); setHP('b',hpB,mB);
 
  tlog(`${a.name.toUpperCase()} VS ${b.name.toUpperCase()}`,'log-sys');
  tlog(`HP: ${a.name}=${hpA} / ${b.name}=${hpB}`,'log-sys');
 
  for(let t=1;t<=50;t++){
    await sleep(350);
    const cA=Math.random()<.1;
    let dA=Math.max(1,Math.floor((atkA/defB)*(10+Math.random()*9)));
    if(cA)dA=Math.floor(dA*1.5);
    hpB=Math.max(0,hpB-dA);
    tlog(`${a.name.toUpperCase()} → ${dA} dano${cA?' [CRÍTICO]':''}`,cA?'log-crit':'');
    setHP('b',hpB,mB);
    if(hpB<=0)break;
 
    await sleep(270);
    const cB=Math.random()<.1;
    let dB=Math.max(1,Math.floor((atkB/defA)*(10+Math.random()*9)));
    if(cB)dB=Math.floor(dB*1.5);
    hpA=Math.max(0,hpA-dB);
    tlog(`${b.name.toUpperCase()} → ${dB} dano${cB?' [CRÍTICO]':''}`,cB?'log-crit':'');
    setHP('a',hpA,mA);
    if(hpA<=0)break;
 
    if(t%5===0)tlog(`Turno ${t} | ${a.name}:${hpA}hp ${b.name}:${hpB}hp`,'log-sys');
  }
 
  await sleep(380);
  if(hpA>hpB){tlog(`${b.name.toUpperCase()} NOCAUTEADO!`,'log-ko');tlog(`${a.name.toUpperCase()} VENCEU!`,'log-win');showWinner(a)}
  else if(hpB>hpA){tlog(`${a.name.toUpperCase()} NOCAUTEADO!`,'log-ko');tlog(`${b.name.toUpperCase()} VENCEU!`,'log-win');showWinner(b)}
  else tlog('EMPATE!','log-crit');
}
 
function tlog(msg,cls=''){
  const t=document.getElementById('terminal');
  const d=document.createElement('div');
  d.className=cls; d.textContent='> '+msg;
  t.appendChild(d); t.scrollTop=t.scrollHeight;
}
function setHP(s,cur,max){
  const pct=Math.max(0,(cur/max)*100);
  const fill=document.getElementById('hp-fill-'+s);
  const val=document.getElementById('hp-val-'+s);
  fill.style.width=pct+'%';
  fill.style.backgroundColor=pct>50?'#00e676':pct>20?'#ffee58':'#ef5350';
  val.textContent=`${cur}/${max} HP`;
}
function showWinner(p){
  const w=document.getElementById('winner');
  document.getElementById('winner-img').src=sprite(p);
  document.getElementById('winner-name').textContent=p.name;
  w.classList.add('show');
}
 
// =====================================================
// CHAMPIONSHIP
// =====================================================
async function addToRoster(e,name){
  e.stopPropagation();
  if(roster.some(r=>r.name===name)){toast(`${name} já está no roster!`,'err');return}
  const p=await fetchPoke(name);
  roster.push(p); renderRoster(); rebuildBtns();
  toast(`${name} adicionado ao campeonato!`,'ok');
}
 
function removeFromRoster(name){
  roster=roster.filter(p=>p.name!==name);
  renderRoster(); rebuildBtns();
}
 
function clearRoster(){
  roster=[]; renderRoster(); rebuildBtns();
  document.getElementById('prog-card').classList.remove('show');
  document.getElementById('lb-card').classList.remove('show');
  document.getElementById('champ-reveal').classList.remove('show');
  running=false;
}
 
function renderRoster(){
  const el=document.getElementById('roster');
  el.querySelectorAll('.chip').forEach(c=>c.remove());
  const empty=document.getElementById('roster-empty');
  if(roster.length===0){if(empty)empty.style.display='';return}
  if(empty)empty.style.display='none';
  roster.forEach(p=>{
    const th=typeOf(p.types[0].type.name);
    const c=document.createElement('div');
    c.className='chip';
    c.style.background=th.glow+'22';
    c.style.borderColor=th.glow+'45';
    c.innerHTML=`<img src="${sprite(p)}" alt="${p.name}"><span>${p.name}</span>
      <button class="chip-del" onclick="removeFromRoster('${p.name}')">×</button>`;
    el.appendChild(c);
  });
}
 
// Silent fast fight simulation
function simFight(a,b){
  const atkA=stat(a,'attack'),defA=stat(a,'defense');
  const atkB=stat(b,'attack'),defB=stat(b,'defense');
  let hA=stat(a,'hp'),hB=stat(b,'hp');
  for(let t=0;t<60;t++){
    const cA=Math.random()<.1;
    let dA=Math.max(1,Math.floor((atkA/defB)*(8+Math.random()*10)));
    if(cA)dA=Math.floor(dA*1.5);
    hB-=dA; if(hB<=0)return'a';
    const cB=Math.random()<.1;
    let dB=Math.max(1,Math.floor((atkB/defA)*(8+Math.random()*10)));
    if(cB)dB=Math.floor(dB*1.5);
    hA-=dB; if(hA<=0)return'b';
  }
  return hA>hB?'a':hA<hB?'b':'draw';
}
 
async function startChamp(){
  if(running){toast('Campeonato em andamento!','err');return}
  if(roster.length<2){toast('Adicione ao menos 2 Pokémon!','err');return}
  running=true;
 
  document.getElementById('champ-reveal').classList.remove('show');
  document.getElementById('prog-card').classList.add('show');
  document.getElementById('lb-card').classList.add('show');
  document.getElementById('prog-fill').style.width='0%';
  document.getElementById('prog-count').textContent='0 / 100';
 
  const score={};
  roster.forEach(p=>{score[p.name]={pts:0,w:0,l:0,d:0}});
 
  // Generate 100 matchups (never same index)
  const matchups=[];
  for(let i=0;i<100;i++){
    let ia,ib;
    do{ia=Math.floor(Math.random()*roster.length);ib=Math.floor(Math.random()*roster.length)}
    while(ia===ib);
    matchups.push([ia,ib]);
  }
 
  for(let i=0;i<100;i++){
    const pa=roster[matchups[i][0]];
    const pb=roster[matchups[i][1]];
    const r=simFight(pa,pb);
    if(r==='a'){score[pa.name].pts+=3;score[pa.name].w++;score[pb.name].l++}
    else if(r==='b'){score[pb.name].pts+=3;score[pb.name].w++;score[pa.name].l++}
    else{score[pa.name].pts+=1;score[pb.name].pts+=1;score[pa.name].d++;score[pb.name].d++}
 
    const pct=((i+1)/100)*100;
    document.getElementById('prog-fill').style.width=pct+'%';
    document.getElementById('prog-count').textContent=`${i+1} / 100`;
    const winner=r==='draw'?'EMPATE':(r==='a'?pa.name:pb.name).toUpperCase();
    document.getElementById('prog-fight').textContent=`${pa.name.toUpperCase()} ⚔ ${pb.name.toUpperCase()} → ${winner}`;
    renderLB(score);
    await sleep(25);
  }
 
  await sleep(300);
  showChamp(score);
  running=false;
}
 
function renderLB(score){
  const sorted=Object.entries(score).sort(([,a],[,b])=>b.pts-a.pts||b.w-a.w);
  const list=document.getElementById('lb-list');
  list.innerHTML='';
  sorted.forEach(([name,s],i)=>{
    const p=roster.find(r=>r.name===name);
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
    const rc=i===0?'r1':i===1?'r2':i===2?'r3':'';
    const row=document.createElement('div');
    row.className=`lb-row ${rc}`;
    row.innerHTML=`
      <div class="lb-rank">${medal}</div>
      <img class="lb-sprite" src="${p?sprite(p):''}" alt="${name}">
      <div class="lb-name">${name}</div>
      <div class="lb-pts">${s.pts} PTS</div>
      <div class="lb-rec">${s.w}V ${s.l}D ${s.d}E</div>`;
    list.appendChild(row);
  });
}
 
function showChamp(score){
  const sorted=Object.entries(score).sort(([,a],[,b])=>b.pts-a.pts||b.w-a.w);
  const [name,s]=sorted[0];
  const p=roster.find(r=>r.name===name);
  document.getElementById('champ-img').src=p?sprite(p):'';
  document.getElementById('champ-name').textContent=name;
  document.getElementById('champ-stats').innerHTML=`
    <div class="cs"><div class="cs-val">${s.pts}</div><div class="cs-lbl">PONTOS</div></div>
    <div class="cs"><div class="cs-val">${s.w}</div><div class="cs-lbl">VITÓRIAS</div></div>
    <div class="cs"><div class="cs-val">${s.l}</div><div class="cs-lbl">DERROTAS</div></div>
    <div class="cs"><div class="cs-val">${s.d}</div><div class="cs-lbl">EMPATES</div></div>`;
  const rev=document.getElementById('champ-reveal');
  rev.classList.add('show');
  rev.scrollIntoView({behavior:'smooth',block:'center'});
}