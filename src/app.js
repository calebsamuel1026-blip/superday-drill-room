/* ==========================================================================
   Superday Drill Room — app
   Views: Drill · Mock interview · Mastery · Question bank · Progress
   ========================================================================== */
(() => {
"use strict";

/* ---------- Icons (SF Symbols-style) ---------- */
const P = {
  mic:'<path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 1 0-7 0v6A3.5 3.5 0 0 0 12 15Z" fill="currentColor"/><path d="M18 11.4a6 6 0 0 1-12 0M12 17.4V21M8.8 21h6.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  person2:'<circle cx="9" cy="8" r="3.4" fill="currentColor"/><path d="M2.8 19.5c.6-3.6 3.1-5.6 6.2-5.6s5.6 2 6.2 5.6Z" fill="currentColor"/><circle cx="16.6" cy="8.8" r="2.7" fill="currentColor" opacity=".7"/><path d="M15.6 13.6c3.1-.3 5.3 1.6 5.7 4.9h-4.4c-.2-1.9-.6-3.4-1.3-4.9Z" fill="currentColor" opacity=".7"/>',
  target:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  books:'<rect x="3.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor"/><rect x="9.5" y="4" width="4.5" height="16" rx="1.2" fill="currentColor" opacity=".75"/><path d="m15.6 5.6 4.2-1.2 3 14.3-4.3 1.1Z" fill="currentColor" opacity=".55"/>',
  chart:'<rect x="4" y="12" width="3.6" height="8" rx="1" fill="currentColor"/><rect x="10.2" y="7" width="3.6" height="13" rx="1" fill="currentColor"/><rect x="16.4" y="3.5" width="3.6" height="16.5" rx="1" fill="currentColor"/>',
  gear:'<path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm8.4 4.6-1.8-.4a6.8 6.8 0 0 0-.6-1.5l1-1.5a.9.9 0 0 0-.1-1.2l-1.1-1.1a.9.9 0 0 0-1.2-.1l-1.5 1a6.8 6.8 0 0 0-1.5-.6l-.4-1.8a.9.9 0 0 0-.9-.7h-1.6a.9.9 0 0 0-.9.7l-.4 1.8a6.8 6.8 0 0 0-1.5.6l-1.5-1a.9.9 0 0 0-1.2.1L4.1 8.6a.9.9 0 0 0-.1 1.2l1 1.5a6.8 6.8 0 0 0-.6 1.5l-1.8.4a.9.9 0 0 0-.7.9v1.6c0 .4.3.8.7.9l1.8.4c.1.5.3 1 .6 1.5l-1 1.5a.9.9 0 0 0 .1 1.2l1.1 1.1c.3.3.8.4 1.2.1l1.5-1c.5.3 1 .5 1.5.6l.4 1.8c.1.4.5.7.9.7h1.6c.4 0 .8-.3.9-.7l.4-1.8c.5-.1 1-.3 1.5-.6l1.5 1c.4.3.9.2 1.2-.1l1.1-1.1c.3-.3.4-.8.1-1.2l-1-1.5c.3-.5.5-1 .6-1.5l1.8-.4c.4-.1.7-.5.7-.9v-1.6a.9.9 0 0 0-.7-.9Z" fill="currentColor" transform="translate(0 -1.2)"/>',
  sidebar:'<rect x="3" y="4.5" width="18" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 4.5v15" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 8h2M5.5 11h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  speaker:'<path d="M4 9.5h3l4.4-3.7c.5-.4 1.1 0 1.1.6v11.2c0 .6-.7 1-1.1.6L7 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  bulb:'<path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="currentColor"/><path d="M9.6 18.4h4.8M10.4 21h3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  forward:'<path d="M4 6.3v11.4c0 .8.9 1.3 1.5.8L12 13.3v4.4c0 .8.9 1.3 1.5.8l7.2-5.7a1 1 0 0 0 0-1.6l-7.2-5.7c-.6-.5-1.5 0-1.5.8v4.4L5.5 5.5C4.9 5 4 5.5 4 6.3Z" fill="currentColor"/>',
  retry:'<path d="M5 12a7 7 0 1 0 2.2-5.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5.2 3.6v4.2h4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  sparkles:'<path d="M10 3.5c.4 3.6 2.5 5.9 6 6.4-3.5.6-5.6 2.8-6 6.4-.4-3.6-2.5-5.8-6-6.4 3.5-.5 5.6-2.8 6-6.4Z" fill="currentColor"/><path d="M17.5 13.5c.2 1.8 1.2 2.9 3 3.2-1.8.3-2.8 1.4-3 3.2-.2-1.8-1.2-2.9-3-3.2 1.8-.3 2.8-1.4 3-3.2ZM18 3c.15 1.2.8 1.9 2 2.1-1.2.2-1.85.9-2 2.1-.15-1.2-.8-1.9-2-2.1 1.2-.2 1.85-.9 2-2.1Z" fill="currentColor" opacity=".75"/>',
  check:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  half:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>',
  xmark:'<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  warn:'<path d="M10.3 4.2a2 2 0 0 1 3.4 0l7.5 13a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3Z" fill="currentColor"/><path d="M12 9v4.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.7" r="1.3" fill="#fff"/>',
  wand:'<path d="m4 20 10.5-10.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="m14.5 9.5 2-2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".5"/><path d="M17.5 2.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6ZM20.5 9.5l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4ZM10.5 3.5l.4 1.2 1.2.4-1.2.4-.4 1.2-.4-1.2-1.2-.4 1.2-.4Z" fill="currentColor"/>',
  quote:'<path d="M5 6h5v5c0 3.5-1.6 6-4.8 7l-.7-1.4c1.6-.8 2.4-2 2.5-3.6H5Zm9 0h5v5c0 3.5-1.6 6-4.8 7l-.7-1.4c1.6-.8 2.4-2 2.5-3.6H14Z" fill="currentColor"/>',
  scissors:'<circle cx="6" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="17" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 8.8 20 17M8.5 15.2 20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  text:'<path d="M4 5.5h16M4 10h16M4 14.5h10M4 19h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  bubble:'<path d="M12 4c4.7 0 8.5 3 8.5 6.8s-3.8 6.8-8.5 6.8c-.9 0-1.8-.1-2.6-.3L5 19.5l1-3.6C4.4 14.7 3.5 12.9 3.5 10.8 3.5 7 7.3 4 12 4Z" fill="currentColor"/>',
  thumbs:'<path d="M7 10.5v9H4.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Zm2 9h7.6a2 2 0 0 0 2-1.6l1.2-6a2 2 0 0 0-2-2.4h-4.2l.6-3.3a1.8 1.8 0 0 0-3.4-1.1L9 10.5Z" fill="currentColor"/>',
  list:'<circle cx="5" cy="6.5" r="1.6" fill="currentColor"/><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="5" cy="17.5" r="1.6" fill="currentColor"/><path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  stopwatch:'<circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 13.5V9.5M10 2.8h4M18.5 6.5l1.2-1.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  gauge:'<path d="M3.5 16a8.5 8.5 0 1 1 17 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m12 16 4-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16" r="1.8" fill="currentColor"/>',
  flame:'<path d="M12 2.5c.6 3.2 4.8 5.3 4.8 10.2A4.8 4.8 0 0 1 12 17.5a4.8 4.8 0 0 1-4.8-4.8c0-2.2 1.2-3.6 2.2-4.7.2 1.5 1 2.4 2 2.7-.5-3.6.3-5.8.6-8.2Z" fill="currentColor"/><path d="M8 21h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".5"/>',
  calc:'<rect x="5" y="3" width="14" height="18" rx="2.5" fill="currentColor"/><rect x="7.5" y="5.5" width="9" height="3.5" rx="1" fill="#fff" opacity=".9"/><g fill="#fff"><circle cx="8.8" cy="12.5" r="1.1"/><circle cx="12" cy="12.5" r="1.1"/><circle cx="15.2" cy="12.5" r="1.1"/><circle cx="8.8" cy="16.5" r="1.1"/><circle cx="12" cy="16.5" r="1.1"/><circle cx="15.2" cy="16.5" r="1.1"/></g>',
  dollar:'<circle cx="12" cy="12" r="9.5" fill="currentColor"/><path d="M14.8 9c-.4-1-1.4-1.6-2.8-1.6-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1c1.8.4 2.9 1 2.9 2.3s-1.2 2.2-2.9 2.2c-1.5 0-2.6-.6-3-1.8M12 6v1.4M12 16v1.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>',
  merge:'<path d="M6 4v5.5c0 2 1.2 3.5 3.3 4.2l2.7 1V20M18 4v5.5c0 2-1.2 3.5-3.3 4.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="6" cy="4" r="2" fill="currentColor"/><circle cx="18" cy="4" r="2" fill="currentColor"/>',
  globe:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c2.5 2.5 3.6 5.4 3.6 9S14.5 18.5 12 21c-2.5-2.5-3.6-5.4-3.6-9S9.5 5.5 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  person:'<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20.5c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5Z" fill="currentColor"/>',
  building:'<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V9h3.5A1.5 1.5 0 0 1 20 10.5V21Z" fill="currentColor"/><g fill="#fff" opacity=".9"><rect x="7" y="7" width="2" height="2" rx=".4"/><rect x="10.5" y="7" width="2" height="2" rx=".4"/><rect x="7" y="11" width="2" height="2" rx=".4"/><rect x="10.5" y="11" width="2" height="2" rx=".4"/><rect x="16" y="12" width="2" height="2" rx=".4"/><rect x="16" y="16" width="2" height="2" rx=".4"/><rect x="8.5" y="16" width="3" height="5" rx=".4"/></g>',
  note:'<path d="M6 3h8l5 5v11.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6 3Z" fill="currentColor"/><path d="M14 3v5h5" fill="#fff" opacity=".5"/><path d="M8.5 12.5h7M8.5 16h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
  chevron:'<path d="m1.5 1.5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  close:'<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 5.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" fill="currentColor"/>',
  play:'<path d="M7 4.8v14.4c0 .8.9 1.3 1.6.8l11-7.2a1 1 0 0 0 0-1.6l-11-7.2C7.9 3.5 7 4 7 4.8Z" fill="currentColor"/>',
  key:'<circle cx="8" cy="15.5" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m11.3 12.2 8.7-8.7M17 6.5l2.5 2.5M14.5 9l2 2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
};
const ic = (name, cls="i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name]||""}</svg>`;
const chevEl = () => h("span", {style:{display:"inline-flex"}, html:`<svg class="chev" viewBox="0 0 8 13" aria-hidden="true">${P.chevron}</svg>`});
document.querySelectorAll("[data-icon]").forEach(e => e.innerHTML = ic(e.dataset.icon));

/* ---------- Tiny DOM helper ---------- */
function h(tag, props, ...kids){
  const e = document.createElement(tag);
  if (props) for (const [k,v] of Object.entries(props)){
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()){ if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}
const $ = id => document.getElementById(id);

/* ---------- Storage adapter ----------
   Everything goes through `store`, so a remote backend (accounts) can be
   dropped in later without touching the views. */
// Account data (progress, history, custom) lives under a per-user prefix when
// signed in, and is mirrored to the cloud. Device preferences stay global.
const ACCOUNT_KEYS = new Set(["progress","history","custom"]);
let acctPrefix = "sdr:";
const store = {
  key(k){ return (ACCOUNT_KEYS.has(k) ? acctPrefix : "sdr:") + k; },
  get(k, d){ try{ const v = localStorage.getItem(this.key(k)); return v ? JSON.parse(v) : d; }catch{ return d; } },
  set(k, v){ try{ localStorage.setItem(this.key(k), JSON.stringify(v)); }catch{} if (ACCOUNT_KEYS.has(k) && typeof Cloud !== "undefined") Cloud.queueSave(); },
};
let progress = store.get("progress", {});   // id -> {scores:[], q, t, last, flag}
let history = store.get("history", []);     // graded attempts with sub-scores
let custom = store.get("custom", []);
function loadAccountData(){ progress = store.get("progress", {}); history = store.get("history", []); custom = store.get("custom", []); }
function writeAccountData(d){
  try{ for (const k of ACCOUNT_KEYS) localStorage.setItem(store.key(k), JSON.stringify(d[k] || (k === "progress" ? {} : []))); }catch{}
  loadAccountData();
}
if (typeof Cloud !== "undefined") Cloud.setSnapshot(() => ({progress, history, custom}));
const settings = Object.assign({autoGrade:false, voice:"", strict:"standard", theme:"system", aiMode:"auto", aiModel:"claude-opus-5-5", order:"smart"}, store.get("settings", {}));
const saveSettings = () => store.set("settings", settings);
const bankFilter = Object.assign({source:"all", topic:"", level:"", search:""}, store.get("bankFilter", {}));
let HAS_VINE = typeof VINE_BANK !== "undefined" && VINE_BANK.length > 0;
const VINE = HAS_VINE ? VINE_BANK.slice() : [];
let HAS_BIWS = typeof BIWS_BANK !== "undefined" && BIWS_BANK.length > 0;
const BIWS = HAS_BIWS ? BIWS_BANK.slice() : [];
// The page's own banks, restored on sign-out after an account's private bank replaced them.
const PAGE_BANKS = {vine: VINE.slice(), biws: BIWS.slice()};
function useBanks(b){
  const swap = (arr, next) => { arr.length = 0; arr.push(...next); };
  if (Array.isArray(b.vine)) swap(VINE, b.vine.filter(q => q && q.id && q.q));
  if (Array.isArray(b.biws)) swap(BIWS, b.biws.filter(q => q && q.id && q.q));
  HAS_VINE = VINE.length > 0; HAS_BIWS = BIWS.length > 0;
}
if ((!HAS_VINE && bankFilter.source === "vine") || (!HAS_BIWS && bankFilter.source === "biws")) bankFilter.source = "original";
const BIWS_GUIDES = {accounting:"BIWS Accounting guide", ev:"BIWS Equity & Enterprise Value guide", dcf:"BIWS Valuation & DCF guide", merger:"BIWS Merger Model guide", lbo:"BIWS LBO guide"};
const sourceOk = q => bankFilter.source === "all" || (bankFilter.source === "original" ? q.source !== "vine" && q.source !== "biws" : q.source === bankFilter.source);
let apiKey = (() => { try{ return localStorage.getItem("sdr:apikey") || ""; }catch{ return ""; } })();

function applyTheme(){ if (settings.theme === "system") document.documentElement.removeAttribute("data-theme"); else document.documentElement.dataset.theme = settings.theme; }
applyTheme();

/* ---------- Question pool ---------- */
const allQs = () => BANK.concat(VINE, BIWS, custom);
function filtered(){
  const query = (bankFilter.search||"").trim().toLowerCase();
  return allQs().filter(q =>
    sourceOk(q) &&
    (!bankFilter.topic || q.topic === bankFilter.topic) &&
    (!bankFilter.level || q.l === bankFilter.level) &&
    (!query || [q.q, q.topic, ...(q.tags||[])].join(" ").toLowerCase().includes(query)));
}
const TRACK_STYLE = {acct:["calc","c-blue"], beh:["person","c-orange"], val:["dollar","c-green"], deal:["merge","c-purple"], mkt:["globe","c-teal"], sector:["building","c-indigo"], mine:["note","c-pink"]};
const trackName = id => (TRACKS.find(t=>t.id===id)||{name:"Follow-up"}).name;
const firmTag = q => (q.tags||[]).map(t => (t.match(/Reported in (.+?) Interview/)||[])[1]).find(Boolean);

/* ---------- Mastery ---------- */
const LEVELS = [
  {id:"mastered", name:"Mastered", color:"green", short:"Mastered"},
  {id:"close", name:"Getting there", color:"blue", short:"Close"},
  {id:"work", name:"Needs work", color:"orange", short:"Work"},
  {id:"redo", name:"Really needs work", color:"red", short:"Redo"},
  {id:"new", name:"Not started", color:"gray", short:"New"},
];
const LV = Object.fromEntries(LEVELS.map(l=>[l.id,l]));
function levelOf(id){
  const p = progress[id];
  if (!p || !p.scores.length) return p && p.flag ? p.flag : "new";
  if (p.flag) return p.flag;
  const s = p.scores, last = s.at(-1), prev = s.at(-2);
  if (last >= 8 && (prev === undefined ? last >= 9 : prev >= 7)) return "mastered";
  if (last >= 6) return "close";
  if (last >= 4) return "work";
  return "redo";
}
function mix(qs){
  const c = {mastered:0, close:0, work:0, redo:0, new:0};
  qs.forEach(q => c[levelOf(q.id)]++);
  return c;
}
function mixBar(c, total){
  const bar = h("div", {class:"bar", style:{display:"flex", height:"8px", borderRadius:"4px"}});
  ["mastered","close","work","redo"].forEach(k => { if (c[k]) bar.append(h("i", {style:{width:(c[k]/total*100)+"%", background:`var(--${LV[k].color})`, borderRadius:0}})); });
  return bar;
}
function topicLevel(c){
  const tried = c.mastered + c.close + c.work + c.redo;
  if (!tried) return "new";
  const score = (c.mastered*4 + c.close*3 + c.work*2 + c.redo*1) / tried;
  return score >= 3.5 ? "mastered" : score >= 2.75 ? "close" : score >= 2 ? "work" : "redo";
}
const SKILLS = [
  {k:"content", name:"Content", icon:"list", color:"pink", tip:"Covering the key points interviewers listen for."},
  {k:"accuracy", name:"Technical accuracy", icon:"calc", color:"red", tip:"No wrong numbers, directions or definitions."},
  {k:"structure", name:"Structure", icon:"text", color:"green", tip:"Answer first, signposts, clean close, STAR for stories."},
  {k:"concision", name:"Concision", icon:"scissors", color:"teal", tip:"Right length, no tangents, no repeating yourself."},
  {k:"delivery", name:"Delivery", icon:"bubble", color:"indigo", tip:"Few fillers and hedges, steady pace, no restarts."},
];
function skillStats(){
  const recent = history.slice(-20);
  return SKILLS.map(s => {
    const v = recent.map(x => x.sub && x.sub[s.k]).filter(x => typeof x === "number");
    const avg = v.length ? v.reduce((a,b)=>a+b,0)/v.length : null;
    const lvl = avg === null ? "new" : avg >= 8.5 ? "mastered" : avg >= 6.5 ? "close" : avg >= 4.5 ? "work" : "redo";
    return {...s, avg, n:v.length, lvl};
  });
}

/* ---------- Claude (optional) ---------- */
let sample = null;
setTimeout(async () => { if (!window.claude) return; try{ sample = await window.claude.use("sample"); }catch{ sample = null; } render(); });
const aiAvailable = () => !!(sample || apiKey);
const STYLE = {
  standard:"a first-round investment banking analyst interviewer: fair, direct, specific",
  tough:"a tough managing director at a top investment bank: strict and blunt, with zero credit for vague or rambling answers",
  coach:"a supportive interview coach: encouraging, but honest about every mistake",
};
const AI_SCHEMA = {type:"object", additionalProperties:false,
  required:["score","verdict","got_right","missed","corrections","wording","rambling","structure","improved_version","model_answer","follow_up","follow_up_keys"],
  properties:{
    score:{type:"integer"}, verdict:{type:"string"},
    got_right:{type:"array", items:{type:"string"}}, missed:{type:"array", items:{type:"string"}}, corrections:{type:"array", items:{type:"string"}},
    wording:{type:"array", items:{type:"object", additionalProperties:false, required:["said","better","why"], properties:{said:{type:"string"}, better:{type:"string"}, why:{type:"string"}}}},
    rambling:{type:"string"}, structure:{type:"string"}, improved_version:{type:"string"}, model_answer:{type:"string"},
    follow_up:{type:"string"}, follow_up_keys:{type:"array", items:{type:"string"}},
  }};
function aiPrompt(q, answer, secs, local){
  const beh = q.t === "beh";
  return `You are ${STYLE[settings.strict]}. Grade a candidate's SPOKEN answer to an investment banking interview question and coach them to a better answer.
The answer came from speech-to-text, so ignore spelling and punctuation and obvious mis-transcriptions ("a R" = AR, "PP and E" = PP&E). Do judge content, accuracy, filler, rambling, structure, length and word choice, because they matter when spoken.

QUESTION (${q.l || "general"}, ${beh ? "behavioral/fit" : "technical"}): ${q.q}
ANSWER KEY (points a strong answer covers):
${(q.k||[]).map(k=>"- "+k).join("\n") || "- (none given; use expert judgment)"}
${q.answer && q.answer.length ? `FULL REFERENCE ANSWER (from the study guide):\n${q.answer.join("\n").slice(0, 3000)}\n` : ""}${local.corrections.length ? `POSSIBLE ERRORS FLAGGED BY AN AUTOMATED CHECK (verify each; drop any that are wrong):\n${local.corrections.map(c => "- " + c).join("\n")}\n` : ""}TARGET LENGTH: about ${q.s||60} seconds. ACTUAL: ${secs ? secs+" seconds" : "unknown"}, ${local.stats.words} words.
AUTOMATED DELIVERY CHECK: ${local.stats.fillers} filler words, ${local.stats.hedges} hedges${local.stats.wpm ? ", "+local.stats.wpm+" wpm" : ""}.
${beh ? "For behavioral answers judge structure (STAR for stories), specificity, ownership (\"I\" not \"we\"), authenticity, concision and whether it would persuade a banker. The candidate's personal facts are theirs; don't penalize what you can't verify, and don't invent facts in rewrites." : "For technical answers any factual error or wrong number is a major deduction. Check every number and direction (up/down) they say."}

CANDIDATE ANSWER:
"""${answer.slice(0, 6000)}"""

Return JSON:
- score: integer 0-10, the score a real interviewer would give
- verdict: one sentence spoken directly to the candidate
- got_right: short points they nailed
- missed: key points they left out
- corrections: anything they said that is WRONG, as "what they said -> what's correct" (empty if none)
- wording: up to 5 specific phrases from their answer to upgrade: {said, better, why}
- rambling: one or two sentences on what to cut or tighten (empty string if concise)
- structure: one or two sentences on how to order the answer better
- improved_version: their own answer rewritten to a 9/10, keeping their voice and facts, sized to the target length
- model_answer: an ideal spoken answer, natural style, sized to the target length
- follow_up: one realistic follow-up question an interviewer would ask next, based on their answer
- follow_up_keys: 2-4 points a strong follow-up answer covers`;
}
async function callClaude(prompt, signal){
  if (sample) return sample.json(prompt + "\n\nReply with only the JSON object.", {signal, cache:false});
  if (!apiKey) throw {code:"no_ai"};
  const body = {model: settings.aiModel || "claude-opus-5-5", max_tokens: 8000,
    messages:[{role:"user", content: prompt}],
    output_config:{format:{type:"json_schema", schema: AI_SCHEMA}}};
  const headers = {"content-type":"application/json", "x-api-key":apiKey, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true"};
  const r = await fetch("https://api.anthropic.com/v1/messages", {method:"POST", headers, body: JSON.stringify(body), signal});
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw {code: r.status === 401 ? "bad_key" : r.status === 429 ? "rate_limited" : "api_error", message: data.error && data.error.message};
  if (data.stop_reason === "refusal") throw {code:"refusal"};
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  try { return JSON.parse(text); } catch { throw {code:"invalid_json"}; }
}

/* No spoken audio: the app never talks. */
const synth = null;

/* ---------- Speech in + level meter ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = {rec:null, on:false, base:"", final:"", stream:null, ctx:null, raf:0};
const DICTATE = "Tip: click in the answer box and use your keyboard's dictation (Win+H on Windows, press Fn twice on Mac). It works the same way.";
function setMicNote(t){ const n = $("micNote"); if (n){ n.textContent = t || ""; n.hidden = !t; } }
async function startMeter(){
  const wave = $("wave"); if (!wave) return;
  wave.classList.add("on");
  const bars = [...wave.children];
  try{
    mic.stream = await navigator.mediaDevices.getUserMedia({audio:true});
    mic.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const an = mic.ctx.createAnalyser(); an.fftSize = 64;
    mic.ctx.createMediaStreamSource(mic.stream).connect(an);
    const buf = new Uint8Array(an.frequencyBinCount);
    const loop = () => { an.getByteFrequencyData(buf); bars.forEach((b,i) => { const v = buf[(i*2+2) % buf.length] / 255; b.style.height = (3 + v*23) + "px"; }); mic.raf = requestAnimationFrame(loop); };
    loop();
  }catch{
    const loop = () => { bars.forEach(b => b.style.height = (4 + Math.random()*18) + "px"); mic.raf = setTimeout(loop, 110); };
    loop();
  }
}
function stopMeter(){
  cancelAnimationFrame(mic.raf); clearTimeout(mic.raf);
  try{ mic.stream && mic.stream.getTracks().forEach(t => t.stop()); }catch{}
  try{ mic.ctx && mic.ctx.close(); }catch{}
  mic.stream = mic.ctx = null;
  const wave = $("wave"); if (wave){ wave.classList.remove("on"); [...wave.children].forEach(b => b.style.height = "3px"); }
}
function startMic(){
  if (synth) synth.cancel();
  timer.start();
  if (!SR){ $("ans").focus(); setMicNote("This browser can't transcribe from the page. " + DICTATE); return; }
  const rec = mic.rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
  mic.base = $("ans").value.trim() ? $("ans").value.trim() + " " : ""; mic.final = "";
  rec.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++){ const r = e.results[i]; if (r.isFinal) mic.final += r[0].transcript.trim() + " "; else interim += r[0].transcript; }
    $("ans").value = mic.base + mic.final + interim; updateWC();
  };
  rec.onerror = e => { if (/not-allowed|service-not-allowed|audio-capture/.test(e.error)){ mic.on = false; setMicUI(false); stopMeter(); setMicNote("The page couldn't use the microphone. " + DICTATE); $("ans").focus(); } };
  rec.onend = () => { if (mic.on){ try{ rec.start(); }catch{} } };
  try{ rec.start(); mic.on = true; setMicUI(true); setMicNote(""); startMeter(); }catch{ setMicNote("The microphone didn't start. " + DICTATE); }
}
function stopMic(auto=true){
  mic.on = false; try{ mic.rec && mic.rec.stop(); }catch{}
  setMicUI(false); timer.stop(); stopMeter();
  if (auto && settings.autoGrade && $("ans") && $("ans").value.trim().length > 15) setTimeout(grade, 700);
}
function setMicUI(on){
  const b = $("recBtn"); if (!b) return;
  b.classList.toggle("on", on);
  b.setAttribute("aria-label", on ? "Stop recording" : "Start recording");
  $("recLabel").textContent = on ? "Listening… tap to stop" : "Tap to answer out loud";
}

/* ---------- Timer ---------- */
const timer = {t0:0, id:null, el:0,
  start(){ if (this.id) return; this.t0 = Date.now() - this.el*1000; this.id = setInterval(() => this.tick(), 250); },
  stop(){ clearInterval(this.id); this.id = null; },
  reset(){ this.stop(); this.el = 0; this.paint(); },
  tick(){ this.el = Math.floor((Date.now()-this.t0)/1000); this.paint(); },
  paint(){ const c = $("clock"); if (!c) return; c.textContent = Math.floor(this.el/60) + ":" + String(this.el%60).padStart(2,"0"); c.classList.toggle("over", !!(state.current && this.el > (state.current.s||90)*1.4)); },
};
function updateWC(){ const n = (($("ans")||{}).value || "").trim().match(/\S+/g)?.length || 0; const w = $("wc"); if (w) w.textContent = n + (n===1?" word":" words"); }

/* ---------- App state ---------- */
const state = {view:"drill", track: store.get("track","acct"), current:null, report:null, ai:null, aiBusy:false, mock:null, answer:"", bankShown:150};
const NAV = [
  {id:"drill", name:"Drill", icon:"mic", color:"c-red"},
  {id:"mock", name:"Mock interview", icon:"person2", color:"c-indigo"},
  {id:"mastery", name:"Mastery", icon:"target", color:"c-green"},
  {id:"bank", name:"Question bank", icon:"books", color:"c-orange"},
  {id:"progress", name:"Progress", icon:"chart", color:"c-blue"},
];

function go(view){
  if (mic.on) stopMic(false);
  if (view === "mock" && (!state.mock || state.mock.done)) startMock();
  state.view = view;
  closeDrawer();
  render();
  window.scrollTo({top:0});
}

/* ---------- Sidebar + tab bar ---------- */
function renderNav(){
  const m = $("navMain"); m.replaceChildren();
  const redo = allQs().filter(q => ["work","redo"].includes(levelOf(q.id)) && progress[q.id]).length;
  NAV.forEach(n => m.append(h("button", {class:"nav", "aria-current": String(state.view===n.id), onclick:() => go(n.id)},
    h("span", {class:"ic "+n.color, html:ic(n.icon)}), n.name,
    n.id === "mastery" && redo ? h("span", {class:"cnt badge", text:String(redo)}) : null)));
  const t = $("navTopics"); t.replaceChildren();
  const pool = filtered();
  if (HAS_VINE || HAS_BIWS){
    const opts = [HAS_VINE && ["vine","IB Vine"], HAS_BIWS && ["biws","BIWS guides"], ["original","Core drills"], ["all","All questions"]].filter(Boolean);
    t.append(h("select", {class:"selectbtn", "aria-label":"Question source", style:{margin:"0 8px 6px", width:"calc(100% - 16px)"},
      onchange:e => { bankFilter.source = e.target.value; bankFilter.topic = ""; bankFilter.level = ""; applyFilters(); }},
      ...opts.map(([k,n]) => h("option", {value:k, selected: bankFilter.source===k, text:`${n} (${allQs().filter(q => k==="all" || (k==="original" ? q.source!=="vine" && q.source!=="biws" : q.source===k)).length.toLocaleString()})`}))));
  }
  TRACKS.forEach(tr => {
    const qs = pool.filter(q => q.t === tr.id); if (!qs.length) return;
    const c = mix(qs); const done = c.mastered;
    const [icon, col] = TRACK_STYLE[tr.id] || ["list","c-gray"];
    t.append(h("button", {class:"nav", "aria-current": String(state.view==="drill" && state.track===tr.id), title:`${done} of ${qs.length} mastered`, onclick:() => { setTrack(tr.id); go("drill"); }},
      h("span", {class:"ic "+col, html:ic(icon)}), tr.name,
      h("span", {class:"meter"}, h("i", {style:{width: (done/qs.length*100)+"%"}})),
      h("span", {class:"cnt", text:String(qs.length)})));
  });
  const tb = $("tabbar"); tb.replaceChildren();
  NAV.forEach(n => tb.append(h("button", {"aria-current": String(state.view===n.id), onclick:() => go(n.id)}, h("span", {html:ic(n.icon)}), n.id==="mock" ? "Mock" : n.id==="bank" ? "Bank" : n.name)));
}
function setTrack(id){ state.track = id; store.set("track", id); pickNext(); }
$("sideSearch").addEventListener("input", debounce(e => { bankFilter.search = e.target.value; store.set("bankFilter", bankFilter); state.bankShown = 150; if (state.view !== "bank") state.view = "bank"; render(); const s = $("sideSearch"); s.focus(); }, 250));
$("navSettings").onclick = openSettings;
$("menuBtn").onclick = () => { const s = $("sidebar"); s.classList.add("open"); const sc = h("div", {class:"drawer-scrim", id:"drawerScrim", onclick: closeDrawer}); document.body.append(sc); };
function closeDrawer(){ $("sidebar").classList.remove("open"); const s = $("drawerScrim"); if (s) s.remove(); }
window.addEventListener("scroll", () => $("toolbar").classList.toggle("scrolled", window.scrollY > 30), {passive:true});
function debounce(fn, ms){ let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* ---------- Picking questions ---------- */
function pickNext(opts={}){
  const pool = filtered().filter(q => q.t === state.track);
  if (!pool.length){ state.current = null; return; }
  const cand = pool.filter(q => !state.current || q.id !== state.current.id);
  const list = cand.length ? cand : pool;
  const w = q => {
    const lv = levelOf(q.id);
    if (settings.order === "weak") return {redo:8, work:6, close:2, new:1, mastered:0.1}[lv];
    if (settings.order === "new") return lv === "new" ? 10 : 0.2;
    if (settings.order === "random") return 1;
    return {new:3, redo:4, work:3, close:1.5, mastered:0.3}[lv];
  };
  let r = Math.random() * list.reduce((s,q)=>s+w(q),0);
  for (const q of list){ r -= w(q); if (r <= 0) return showQuestion(q, opts); }
  showQuestion(list[list.length-1], opts);
}
function showQuestion(q, opts={}){
  if (mic.on) stopMic(false);
  state.current = q; state.report = null; state.ai = null; state.answer = "";
  timer.reset();
  if (opts.render !== false) render();
}

/* ---------- Grading ---------- */
let aiCtl = null;
function grade(){
  const q = state.current; if (!q) return;
  const ta = $("ans"); const answer = (ta ? ta.value : state.answer).trim();
  state.answer = answer;
  if (mic.on) stopMic(false);
  if (answer.split(/\s+/).length < 3){ setMicNote("Say or type an answer first, then tap Analyze."); ta && ta.focus(); return; }
  const secs = timer.el || null;
  const rep = Coach.analyze(q, answer, secs);
  state.report = rep; state.ai = null;
  record(q, rep.overall, rep);
  if (state.mock) state.mock.results[state.mock.i] = {q, score: rep.overall, verdict: rep.verdict};
  render();
  requestAnimationFrame(() => { const r = $("report"); r && r.scrollIntoView({behavior:"smooth", block:"start"}); });
  if (aiAvailable() && settings.aiMode === "auto") runAI();
}
async function runAI(){
  const q = state.current, rep = state.report; if (!q || !rep || state.aiBusy) return;
  state.aiBusy = true; state.aiErr = null; paintAI();
  aiCtl = new AbortController();
  try{
    const r = await callClaude(aiPrompt(q, state.answer, timer.el || null, rep), aiCtl.signal);
    if (state.current !== q) return;
    const s = Math.max(0, Math.min(10, Math.round(Number(r.score) || 0)));
    r.score = s;
    state.ai = r;
    const blended = Math.round(s*0.7 + rep.overall*0.3);
    rep.blended = blended;
    record(q, blended, rep, true);
    if (state.mock) state.mock.results[state.mock.i] = {q, score: blended, verdict: r.verdict};
  }catch(e){
    state.aiErr = ({cancelled:"Stopped.", no_ai:"", bad_key:"Your API key was rejected. Check it in Settings.", rate_limited:"Usage limit hit. Try again in a minute.", refusal:"Claude declined to grade this one.", not_granted:"Claude isn't enabled for this page.", sampling_disabled:"Claude isn't available on this account."})[e && e.code] ?? ("Claude review failed" + (e && e.message ? ": " + e.message : ". Check your connection."));
    if (e && e.name === "AbortError") state.aiErr = "Stopped.";
  }finally{ state.aiBusy = false; }
  if (state.view === "drill" || state.view === "mock") render();
}
function record(q, score, rep, replaceLast){
  if (q.followup) return;
  const p = progress[q.id] || {scores:[], q:q.q, t:q.t};
  if (replaceLast && p.scores.length) p.scores[p.scores.length-1] = score; else p.scores.push(score);
  p.scores = p.scores.slice(-10); p.last = Date.now();
  if (p.flag && !replaceLast) delete p.flag;   // a fresh attempt replaces a manual mark
  progress[q.id] = p; store.set("progress", progress);
  const entry = {id:q.id, t:q.t, topic:q.topic||trackName(q.t), ts:Date.now(), score, sub:rep.scores, words:rep.stats.words, wpm:rep.stats.wpm, fillers:rep.stats.fillers, hedges:rep.stats.hedges};
  if (replaceLast && history.length && history.at(-1).id === q.id) history[history.length-1] = entry; else history.push(entry);
  history = history.slice(-500); store.set("history", history);
  renderNav();
}
function setFlag(id, flag){
  const q = allQs().find(x => x.id === id);
  const p = progress[id] || {scores:[], q: q ? q.q : "", t: q ? q.t : ""};
  if (flag) p.flag = flag; else delete p.flag;
  progress[id] = p; store.set("progress", progress);
}

/* ---------- Views ---------- */
function render(){
  renderNav();
  if (typeof renderAccountRow === "function") renderAccountRow();
  const v = $("view"); v.replaceChildren();
  $("tbRight").replaceChildren();
  const views = {drill:viewDrill, mock:viewDrill, mastery:viewMastery, bank:viewBank, progress:viewProgress};
  (views[state.view] || viewDrill)(v);
  $("tbTitle").textContent = state.view === "drill" ? trackName(state.track) : (NAV.find(n=>n.id===state.view)||{}).name || "";
}

/* ----- Drill / Mock ----- */
function viewDrill(v){
  const isMock = state.view === "mock";
  const m = state.mock;
  if (isMock && m && m.done) return viewMockDone(v);
  if (!state.current && !isMock) pickNext({render:false, speak:false});
  const q = state.current;

  v.append(h("h1", {class:"largetitle", text: isMock ? "Mock interview" : trackName(state.track)}));
  v.append(h("p", {class:"subtitle", text: isMock ? `Question ${m.i+1} of ${m.qs.length}. Answer each one like it's the real thing.` : subtitleFor(state.track)}));

  if (!isMock){
    const strip = h("div", {class:"topics-strip", role:"group", "aria-label":"Topic"});
    TRACKS.forEach(t => { const n = filtered().filter(q=>q.t===t.id).length; if (n) strip.append(h("button", {"aria-pressed":String(t.id===state.track), onclick:() => { setTrack(t.id); render(); }, text:t.name})); });
    v.append(strip);
    const tb = $("tbRight");
    const ord = h("select", {class:"selectbtn", "aria-label":"Question order", onchange:e => { settings.order = e.target.value; saveSettings(); }},
      ...[["smart","Smart order"],["weak","Needs work first"],["new","New questions first"],["random","Random"]].map(([k,n]) => h("option", {value:k, selected: settings.order===k, text:n})));
    tb.append(ord);
  }
  if (!q){ v.append(h("div", {class:"card empty", text:"No questions match. Change the filters in Question bank."})); return; }

  /* question card */
  const card = h("section", {class:"card", "aria-labelledby":"qText"});
  if (isMock){ const bar = h("div", {class:"mockbar"}); m.qs.forEach((_,i) => bar.append(h("i", {class: i < m.i ? "done" : i === m.i ? "cur" : ""}))); card.append(bar); }
  const lv = levelOf(q.id), p = progress[q.id];
  const meta = h("div", {class:"qmeta"},
    h("span", {class:"tag accent", text: q.topic || trackName(q.t)}),
    q.l ? h("span", {class:"tag", text:q.l}) : null,
    q.section ? h("span", {class:"tag", text:q.section}) : null,
    firmTag(q) ? h("span", {class:"tag firm", text: firmTag(q)}) : null,
    h("span", {class:"tag", style:{color:`var(--${LV[lv].color})`}, text: p && p.scores.length ? `${LV[lv].name} · best ${Math.max(...p.scores)}/10` : LV[lv].name}));
  card.append(meta, h("h2", {class:"qtext", id:"qText", text:q.q}));
  const hintBox = h("div", {class:"hint", hidden:true});
  card.append(h("div", {class:"row"},
    h("button", {class:"btn tint", disabled: !(q.k && q.k.length), onclick:() => { hintBox.hidden = !hintBox.hidden; }, html: ic("bulb") + "Hint"}),
    h("button", {class:"btn tint", onclick:() => isMock ? mockAdvance() : pickNext(), html: ic("forward") + (isMock ? "Skip" : "Next")})));
  const pts = Coach.keyPoints(q);
  hintBox.append(h("span", {html:ic("bulb")}), h("div", null, h("b", {text:"Structure to hit: "}), pts.map(p => p.label).join("  →  ")));
  card.append(hintBox);
  v.append(card);

  /* recorder */
  const rc = h("section", {class:"card", "aria-label":"Your answer"});
  const wave = h("div", {class:"wave", id:"wave"}); for (let i=0;i<18;i++) wave.append(h("i"));
  const ta = h("textarea", {class:"ans", id:"ans", placeholder:"Tap the red button and answer out loud. Your words appear here, and you can edit them or type instead.", "aria-label":"Your answer"});
  ta.value = state.answer;
  ta.addEventListener("input", () => { state.answer = ta.value; updateWC(); if (!timer.id && !mic.on && ta.value.length === 1) timer.start(); });
  ta.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter"){ e.preventDefault(); grade(); } });
  const tgt = q.s <= 45 ? "30–45 sec" : q.s <= 60 ? "45–60 sec" : q.s <= 90 ? "60–90 sec" : "90 sec–2 min";
  rc.append(h("div", {class:"rec"},
    h("div", {class:"recside"},
      h("button", {class:"recbtn", id:"recBtn", "aria-label":"Start recording", onclick:() => mic.on ? stopMic() : startMic()}),
      h("div", {class:"clock", id:"clock", text:"0:00"}),
      wave,
      h("div", {class:"reclabel", id:"recLabel", text:"Tap to answer out loud"})),
    h("div", {style:{minWidth:0}},
      ta,
      h("div", {class:"tafoot"}, h("span", {id:"wc", text:"0 words"}), h("span", {text:"Target " + tgt + " · ⌘/Ctrl+Enter to analyze"})),
      h("div", {class:"row"},
        h("button", {class:"btn fill lg", onclick: grade, html: ic("wand") + "Analyze answer"}),
        h("button", {class:"btn plain", onclick:() => { state.answer = ""; ta.value = ""; updateWC(); timer.reset(); state.report = null; state.ai = null; render(); }, text:"Clear"})),
      h("div", {class:"note", id:"micNote", hidden:true}))));
  v.append(rc);
  if (!SR) setTimeout(() => setMicNote("This browser can't transcribe from the page. " + DICTATE));
  updateWC(); timer.paint();

  if (state.report) v.append(viewReport(q, state.report));
}
function subtitleFor(t){
  return {acct:"The three statements, how they link, and what changes when one line moves.", beh:"Your story, why banking, and STAR answers that prove it.", val:"DCF, multiples, EV vs. equity value, WACC.", deal:"Merger models, accretion/dilution, LBOs.", mkt:"Markets, rates, pitches and mental math.", sector:"Industry groups and product knowledge.", mine:"Questions from your own material."}[t] || "";
}

/* ----- Report ----- */
function ringSVG(vals){
  const R = [66, 50, 34], W = 13, C = r => 2*Math.PI*r;
  const cols = ["var(--ring1)","var(--ring2)","var(--ring3)"];
  let s = `<svg viewBox="0 0 150 150" aria-hidden="true">`;
  vals.forEach((v,i) => {
    const r = R[i], c = C(r), off = c * (1 - Math.max(0.02, v/10));
    s += `<circle cx="75" cy="75" r="${r}" stroke="${cols[i]}" stroke-opacity=".2" stroke-width="${W}"/>`;
    s += `<circle cx="75" cy="75" r="${r}" stroke="${cols[i]}" stroke-width="${W}" stroke-dasharray="${c}" stroke-dashoffset="${c}" style="transition:stroke-dashoffset .9s cubic-bezier(.3,.7,.4,1) ${i*.12}s" data-off="${off}"/>`;
  });
  return s + "</svg>";
}
function band(s){ return s >= 8 ? "g" : s >= 6 ? "w" : "b"; }
function viewReport(q, rep){
  const ai = state.ai;
  const wrap = h("div", {id:"report", class:"fade-in"});
  const score = rep.blended ?? rep.overall;
  const sc = rep.scores;
  const structureRing = Math.round((sc.structure + sc.concision)/2);
  const contentRing = sc.accuracy == null ? sc.content : Math.round(sc.content*0.7 + sc.accuracy*0.3);

  /* summary */
  const rings = h("div", {class:"rings", html: ringSVG([contentRing, structureRing, sc.delivery])},
    h("div", {class:"big"}, h("div", null, h("b", {text:String(score)}), h("small", {text:"OUT OF 10"}))));
  setTimeout(() => rings.querySelectorAll("circle[data-off]").forEach(c => c.style.strokeDashoffset = c.dataset.off), 30);
  const lv = levelOf(q.id);
  const sum = h("section", {class:"card"},
    h("div", {class:"summary"}, rings,
      h("div", {style:{minWidth:0}},
        h("div", {class:"row", style:{gap:"6px"}},
          h("span", {class:`score-chip sc-${band(score)}`, text: score >= 8 ? "Interview-ready" : score >= 6 ? "Close" : "Needs work"}),
          h("span", {class:"tag", style:{color:`var(--${LV[lv].color})`}, text: LV[lv].name}),
          ai ? h("span", {class:"ai-badge", html: ic("sparkles") + "Claude reviewed"}) : null),
        h("p", {class:"verdict", text: ai ? ai.verdict : rep.verdict}),
        h("div", {class:"legend"},
          h("span", null, h("i", {style:{background:"var(--ring1)"}}), "Content ", h("b", {text: contentRing + "/10"})),
          h("span", null, h("i", {style:{background:"var(--ring2)"}}), "Structure ", h("b", {text: structureRing + "/10"})),
          h("span", null, h("i", {style:{background:"var(--ring3)"}}), "Delivery ", h("b", {text: sc.delivery + "/10"})),
          sc.accuracy != null ? h("span", {class:"t-gray"}, "Accuracy ", h("b", {text: sc.accuracy + "/10"})) : null))),
    metricsRow(rep));
  wrap.append(sum);

  /* next try: the three changes that would move the score most */
  if (rep.plan && rep.plan.length && score < 9){
    wrap.append(h("section", {class:"card", "aria-label":"Your next try"},
      h("b", {text:"Your next try"}),
      h("ol", {style:{margin:"8px 0 0", paddingLeft:"20px", lineHeight:"1.6"}}, rep.plan.map(p => h("li", {text:p.title})))));
  }

  /* AI layer */
  const aiBox = h("div", {id:"aiBox"}); wrap.append(aiBox); paintAI(aiBox);

  /* corrections */
  const corr = ai && ai.corrections && ai.corrections.length ? ai.corrections : rep.corrections;
  if (corr.length){
    wrap.append(h("h3", {class:"sechead"}, "What you got wrong"));
    const saidFor = c => (corr === rep.corrections && rep.said && rep.said[c]) ? rep.said[c] : null;
    wrap.append(h("div", {class:"list"}, corr.map(c => h("div", {class:"li"}, h("span", {class:"lic c-red", html:ic("xmark")}),
      h("div", {class:"lit"}, saidFor(c) ? h("span", {text:`You said: “${saidFor(c)}”`}) : null, h("b", {text:c}))))));
  }

  /* top fixes */
  const fixes = rep.fixes.filter(f => f.tag !== "Accuracy");
  if (fixes.length){
    wrap.append(h("h3", {class:"sechead"}, "How to improve ", h("small", {text: fixes.length + " fixes, most important first"})));
    const sevCol = s => s >= 4 ? "c-red" : s === 3 ? "c-orange" : s === 2 ? "c-yellow" : "c-gray";
    const tagIcon = {Content:"list", Structure:"text", Story:"person", Concision:"scissors", Delivery:"bubble", Wording:"quote"};
    wrap.append(h("div", {class:"list"}, fixes.slice(0, 8).map(f => h("div", {class:"li"},
      h("span", {class:"lic " + sevCol(f.sev), html: ic(tagIcon[f.tag] || "warn")}),
      h("div", {class:"lit"}, h("b", {text:f.title}), h("span", {style:{whiteSpace:"pre-line"}, text:f.body})),
      h("span", {class:"trail", text:f.tag})))));
  }

  /* key points */
  if (rep.coverage.length){
    const hit = rep.coverage.filter(p => p.status === "hit").length;
    wrap.append(h("h3", {class:"sechead"}, "Key points ", h("small", {text:`${hit} of ${rep.coverage.length} covered`})));
    const icons = {hit:["check","t-green","Covered"], partial:["half","t-orange","Partly covered"], miss:["xmark","t-red","Missed"]};
    wrap.append(h("div", {class:"list noicon pts"}, rep.coverage.map(p => { const [i,c,lbl] = icons[p.status];
      return h("div", {class:"li"}, h("span", {class:"status "+c, title:lbl, html: ic(i, "status")}), h("div", {class:"lit"}, h("b", {text:p.text}), p.status !== "hit" ? h("span", {text: missingText(p)}) : null)); })));
  }

  /* strengths */
  const good = ai && ai.got_right && ai.got_right.length ? ai.got_right : rep.strengths;
  if (good.length){
    wrap.append(h("h3", {class:"sechead"}, "What you did well"));
    wrap.append(h("div", {class:"list"}, good.map(s => h("div", {class:"li"}, h("span", {class:"lic c-green", html:ic("thumbs")}), h("div", {class:"lit"}, h("b", {style:{fontWeight:500}, text:s}))))));
  }

  /* STAR */
  if (rep.star){
    const s = rep.star;
    const parts = [["S","Situation",s.situation],["T","Task",s.task],["A","Action",s.action>=2],["R","Result",s.result],["L","Lesson",s.lesson]];
    wrap.append(h("h3", {class:"sechead"}, "Story structure"));
    wrap.append(h("section", {class:"card"}, h("div", {class:"star"}, parts.map(([k,n,on]) => h("div", {class: on ? "on" : ""}, h("b", {text:k}), n)))));
  }

  /* transcript */
  wrap.append(h("h3", {class:"sechead"}, "Your transcript"));
  const tr = h("div", {class:"transcript"});
  const marks = Coach.highlights(state.answer, rep); let pos = 0;
  marks.forEach(mk => { if (mk.i > pos) tr.append(state.answer.slice(pos, mk.i)); tr.append(h("mark", {class:mk.kind, title:mk.tip, tabindex:"0"}, state.answer.slice(mk.i, mk.j))); pos = mk.j; });
  tr.append(state.answer.slice(pos));
  wrap.append(h("section", {class:"card"}, tr, h("div", {class:"keys"},
    h("span", null, h("i", {style:{background:"color-mix(in srgb,var(--orange) 30%,transparent)"}}), `Filler (${rep.stats.fillers})`),
    h("span", null, h("i", {style:{background:"color-mix(in srgb,var(--purple) 30%,transparent)"}}), `Hedge (${rep.stats.hedges})`),
    h("span", null, h("i", {style:{background:"color-mix(in srgb,var(--blue) 25%,transparent)"}}), "Word choice"),
    h("span", null, h("i", {style:{background:"color-mix(in srgb,var(--gray) 30%,transparent)"}}), "Tangent"),
    SR ? h("span", {text:"Chrome's transcription may drop “um” and “uh”."}) : null)));

  /* wording */
  const words = ai && ai.wording && ai.wording.length ? ai.wording.map(w => ({said:w.said, to:w.better, why:w.why})) : rep.wording.map(w => ({said:w.said + (w.n > 1 ? `  ×${w.n}` : ""), to:w.to, why:w.why}));
  if (words.length){
    wrap.append(h("h3", {class:"sechead"}, "Wording"));
    wrap.append(h("div", {class:"list noicon"}, words.map(w => h("div", {class:"li"}, h("div", {class:"lit"},
      h("div", {class:"wordrow"}, h("span", {class:"said", text:w.said}), h("span", {class:"t-gray", text:"→"}), h("span", {class:"try", text:w.to})),
      h("div", {class:"why", text:w.why}))))));
  }

  /* rewrites */
  const improved = ai ? ai.improved_version : rep.tightened;
  wrap.append(h("h3", {class:"sechead"}, ai ? "Your answer at a 9/10" : "Your answer, tightened", h("small", {text: ai ? "Your facts, rewritten" : "Fillers and hedges removed"})));
  wrap.append(h("section", {class:"card"}, h("div", {class:"quote", text: improved}), h("div", {class:"row", style:{marginTop:"10px"}},
    h("button", {class:"btn tint", onclick:e => copyText(improved, e.currentTarget), html: ic("copy") + "Copy"}))));
  const model = ai ? ai.model_answer : rep.model;
  if (q.answer && q.answer.length){
    wrap.append(h("h3", {class:"sechead"}, "Guide answer", h("small", {text: q.ref ? `${BIWS_GUIDES[q.ref.guide] || "Guide"}, page ${q.ref.page}` : ""})));
    wrap.append(h("section", {class:"card"}, ...q.answer.map(p => h("p", {class:"quote", style:{margin:"0 0 10px"}, text:p}))));
  }
  if (model && !(q.answer && q.answer.length && !ai)){
    wrap.append(h("h3", {class:"sechead"}, rep.beh && !ai ? "What a strong answer includes" : "Model answer"));
    wrap.append(h("section", {class:"card"}, h("div", {class:"quote", text:model})));
  }
  if (q.study){
    const more = h("div", {hidden:true}, h("p", {class:"quote", style:{whiteSpace:"pre-wrap", margin:"10px 0 0"}, text:q.study.excerpt + (q.study.excerpt.length >= 700 ? "…" : "")}));
    wrap.append(h("h3", {class:"sechead"}, "Study it", h("small", {text:"Where the guide teaches this"})));
    wrap.append(h("section", {class:"card"},
      h("div", null, h("b", {text:`${BIWS_GUIDES[q.study.guide] || "Guide"}, page ${q.study.page}`}), q.study.title ? h("span", {class:"t-gray", text:" · " + q.study.title}) : null),
      h("div", {class:"row", style:{marginTop:"8px"}}, h("button", {class:"btn tint", onclick:e => { more.hidden = !more.hidden; e.currentTarget.textContent = more.hidden ? "Show the page" : "Hide the page"; }, text:"Show the page"})),
      more));
  }

  /* mastery override + actions */
  const seg = h("div", {class:"seg", role:"group", "aria-label":"Mark this question"});
  [["mastered","Mastered"],["work","Needs work"],["redo","Really needs work"]].forEach(([k,n]) => seg.append(h("button", {"aria-pressed": String((progress[q.id]||{}).flag === k), onclick:() => { setFlag(q.id, (progress[q.id]||{}).flag === k ? null : k); render(); }, text:n})));
  wrap.append(h("h3", {class:"sechead"}, "Mark this question ", h("small", {text:"Overrides the automatic level"})));
  wrap.append(h("div", {style:{marginBottom:"18px", overflowX:"auto"}}, seg));
  const act = h("div", {class:"row"});
  act.append(h("button", {class:"btn lg tint", onclick:() => { state.answer = ""; state.report = null; state.ai = null; timer.reset(); render(); window.scrollTo({top:0, behavior:"smooth"}); }, html: ic("retry") + "Try again"}));
  if (ai && ai.follow_up && state.view === "drill"){
    const parent = q;
    act.append(h("button", {class:"btn lg tint", onclick:() => { showQuestion({id:"fu-"+Date.now(), t:parent.t, l:"Follow-up", topic:parent.topic, s:60, q:ai.follow_up, k:ai.follow_up_keys||[], followup:true}); window.scrollTo({top:0, behavior:"smooth"}); }, html: ic("bubble") + "Answer the follow-up"}));
  }
  act.append(h("button", {class:"btn lg fill", onclick:() => { state.view === "mock" ? mockAdvance() : pickNext(); window.scrollTo({top:0, behavior:"smooth"}); }, html: ic("forward") + (state.view === "mock" ? (state.mock.i >= state.mock.qs.length-1 ? "Finish interview" : "Next question") : "Next question")}));
  wrap.append(act);
  return wrap;
}
const TERM = {da:"D&A", ppe:"PP&E", ar:"accounts receivable", ap:"accounts payable", accrued:"accrued expenses", deferredrevenue:"deferred revenue", dtl:"deferred tax liability", dta:"deferred tax asset", nol:"NOLs", netincome:"net income", incomestatement:"income statement", balancesheet:"balance sheet", cfs:"cash flow statement", cfo:"cash flow from operations", cfi:"cash flow from investing", cff:"cash flow from financing", shequity:"shareholders' equity", retainedearnings:"retained earnings", apic:"APIC", treasury:"treasury stock", sbc:"stock-based comp", capex:"CapEx", nwc:"working capital", cogs:"COGS", sga:"SG&A", ebitda:"EBITDA", ebit:"EBIT / operating income", ev:"enterprise value", equityvalue:"equity value", wacc:"WACC", costequity:"cost of equity", costdebt:"cost of debt", capm:"CAPM", erp:"equity risk premium", riskfree:"risk-free rate", fcf:"free cash flow", terminalvalue:"terminal value", gordon:"perpetuity growth", exitmultiple:"exit multiple", dcf:"DCF", lbo:"LBO", irr:"IRR", moic:"MoIC", mna:"M&A", pe:"P/E", eps:"EPS", nopat:"NOPAT", comps:"comparable companies", precedents:"precedent transactions", sourcesuses:"sources & uses", nci:"noncontrolling interest", preferred:"preferred stock", goodwill:"goodwill", intangibles:"intangibles", interestexpense:"interest expense", dividend:"dividends", revolver:"revolver", synergy:"synergies", accretive:"accretion", dilutive:"dilution", pretax:"pre-tax income"};
function missingText(p){
  if (p.missWords && p.missWords.length) return "Missing: " + p.missWords.slice(0,5).join(", ");
  const terms = p.miss.filter(t => TERM[t] || /^\d/.test(t)).map(t => TERM[t] || t);
  return terms.length ? "Missing: " + [...new Set(terms)].slice(0,5).join(", ") : "Add the specifics from this point.";
}
function metricsRow(rep){
  const s = rep.stats;
  const lo = Math.round(s.targetWords*0.45), hi = Math.round(s.targetWords*1.1), max = Math.max(hi*1.6, s.words*1.05);
  const lenTile = h("div", {class:"metric"},
    h("div", {class:"k t-teal", html: ic("text") + "Length"}),
    h("div", {class:"v"}, String(s.words), h("small", {text:"words"})),
    h("div", {class:"lengthbar"}, h("div", {class:"ok", style:{left:(lo/max*100)+"%", width:((hi-lo)/max*100)+"%"}}), h("div", {class:"dot", style:{left: Math.min(100, s.words/max*100)+"%"}})),
    h("div", {class:"s", text:`Aim ${lo}–${hi}`}));
  return h("div", {class:"metrics"},
    lenTile,
    h("div", {class:"metric"}, h("div", {class:"k t-orange", html: ic("bubble") + "Fillers"}), h("div", {class:"v"}, String(s.fillers)), h("div", {class:"s", text: s.fillerRate + " per 100 words"})),
    h("div", {class:"metric"}, h("div", {class:"k t-purple", html: ic("gauge") + "Hedges"}), h("div", {class:"v"}, String(s.hedges)), h("div", {class:"s", text: s.hedges ? "State facts directly" : "Confident"})),
    h("div", {class:"metric"}, h("div", {class:"k t-blue", html: ic("stopwatch") + "Pace"}), h("div", {class:"v"}, s.wpm ? String(s.wpm) : "–", h("small", {text: s.wpm ? "wpm" : ""})), h("div", {class:"s", text: s.wpm ? (s.wpm > 185 ? "Too fast" : s.wpm < 105 ? "Too slow" : "Aim 130–165") : "Use the mic to time it"})));
}
function paintAI(box){
  box = box || $("aiBox"); if (!box) return;
  box.replaceChildren();
  if (state.aiBusy){
    box.append(h("section", {class:"card"}, h("div", {class:"thinking"}, h("span", {class:"spinner"}), h("span", {text:"Claude is reviewing your answer like an interviewer…"}), h("button", {class:"btn plain", style:{marginLeft:"auto"}, onclick:() => aiCtl && aiCtl.abort(), text:"Stop"}))));
    return;
  }
  const ai = state.ai;
  if (ai){
    const extra = [];
    if (ai.missed && ai.missed.length) extra.push(["xmark","c-red","What you missed", ai.missed.join(" · ")]);
    if (ai.rambling) extra.push(["scissors","c-teal","What to cut", ai.rambling]);
    if (ai.structure) extra.push(["text","c-green","Structure", ai.structure]);
    if (extra.length){
      box.append(h("h3", {class:"sechead"}, "Interviewer notes ", h("span", {class:"ai-badge", html: ic("sparkles") + "Claude · " + ai.score + "/10"})));
      box.append(h("div", {class:"list"}, extra.map(([i,c,t,b]) => h("div", {class:"li"}, h("span", {class:"lic "+c, html:ic(i)}), h("div", {class:"lit"}, h("b", {text:t}), h("span", {text:b}))))));
    }
    return;
  }
  if (state.aiErr) box.append(h("p", {class:"err", text: state.aiErr}));
  if (aiAvailable() && settings.aiMode !== "auto")
    box.append(h("div", {class:"row", style:{margin:"0 0 16px"}}, h("button", {class:"btn tint", onclick: runAI, html: ic("sparkles") + "Get Claude's interviewer review"})));
  else if (!aiAvailable())
    box.append(h("p", {class:"note", style:{margin:"0 0 16px"}}, "Graded on this device by the built-in coach. For a deeper review with a rewritten answer and follow-up questions, add a Claude API key in ", h("a", {href:"#", onclick:e => { e.preventDefault(); openSettings(); }, text:"Settings"}), "."));
}
function copyText(t, btn){
  const done = () => { const o = btn.innerHTML; btn.textContent = "Copied"; setTimeout(() => btn.innerHTML = o, 1200); };
  try{ navigator.clipboard.writeText(t).then(done, () => {}); }catch{}
}

/* ----- Mock ----- */
function shuffle(a){ a = a.slice(); for (let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
function startMock(){
  const pool = filtered();
  const take = (t,n) => shuffle(pool.filter(q=>q.t===t)).slice(0,n);
  let qs = [...take("beh",1), ...take("acct",2), ...take("val",1), ...take("deal",1), ...take("beh",1)];
  const intro = BANK.find(q => q.id === "b1");
  if (intro && (bankFilter.source === "original" || bankFilter.source === "all")) qs.unshift(intro);
  qs = qs.filter((q,i,a) => q && a.findIndex(x => x.id === q.id) === i).slice(0,7);
  if (qs.length < 2) qs = shuffle(pool).slice(0,6);
  state.mock = {qs, i:0, results:[], done:false};
  state.current = null;
  showQuestion(qs[0], {render:false});
}
function mockAdvance(){
  const m = state.mock;
  if (m.i < m.qs.length-1){ m.i++; showQuestion(m.qs[m.i]); window.scrollTo({top:0}); return; }
  m.done = true; if (mic.on) stopMic(false); render();
  const res = m.results.filter(Boolean);
}
function viewMockDone(v){
  const m = state.mock, res = m.results.filter(Boolean);
  const a = res.length ? res.reduce((s,r)=>s+r.score,0)/res.length : null;
  v.append(h("h1", {class:"largetitle", text:"Interview complete"}));
  v.append(h("p", {class:"subtitle", text: a === null ? "You skipped every question. Answer at least one to get a result." : `${res.filter(r=>r.score>=7).length} of ${res.length} answers were at the bar.`}));
  const s = a === null ? 0 : Math.round(a);
  const rings = h("div", {class:"rings", html: ringSVG([s, res.length/m.qs.length*10, res.filter(r=>r.score>=7).length/Math.max(1,res.length)*10])}, h("div", {class:"big"}, h("div", null, h("b", {text: a === null ? "–" : a.toFixed(1)}), h("small", {text:"AVERAGE"}))));
  setTimeout(() => rings.querySelectorAll("circle[data-off]").forEach(c => c.style.strokeDashoffset = c.dataset.off), 30);
  v.append(h("section", {class:"card"}, h("div", {class:"summary"}, rings, h("div", null,
    h("p", {class:"verdict", text: a === null ? "No grades yet." : s >= 8 ? "Strong interview. You'd likely advance." : s >= 6 ? "Borderline. Tighten the weak answers below." : "Not there yet. Drill the red ones and run it again."}),
    h("div", {class:"legend"}, h("span", null, h("i", {style:{background:"var(--ring1)"}}), "Average score"), h("span", null, h("i", {style:{background:"var(--ring2)"}}), "Answered"), h("span", null, h("i", {style:{background:"var(--ring3)"}}), "At the bar"))))));
  v.append(h("div", {class:"list"}, m.qs.map((q,i) => { const r = m.results[i];
    return h("button", {class:"li qrow", onclick:() => { state.track = q.t; state.view = "drill"; showQuestion(q); }},
      h("span", {class:"lic " + (r ? (r.score >= 7 ? "c-green" : r.score >= 5 ? "c-orange" : "c-red") : "c-gray"), html: ic(r ? (r.score >= 7 ? "check" : "warn") : "forward")}),
      h("div", {class:"lit"}, h("b", {text:q.q}), h("span", {text: r ? r.verdict : "Skipped"})),
      h("span", {class:"trail"}, r ? h("span", {class:`score-chip sc-${band(r.score)}`, text: r.score + "/10"}) : null, chevEl())); })));
  v.append(h("div", {class:"row"}, h("button", {class:"btn lg fill", onclick:() => { startMock(); render(); }, html: ic("retry") + "Run another mock"}), h("button", {class:"btn lg tint", onclick:() => { state.mock = null; go("drill"); }, text:"Back to drills"})));
}

/* ----- Mastery ----- */
let masteryOpen = null, masteryLevel = "all";
function viewMastery(v){
  const pool = filtered();
  const c = mix(pool), tried = pool.length - c.new;
  v.append(h("h1", {class:"largetitle", text:"Mastery"}));
  v.append(h("p", {class:"subtitle", text:"Where you stand on every concept. Levels update after each answer; you can also mark them yourself."}));

  /* overall */
  const tiles = h("div", {class:"tiles"});
  LEVELS.forEach(l => tiles.append(h("button", {class:"tile", style:{border:0, textAlign:"left", cursor:"pointer", outline: masteryLevel===l.id ? `2px solid var(--${l.color})` : "none"}, onclick:() => { masteryLevel = masteryLevel === l.id ? "all" : l.id; render(); }},
    h("div", {class:"k", style:{color:`var(--${l.color})`}, html: ic(l.id==="mastered"?"check":l.id==="close"?"half":l.id==="new"?"list":"warn") + l.name}),
    h("div", {class:"v", text:String(c[l.id])}),
    h("div", {class:"s", text: pool.length ? Math.round(c[l.id]/pool.length*100) + "% of questions" : ""}))));
  v.append(tiles);

  /* skills */
  v.append(h("h3", {class:"sechead"}, "Interview skills ", h("small", {text:"From your last 20 answers"})));
  const sk = skillStats();
  v.append(h("div", {class:"list"}, sk.map(s => h("div", {class:"li"},
    h("span", {class:"lic c-"+s.color, html:ic(s.icon)}),
    h("div", {class:"lit"}, h("b", {text:s.name}), h("span", {text:s.tip}),
      s.avg !== null ? h("div", {class:"bar"}, h("i", {style:{width:(s.avg*10)+"%", background:`var(--${LV[s.lvl].color})`}})) : null),
    h("span", {class:"trail"}, h("span", {style:{color:`var(--${LV[s.lvl].color})`, fontWeight:600}, text: s.avg === null ? "Not started" : LV[s.lvl].name}), s.avg !== null ? h("span", {text: s.avg.toFixed(1)}) : null)))));

  /* concepts (topics) */
  v.append(h("h3", {class:"sechead"}, "Concepts ", h("small", {text: tried ? `${tried} of ${pool.length} questions attempted` : "Answer questions to start tracking"})));
  const groups = {};
  pool.forEach(q => { const k = q.topic || trackName(q.t); (groups[k] = groups[k] || []).push(q); });
  const order = ["redo","work","close","new","mastered"];
  const rows = Object.entries(groups).map(([name, qs]) => ({name, qs, c: mix(qs), lvl: topicLevel(mix(qs))}))
    .filter(r => masteryLevel === "all" || r.c[masteryLevel] > 0)
    .sort((a,b) => order.indexOf(a.lvl) - order.indexOf(b.lvl) || b.qs.length - a.qs.length);
  const list = h("div", {class:"list"});
  rows.forEach(r => {
    const open = masteryOpen === r.name;
    const t = r.qs[0].t; const [icon, col] = TRACK_STYLE[t] || ["list","c-gray"];
    list.append(h("button", {class:"li", "aria-expanded": String(open), onclick:() => { masteryOpen = open ? null : r.name; render(); }},
      h("span", {class:"lic "+col, html:ic(icon)}),
      h("div", {class:"lit"}, h("b", {text:r.name}),
        h("span", {text: `${r.c.mastered} mastered · ${r.c.close} close · ${r.c.work + r.c.redo} need work · ${r.c.new} new`}),
        mixBar(r.c, r.qs.length)),
      h("span", {class:"trail"}, h("span", {style:{color:`var(--${LV[r.lvl].color})`, fontWeight:600}, text: LV[r.lvl].name}), chevEl())));
    if (open){
      const qs = r.qs.filter(q => masteryLevel === "all" || levelOf(q.id) === masteryLevel)
        .sort((a,b) => order.indexOf(levelOf(a.id)) - order.indexOf(levelOf(b.id))).slice(0, 60);
      qs.forEach(q => list.append(questionRow(q, true)));
      list.append(h("div", {class:"li"}, h("div", {class:"lit"}), h("button", {class:"btn tint", onclick:() => { drillConcept(r.name, r.qs); }, html: ic("mic") + "Drill this concept"})));
    }
  });
  if (!rows.length) list.append(h("div", {class:"empty", text:"Nothing at this level yet."}));
  v.append(list);
}
function drillConcept(name, qs){
  const vine = qs.some(q => q.source === "vine" || q.source === "biws");
  if (vine && qs[0].topic){ bankFilter.topic = qs[0].topic; store.set("bankFilter", bankFilter); }
  state.track = qs[0].t; store.set("track", state.track);
  settings.order = "weak"; saveSettings();
  state.view = "drill"; pickNext(); render();
}
function questionRow(q, withFlag){
  const lv = levelOf(q.id), p = progress[q.id];
  const last = p && p.scores.length ? p.scores.at(-1) : null;
  const row = h("div", {class:"li qrow"},
    h("span", {class:"status", style:{color:`var(--${LV[lv].color})`}, title: LV[lv].name, html: ic(lv==="mastered"?"check":lv==="close"?"half":lv==="new"?"list":"warn", "status")}),
    h("button", {class:"lit", style:{all:"unset", cursor:"pointer", flex:1, minWidth:0}, onclick:() => { state.track = q.t; store.set("track", q.t); state.view = "drill"; showQuestion(q); window.scrollTo({top:0}); }},
      h("b", {style:{display:"block", fontWeight:500, fontSize:"15px"}, text:q.q}),
      h("span", {style:{display:"block", fontSize:"13px", color:"var(--label2)"}, text: [q.topic || trackName(q.t), q.l, firmTag(q)].filter(Boolean).join(" · ")})),
    h("span", {class:"trail"}, last !== null ? h("span", {class:`score-chip sc-${band(last)}`, text: last + "/10"}) : null,
      withFlag ? flagMenu(q) : chevEl()));
  return row;
}
function flagMenu(q){
  const cur = (progress[q.id]||{}).flag || "";
  const s = h("select", {class:"selectbtn", "aria-label":"Set level", onchange:e => { setFlag(q.id, e.target.value || null); render(); }},
    h("option", {value:"", text:"Auto"}), ...["mastered","close","work","redo"].map(k => h("option", {value:k, selected: cur===k, text:LV[k].name})));
  s.addEventListener("click", e => e.stopPropagation());
  return s;
}

/* ----- Bank ----- */
function viewBank(v){
  v.append(h("h1", {class:"largetitle", text:"Question bank"}));
  const pool = filtered();
  v.append(h("p", {class:"subtitle", text:`${pool.length.toLocaleString()} questions · ${pool.filter(q=>progress[q.id]).length} attempted`}));
  const f = h("div", {class:"filters"});
  if (HAS_VINE || HAS_BIWS){
    const seg = h("div", {class:"seg", role:"group", "aria-label":"Source"});
    [HAS_VINE && ["vine","IB Vine"], HAS_BIWS && ["biws","BIWS guides"], ["original","Core drills"], ["all","All"]].filter(Boolean).forEach(([k,n]) => seg.append(h("button", {"aria-pressed":String(bankFilter.source===k), onclick:() => { bankFilter.source = k; bankFilter.topic = ""; bankFilter.level = ""; applyFilters(); }, text:n})));
    f.append(seg);
  }
  const topics = [...new Set(allQs().filter(sourceOk).map(q => q.topic).filter(Boolean))].sort();
  if (topics.length) f.append(h("select", {class:"selectbtn", "aria-label":"Topic", onchange:e => { bankFilter.topic = e.target.value; applyFilters(); }}, h("option", {value:"", text:"All topics"}), ...topics.map(t => h("option", {value:t, selected: bankFilter.topic===t, text:t}))));
  const levels = [...new Set(allQs().map(q => q.l).filter(Boolean))];
  f.append(h("select", {class:"selectbtn", "aria-label":"Difficulty", onchange:e => { bankFilter.level = e.target.value; applyFilters(); }}, h("option", {value:"", text:"All levels"}), ...levels.map(l => h("option", {value:l, selected: bankFilter.level===l, text:l}))));
  if (bankFilter.search) f.append(h("button", {class:"btn plain", onclick:() => { bankFilter.search = ""; $("sideSearch").value = ""; applyFilters(); }, html: ic("close") + `“${bankFilter.search}”`}));
  v.append(f);
  const list = h("div", {class:"list"});
  pool.slice(0, state.bankShown).forEach(q => list.append(questionRow(q, true)));
  if (!pool.length) list.append(h("div", {class:"empty", text:"No questions match these filters."}));
  v.append(list);
  if (pool.length > state.bankShown) v.append(h("div", {class:"row", style:{justifyContent:"center"}}, h("button", {class:"btn tint", onclick:() => { state.bankShown += 300; render(); }, text:`Show more (${(pool.length - state.bankShown).toLocaleString()} left)`})));
}
function applyFilters(){
  store.set("bankFilter", bankFilter); state.bankShown = 150;
  const pool = filtered(); if (!pool.some(q => q.t === state.track)) state.track = (pool[0]||{}).t || "acct";
  state.current = null; render();
}

/* ----- Progress ----- */
function viewProgress(v){
  v.append(h("h1", {class:"largetitle", text:"Progress"}));
  v.append(h("p", {class:"subtitle", text:"Your scores and habits over time."}));
  const n = history.length;
  const last20 = history.slice(-20);
  const avg = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
  const avgScore = avg(last20.map(x=>x.score));
  const prev20 = history.slice(-40,-20); const prevAvg = avg(prev20.map(x=>x.score));
  const days = [...new Set(history.map(x => new Date(x.ts).toDateString()))];
  let streak = 0; { const d = new Date(); for (;;){ if (days.includes(d.toDateString())){ streak++; d.setDate(d.getDate()-1); } else if (streak === 0 && d.toDateString() === new Date().toDateString()){ d.setDate(d.getDate()-1); } else break; } }
  const fill = avg(last20.filter(x=>x.words).map(x => x.fillers / x.words * 100));
  v.append(h("div", {class:"tiles"},
    tile("t-blue","chart","Answers graded", String(n), "all time"),
    tile("t-pink","star","Average score", avgScore === null ? "–" : avgScore.toFixed(1), prevAvg !== null && avgScore !== null ? `${avgScore >= prevAvg ? "▲" : "▼"} ${Math.abs(avgScore-prevAvg).toFixed(1)} vs previous 20` : "last 20 answers"),
    tile("t-orange","flame","Streak", String(streak), streak === 1 ? "day" : "days"),
    tile("t-purple","bubble","Fillers", fill === null ? "–" : fill.toFixed(1), "per 100 words")));
  if (n >= 2){
    const pts = history.slice(-40).map(x => x.score);
    const W = 600, H = 60, step = W / Math.max(1, pts.length-1);
    const d = pts.map((s,i) => `${i?"L":"M"}${(i*step).toFixed(1)},${(H - 4 - s/10*(H-8)).toFixed(1)}`).join("");
    v.append(h("section", {class:"card"}, h("div", {class:"chead"}, h("span", {class:"lbl t-pink", html: ic("chart") + "Score trend"}), h("span", {class:"aside", text:`Last ${pts.length} answers`})),
      h("div", {html:`<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Score trend"><path d="${d}" fill="none" stroke="var(--pink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`})));
  }
  v.append(h("h3", {class:"sechead"}, "By topic"));
  const pool = filtered();
  v.append(h("div", {class:"list"}, TRACKS.map(t => {
    const qs = pool.filter(q => q.t === t.id); if (!qs.length) return null;
    const tried = qs.filter(q => progress[q.id] && progress[q.id].scores.length);
    const a = avg(tried.map(q => progress[q.id].scores.at(-1)));
    const [icon, col] = TRACK_STYLE[t.id] || ["list","c-gray"];
    return h("button", {class:"li", onclick:() => { setTrack(t.id); go("drill"); }},
      h("span", {class:"lic "+col, html:ic(icon)}),
      h("div", {class:"lit"}, h("b", {text:t.name}), h("span", {text: `${tried.length} of ${qs.length} attempted`}), mixBar(mix(qs), qs.length)),
      h("span", {class:"trail"}, a !== null ? h("span", {class:`score-chip sc-${band(a)}`, text: a.toFixed(1)}) : null, chevEl()));
  })));
  v.append(h("h3", {class:"sechead"}, "Recent answers"));
  const recent = history.slice(-12).reverse();
  const byId = Object.fromEntries(allQs().map(q => [q.id, q]));
  v.append(h("div", {class:"list"}, recent.length ? recent.map(x => { const q = byId[x.id]; if (!q) return null;
    return h("button", {class:"li qrow", onclick:() => { state.track = q.t; state.view = "drill"; showQuestion(q); }},
      h("span", {class:"lic " + (x.score >= 8 ? "c-green" : x.score >= 6 ? "c-blue" : x.score >= 4 ? "c-orange" : "c-red"), html: ic("mic")}),
      h("div", {class:"lit"}, h("b", {text:q.q}), h("span", {text: new Date(x.ts).toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}) + (x.fillers ? ` · ${x.fillers} fillers` : "")})),
      h("span", {class:"trail"}, h("span", {class:`score-chip sc-${band(x.score)}`, text: x.score + "/10"}), chevEl())); }) : [h("div", {class:"empty", text:"Analyze your first answer to see it here."})]));
}
function tile(col, icon, k, val, sub){ return h("div", {class:"tile"}, h("div", {class:"k "+col, html: ic(icon) + k}), h("div", {class:"v", text:val}), h("div", {class:"s", text:sub})); }

/* ---------- Settings sheet ---------- */
function openSettings(){
  closeDrawer();
  const layer = $("layer");
  const close = () => { layer.replaceChildren(); document.removeEventListener("keydown", esc); render(); };
  const esc = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc);
  const sw = (key, label) => { const id = "s-"+key; return h("div", {class:"setrow"}, h("label", {for:id, text:label}), h("input", {type:"checkbox", class:"switch", id, checked: !!settings[key], onchange:e => { settings[key] = e.target.checked; saveSettings(); }})); };
  const sel = (key, label, opts, after) => { const id = "s-"+key; return h("div", {class:"setrow"}, h("label", {for:id, text:label}), h("select", {class:"selectbtn", id, onchange:e => { settings[key] = e.target.value; saveSettings(); after && after(); }}, ...opts.map(([v,n]) => h("option", {value:v, selected: settings[key]===v, text:n})))); };
  const keyInput = h("input", {type:"password", id:"s-key", placeholder: sample ? "Not needed here" : "sk-ant-…", autocomplete:"off", value: apiKey});
  const keyMsg = h("div", {class:"grpfoot"});
  let armed = false;
  const resetBtn = h("button", {class:"btn plain danger", onclick:() => {
    if (!armed){ armed = true; resetBtn.textContent = "Tap again to erase all progress"; setTimeout(() => { armed = false; resetBtn.textContent = "Reset all progress"; }, 4000); return; }
    progress = {}; history = []; store.set("progress", progress); store.set("history", history); resetBtn.textContent = "Progress cleared"; }, text:"Reset all progress"});
  const sheet = h("div", {class:"sheet", role:"dialog", "aria-modal":"true", "aria-labelledby":"setTitle"},
    h("div", {class:"sheethead"}, h("span"), h("b", {id:"setTitle", text:"Settings"}), h("button", {class:"tbtn", onclick:close, text:"Done", style:{fontWeight:600}})),
    Cloud.enabled ? h("div", {class:"grphead", text:"Account"}) : null,
    Cloud.enabled ? h("div", {class:"list grp"}, h("button", {class:"li", onclick:() => openAccount(Cloud.user ? "profile" : "signin")},
      h("span", {class:"avatar" + (Cloud.user ? " on" : ""), style:{width:"29px", height:"29px", fontSize:"12px"}, html: Cloud.user ? initials(Cloud.name()) : ic("person")}),
      h("div", {class:"lit"}, h("b", {text: Cloud.user ? Cloud.name() : "Sign in or create account"}), h("span", {text: Cloud.user ? Cloud.user.email : "Keep your progress on every device"})),
      h("span", {class:"trail"}, chevEl()))) : null,
    privateBankRow(),
    h("div", {class:"grphead", text:"Practice"}),
    h("div", {class:"list grp"}, sw("autoGrade","Analyze when I stop recording"),
      sel("strict","Interviewer style", [["standard","Standard analyst"],["tough","Tough MD"],["coach","Friendly coach"]])),
    h("div", {class:"grphead", text:"Appearance"}),
    h("div", {class:"list grp"}, sel("theme","Theme", [["system","Automatic"],["light","Light"],["dark","Dark"]], applyTheme)),
    h("div", {class:"grphead", text:"Claude review (optional)"}),
    h("div", {class:"list grp"},
      sample ? h("div", {class:"setrow"}, h("label", {text:"Claude is connected through this page"}), h("span", {class:"ai-badge", html: ic("sparkles") + "On"})) :
        h("div", {class:"setrow"}, h("label", {for:"s-key", text:"API key"}), keyInput),
      sample ? null : sel("aiModel","Model", [["claude-opus-5-5","Claude Opus 5.5 (best)"],["claude-sonnet-5-5","Claude Sonnet 5.5 (faster)"],["claude-haiku-5-5","Claude Haiku 5.5 (cheapest)"]]),
      sel("aiMode","When to review", [["auto","After every answer"],["manual","Only when I ask"]])),
    sample ? null : keyMsg,
    sample ? null : h("div", {class:"row", style:{margin:"8px 32px 0"}},
      h("button", {class:"btn tint", onclick:() => { apiKey = keyInput.value.trim(); try{ apiKey ? localStorage.setItem("sdr:apikey", apiKey) : localStorage.removeItem("sdr:apikey"); }catch{} keyMsg.textContent = apiKey ? "Saved in this browser." : "Key removed."; }, html: ic("key") + "Save key"}),
      h("button", {class:"btn plain", onclick: async () => { keyMsg.textContent = "Testing…"; apiKey = keyInput.value.trim(); try{ await callClaude('Return JSON with score 10, verdict "ok", empty arrays and empty strings for the rest.'); keyMsg.textContent = "Connected. Claude will review your answers."; }catch(e){ keyMsg.textContent = "That didn't work: " + (e.message || e.code || "network error"); } }, text:"Test"})),
    sample ? null : h("div", {class:"grpfoot", text:"Without a key, the built-in coach grades everything on this device. With a key, Claude also gives an interviewer score, rewrites your answer and asks follow-ups. The key stays in this browser and is sent only to api.anthropic.com. Each review costs a few cents on your Anthropic account."}),
    h("div", {class:"grphead", text:"Data"}),
    h("div", {class:"list grp"}, h("div", {class:"setrow"}, h("label", {text: Cloud.user ? "Progress is saved to your account." : "Progress is saved in this browser only."}), resetBtn)),
  );
  layer.replaceChildren(h("div", {class:"scrim", onclick:e => { if (e.target === e.currentTarget) close(); }}, sheet));
  sheet.querySelector("button").focus();
}

/* ---------- Accounts ---------- */
const initials = n => (n||"?").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join("") || "?";
function syncLabel(){
  const s = Cloud.status;
  if (s === "error") return "Couldn't sync. Will retry";
  if (s === "pending" || s === "saving") return "Saving…";
  if (s === "loading") return "Loading your progress…";
  if (Cloud.lastSync){ const m = Math.round((Date.now() - Cloud.lastSync)/60000); return m < 1 ? "Synced just now" : `Synced ${m} min ago`; }
  return "Synced";
}
function renderAccountRow(){
  const b = $("navAccount"); if (!b) return;
  b.hidden = !Cloud.enabled; if (!Cloud.enabled) return;
  b.replaceChildren();
  if (Cloud.user){
    b.append(h("span", {class:"avatar on", text: initials(Cloud.name())}),
      h("span", {class:"who"}, h("b", {text: Cloud.name()}), h("small", null, h("span", {class:"syncdot " + Cloud.status}), syncLabel())));
  } else {
    b.append(h("span", {class:"avatar", html: ic("person")}), h("span", {class:"who"}, h("b", {text:"Sign in"}), h("small", {text:"Save progress to your account"})));
  }
}
$("navAccount").onclick = () => openAccount(Cloud.user ? "profile" : "signin");
setInterval(() => { if (Cloud.user) renderAccountRow(); }, 30000);

function readGuest(){
  const g = k => { try{ return JSON.parse(localStorage.getItem("sdr:"+k)); }catch{ return null; } };
  return {progress: g("progress") || {}, history: g("history") || [], custom: g("custom") || []};
}
function clearGuest(){ try{ ["progress","history","custom"].forEach(k => localStorage.removeItem("sdr:"+k)); }catch{} }

Cloud.on(e => {
  if (e.type === "signin"){
    acctPrefix = "sdr:u:" + e.user.id + ":"; loadAccountData();
    try{ localStorage.setItem("sdr:welcomed", "1"); }catch{}
    if ($("layer").querySelector("[data-auth]")) $("layer").replaceChildren();
    render();
  } else if (e.type === "remote"){
    let local = {progress, history, custom};
    if (e.first){
      const guest = readGuest();
      if (Object.keys(guest.progress).length || guest.history.length){ local = Cloud.merge(local, guest); clearGuest(); }
    }
    const remote = e.data || {};
    const merged = Cloud.merge(remote, local);
    writeAccountData(merged);
    const changed = JSON.stringify(merged.history.length) !== JSON.stringify((remote.history||[]).length) || Object.keys(merged.progress).length !== Object.keys(remote.progress||{}).length;
    if (changed || !e.data) Cloud.queueSave();
    render();
  } else if (e.type === "bank"){
    useBanks(e.data || {}); state.current = null; render();
  } else if (e.type === "signout"){
    useBanks(PAGE_BANKS);
    acctPrefix = "sdr:"; loadAccountData(); state.current = null; render();
  } else if (e.type === "recovery"){
    openAccount("newpassword");
  } else if (e.type === "ready"){
    let seen = false; try{ seen = localStorage.getItem("sdr:welcomed") === "1"; }catch{}
    if (!Cloud.user && !seen) openAccount("welcome");
  }
  renderAccountRow();
});

/* Private question bank: stored in the account (readable only by its owner) and loaded
   on sign-in. Shown once one is loaded, or when the page is opened with #privatebank. */
let privateBankInfo = null;
Cloud.on(e => { if (e.type === "bank"){ const d = e.data || {}; privateBankInfo = {biws: (d.biws||[]).length, vine: (d.vine||[]).length}; } else if (e.type === "signout") privateBankInfo = null; });
function privateBankRow(){
  if (!Cloud.enabled || !Cloud.user || !(privateBankInfo || /privatebank/.test(location.hash))) return null;
  const msg = h("div", {class:"grpfoot", text: privateBankInfo
    ? `Loaded from your account: ${[privateBankInfo.biws && privateBankInfo.biws + " BIWS", privateBankInfo.vine && privateBankInfo.vine + " IB Vine"].filter(Boolean).join(" and ")} questions. Only your account can read it.`
    : "Upload a bank file (private-bank.json). It's stored in your account, only you can read it, and it loads whenever you sign in."});
  const file = h("input", {type:"file", accept:".json,application/json", hidden:true, onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    msg.textContent = "Uploading…";
    try{
      const bank = JSON.parse(await f.text());
      if (!Array.isArray(bank.biws) && !Array.isArray(bank.vine)) throw new Error("That file has no question bank in it.");
      await Cloud.saveBank(bank);
      msg.textContent = `Saved to your account: ${[(bank.biws||[]).length && (bank.biws||[]).length + " BIWS", (bank.vine||[]).length && (bank.vine||[]).length + " IB Vine"].filter(Boolean).join(" and ")} questions.`;
    }catch(err){ msg.textContent = "Couldn't save it: " + (/row-level security|policy/i.test(err.message||"") ? "only the owner account can store a private bank." : err.message || err); }
    e.target.value = "";
  }});
  return h("div", null,
    h("div", {class:"grphead", text:"Private question bank"}),
    h("div", {class:"list grp"}, h("div", {class:"setrow"}, h("label", {text: privateBankInfo ? "Your private bank is on" : "No private bank yet"}),
      h("button", {class:"btn tint", onclick:() => file.click(), text: privateBankInfo ? "Replace" : "Upload"}), file)),
    msg);
}

function openAccount(mode){
  closeDrawer();
  const layer = $("layer");
  const close = () => { layer.replaceChildren(); document.removeEventListener("keydown", esc); try{ localStorage.setItem("sdr:welcomed","1"); }catch{} render(); };
  const esc = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc);
  const msg = h("div", {class:"authmsg", role:"status"});
  const say = (t, good) => { msg.textContent = t; msg.className = "authmsg " + (good ? "good" : "bad"); };
  const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };
  const field = (type, ph, auto) => h("input", {class:"field", type, placeholder:ph, autocomplete:auto, "aria-label":ph, required:true});
  const friendly = e => {
    const m = (e && e.message) || "Something went wrong.";
    if (/invalid login/i.test(m)) return "Wrong email or password.";
    if (/email not confirmed/i.test(m)) return "Confirm your email first. Check your inbox for the link.";
    if (/already registered|already exists/i.test(m)) return "That email already has an account. Sign in instead.";
    if (/password/i.test(m) && /6|short|weak/i.test(m)) return "Use a password with at least 8 characters.";
    if (/rate limit/i.test(m)) return "Too many tries. Wait a minute and try again.";
    return m;
  };
  let body;
  const head = (title) => h("div", {class:"sheethead"}, h("span"), h("b", {id:"acctTitle", text:title}), h("button", {class:"tbtn", onclick:close, text: mode === "welcome" ? "Not now" : "Done", style:{fontWeight:600}}));

  if (mode === "profile" && Cloud.user){
    const name = h("input", {class:"field", value: Cloud.name(), "aria-label":"Name", autocomplete:"name"});
    const n = Object.keys(progress).length;
    body = [head("Account"),
      h("div", {class:"authhero"}, h("div", {class:"avatar big on", text: initials(Cloud.name())}), h("h2", {text: Cloud.name()}), h("p", {text: Cloud.user.email})),
      h("div", {class:"grphead", text:"Profile"}),
      h("div", {class:"authform"}, h("div", {class:"list"}, h("div", {class:"li"}, name))),
      h("div", {class:"row", style:{margin:"0 32px"}}, h("button", {class:"btn tint", onclick: async ev => { const b = ev.currentTarget; busy(b, true); try{ await Cloud.updateName(name.value.trim()); say("Name saved.", true); renderAccountRow(); }catch(e){ say(friendly(e)); } busy(b, false); }, text:"Save name"})),
      h("div", {class:"grphead", text:"Sync"}),
      h("div", {class:"list grp"}, h("div", {class:"setrow"}, h("label", null, h("span", {class:"syncdot " + Cloud.status}), syncLabel()), h("span", {class:"t-gray", text: `${n} question${n===1?"":"s"} tracked`}))),
      h("div", {class:"grpfoot", text:"Your progress follows you to any device where you sign in."}),
      msg,
      h("div", {class:"authactions"}, h("button", {class:"btn danger", onclick: async () => { await Cloud.signOut(); close(); }, text:"Sign out"}))];
  } else if (mode === "newpassword"){
    const pw = field("password", "New password", "new-password");
    const go = h("button", {class:"btn fill lg", type:"submit", text:"Save new password"});
    body = [head("New password"),
      h("div", {class:"authhero"}, h("h2", {text:"Choose a new password"}), h("p", {text:"At least 8 characters."})),
      h("form", {class:"authform", onsubmit: async e => { e.preventDefault(); if (pw.value.length < 8) return say("Use at least 8 characters."); busy(go, true); try{ await Cloud.setPassword(pw.value); say("Password updated. You're signed in.", true); setTimeout(close, 900); }catch(err){ say(friendly(err)); } busy(go, false); }},
        h("div", {class:"list"}, h("div", {class:"li"}, pw)), msg, h("div", {class:"authactions"}, go))];
  } else {
    let tab = mode === "signup" ? "signup" : "signin";
    if (mode === "reset") tab = "reset";
    const name = field("text", "Name", "name"), email = field("email", "Email", "email"), pw = field("password", "Password", tab === "signup" ? "new-password" : "current-password");
    name.required = false;
    const go = h("button", {class:"btn fill lg", type:"submit"});
    const seg = h("div", {class:"seg", role:"group", "aria-label":"Account", style:{display:"grid", margin:"4px 16px 14px"}});
    const paint = () => {
      seg.replaceChildren(...[["signin","Sign in"],["signup","Create account"]].map(([k,n]) => h("button", {type:"button", "aria-pressed": String(tab===k), onclick:() => { tab = k; msg.textContent = ""; paint(); }, text:n})));
      seg.hidden = tab === "reset";
      nameRow.hidden = tab !== "signup"; pwRow.hidden = tab === "reset";
      pw.autocomplete = tab === "signup" ? "new-password" : "current-password";
      go.textContent = tab === "signup" ? "Create account" : tab === "reset" ? "Email me a reset link" : "Sign in";
      forgot.hidden = tab !== "signin";
      back.hidden = tab !== "reset";
    };
    const nameRow = h("div", {class:"li"}, name), pwRow = h("div", {class:"li"}, pw);
    const forgot = h("button", {type:"button", class:"btn plain", onclick:() => { tab = "reset"; msg.textContent = ""; paint(); }, text:"Forgot password?"});
    const back = h("button", {type:"button", class:"btn plain", onclick:() => { tab = "signin"; msg.textContent = ""; paint(); }, text:"Back to sign in"});
    const submit = async e => {
      e.preventDefault();
      const em = email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(em)) return say("Enter a valid email.");
      if (tab !== "reset" && pw.value.length < (tab === "signup" ? 8 : 1)) return say(tab === "signup" ? "Use a password with at least 8 characters." : "Enter your password.");
      busy(go, true);
      try{
        if (tab === "signin"){ await Cloud.signIn(em, pw.value); say("Signed in.", true); }
        else if (tab === "signup"){ const r = await Cloud.signUp(em, pw.value, name.value.trim()); if (r.needsConfirm) say("Check your email and tap the link to confirm, then sign in here.", true); else say("Account created.", true); }
        else { await Cloud.reset(em); say("If that email has an account, a reset link is on its way.", true); }
      }catch(err){ say(friendly(err)); }
      busy(go, false); paint();
    };
    body = [head(mode === "welcome" ? "Welcome" : "Account"),
      h("div", {class:"authhero"}, h("div", {class:"avatar big", html: ic("person")}),
        h("h2", {text: mode === "welcome" ? "Save your progress" : "Sign in to sync"}),
        h("p", {text:"Create a free account to keep your scores and mastery on every device."})),
      seg,
      h("form", {class:"authform", onsubmit: submit, novalidate:true}, h("div", {class:"list"}, nameRow, h("div", {class:"li"}, email), pwRow), msg,
        h("div", {class:"authactions"}, go, h("div", {class:"row", style:{justifyContent:"center"}}, forgot, back),
          mode === "welcome" ? h("button", {type:"button", class:"btn plain", onclick: close, text:"Continue without an account"}) : null))];
    paint();
  }
  const sheet = h("div", {class:"sheet", role:"dialog", "aria-modal":"true", "aria-labelledby":"acctTitle", "data-auth":""}, ...body);
  layer.replaceChildren(h("div", {class:"scrim", onclick:e => { if (e.target === e.currentTarget) close(); }}, sheet));
  const f = sheet.querySelector("input:not([hidden])"); if (f && mode !== "profile") setTimeout(() => f.focus(), 50);
}

/* ---------- Keyboard ---------- */
document.addEventListener("keydown", e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName || "");
  if (typing || e.metaKey || e.ctrlKey || e.altKey || $("layer").children.length) return;
  if ((state.view === "drill" || state.view === "mock") && e.key === " " && $("recBtn")){ e.preventDefault(); mic.on ? stopMic() : startMic(); }
  if ((state.view === "drill") && e.key.toLowerCase() === "n"){ pickNext(); }
});

/* ---------- Boot ---------- */
if (!TRACKS.some(t => t.id === state.track)) state.track = "acct";
if (!filtered().some(q => q.t === state.track)) state.track = (filtered()[0]||{}).t || "acct";
const first = filtered().find(q => q.t === state.track && !progress[q.id]) || filtered().find(q => q.t === state.track);
if (first) showQuestion(first, {render:false, speak:false});   // browsers block speech before a tap
render();
})();
