/* ==========================================================================
   Interview Coach engine — runs fully offline.
   analyze(question, answer, seconds) -> report
   Scores content against the answer key, catches common factual mistakes,
   and coaches delivery: filler, hedging, rambling, structure, wording, STAR.
   ========================================================================== */
const Coach = (() => {

/* ---------- Normalisation ---------- */
// Finance phrases -> one canonical token, so "PP and E", "PP&E" and
// "property plant and equipment" all match each other.
const PHRASES = [
  [/\bdepreciation (?:and|&) amortization\b|\bd ?(?:&|and|n) ?a\b/g, " da "],
  [/\bproperty,? plant,? (?:and|&) equipment\b|\bpp ?(?:&|and|n) ?e\b|\bppe\b/g, " ppe "],
  [/\baccounts receivables?\b|\ba\/r\b|\breceivables\b/g, " ar "],
  [/\baccounts payables?\b|\ba\/p\b|\bpayables\b/g, " ap "],
  [/\baccrued (?:expenses|liabilities)\b|\baccruals\b/g, " accrued "],
  [/\bdeferred revenues?\b|\bunearned revenues?\b/g, " deferredrevenue "],
  [/\bdeferred tax liabilit(?:y|ies)\b|\bdtls?\b/g, " dtl "],
  [/\bdeferred tax assets?\b|\bdtas?\b/g, " dta "],
  [/\bnet operating loss(?:es)?\b|\bnols?\b/g, " nol "],
  [/\bnet income\b|\bnet earnings\b|\bbottom line\b/g, " netincome "],
  [/\bincome statement\b|\bp ?(?:&|and|n) ?l\b|\bprofit and loss(?: statement)?\b/g, " incomestatement "],
  [/\bbalance sheet\b/g, " balancesheet "],
  [/\bcash flow statement\b|\bstatement of cash flows\b|\bcfs\b/g, " cfs "],
  [/\bcash flow from operations\b|\bcash flows? from operating(?: activities)?\b|\boperating cash flow\b|\bcfo\b/g, " cfo "],
  [/\bcash flow from investing(?: activities)?\b|\binvesting cash flow\b|\bcfi\b/g, " cfi "],
  [/\bcash flow from financing(?: activities)?\b|\bfinancing cash flow\b|\bcff\b/g, " cff "],
  [/\bshareholders'? equity\b|\bstockholders'? equity\b|\bowners'? equity\b|\bbook value of equity\b/g, " shequity "],
  [/\bretained earnings\b/g, " retainedearnings "],
  [/\badditional paid[- ]in capital\b|\bapic\b/g, " apic "],
  [/\btreasury stock\b|\bshare (?:buybacks?|repurchases?)\b|\bstock buybacks?\b/g, " treasury "],
  [/\bstock[- ]based comp(?:ensation)?\b|\bsbc\b/g, " sbc "],
  [/\bcapital expenditures?\b|\bcap ?ex\b/g, " capex "],
  [/\bnet working capital\b|\bworking capital\b|\bnwc\b/g, " nwc "],
  [/\bcost of goods sold\b|\bcogs\b|\bcost of sales\b/g, " cogs "],
  [/\bselling,? general (?:and|&) administrative\b|\bsg ?(?:&|and) ?a\b/g, " sga "],
  [/\bearnings before interest,? taxes,? depreciation,? (?:and|&) amortization\b|\be ?bit ?da\b|\bebitda\b/g, " ebitda "],
  [/\bearnings before interest (?:and|&) taxes\b|\boperating income\b|\boperating profit\b|\bebit\b/g, " ebit "],
  [/\benterprise value\b|\bev\b|\bfirm value\b|\btransaction value\b/g, " ev "],
  [/\bequity value\b|\bmarket cap(?:italization)?\b|\bmarket value of equity\b/g, " equityvalue "],
  [/\bweighted average cost of capital\b|\bwacc\b|\bwhack\b/g, " wacc "],
  [/\bcost of equity\b/g, " costequity "],
  [/\bcost of debt\b/g, " costdebt "],
  [/\bcapital asset pricing model\b|\bcapm\b|\bcap m\b/g, " capm "],
  [/\bequity risk premium\b|\bmarket risk premium\b|\berp\b/g, " erp "],
  [/\brisk[- ]free rate\b/g, " riskfree "],
  [/\bfree cash flow\b|\bfcf\b|\bufcf\b|\blfcf\b/g, " fcf "],
  [/\bterminal value\b|\bexit value\b/g, " terminalvalue "],
  [/\bperpetuity growth\b|\bgordon growth\b|\bperpetual growth\b/g, " gordon "],
  [/\bexit multiples?\b|\bmultiples method\b/g, " exitmultiple "],
  [/\bdiscounted cash flows?\b|\bdcf\b/g, " dcf "],
  [/\bleveraged buy ?outs?\b|\blbos?\b/g, " lbo "],
  [/\binternal rate of return\b|\birr\b/g, " irr "],
  [/\bmultiple of (?:invested capital|money)\b|\bmoic\b|\bcash[- ]on[- ]cash\b/g, " moic "],
  [/\bmergers? (?:and|&) acquisitions?\b|\bm ?(?:&|and|n) ?a\b/g, " mna "],
  [/\bprice[- ]to[- ]earnings\b|\bp ?\/ ?e\b|\bpe ratio\b|\bp e\b/g, " pe "],
  [/\bearnings per share\b|\beps\b/g, " eps "],
  [/\bnet operating profit after tax(?:es)?\b|\bnopat\b/g, " nopat "],
  [/\bcomparable compan(?:y|ies)\b|\btrading comps?\b|\bpublic comps?\b|\bcomps\b/g, " comps "],
  [/\bprecedent transactions?\b|\bprecedents\b|\btransaction comps\b|\bdeal comps\b/g, " precedents "],
  [/\bsources (?:and|&) uses\b/g, " sourcesuses "],
  [/\bnon[- ]?controlling interests?\b|\bminority interests?\b|\bnci\b/g, " nci "],
  [/\bpreferred (?:stock|equity|shares)\b/g, " preferred "],
  [/\bgoodwill\b/g, " goodwill "],
  [/\bintangible assets?\b|\bintangibles\b/g, " intangibles "],
  [/\binterest expense\b/g, " interestexpense "],
  [/\bdividends?\b/g, " dividend "],
  [/\brevolving credit facility\b|\brevolver\b/g, " revolver "],
  [/\bsynerg(?:y|ies)\b/g, " synergy "],
  [/\baccretive\b|\baccretion\b/g, " accretive "],
  [/\bdilutive\b|\bdilution\b/g, " dilutive "],
  [/\bpre[- ]?tax income\b|\bearnings before tax(?:es)?\b|\bebt\b/g, " pretax "],
  [/\bfederal reserve\b|\bthe fed\b/g, " fed "],
  // plain-English synonyms people say instead of the textbook word
  [/\b(?:predictable|steady|stable|stability|consistent|reliable|annuity[- ]like)\b/g, " predictable "],
  [/\b(?:speculative|risky|riskier|volatile|volatility|uncertain|uncertainty|unpredictable)\b/g, " volatile "],
  [/\b(?:bought back|buy back|buys back|repurchased)\b/g, " repurchased "],
  [/\b(?:short[- ]term borrowing|short[- ]term loan|line of credit|credit line)\b/g, " revolver "],
  [/\b(?:pay|pays|paid|paying)(?: (?:the|it|its|that|this|some|of the|their))? (?:debt )?(?:down|off|back)\b|\bpay ?downs?\b/g, " repay "],
  [/\bno (?:change|effect|impact)\b|\bdoesn'?t change\b|\bdon'?t change\b|\bstays? the same\b|\bremains? (?:the same|unchanged)\b|\bnet (?:zero|neutral)\b/g, " unchanged "],
  [/\binterest rates?\b/g, " rates "],
  [/\bper ?cent\b|%/g, " percent "],
  // behavioral concepts
  [/\bempath\w*|\blisten\w*|\b(?:their|his|her|the other) (?:side|perspective|point of view)\b|\bunderstood (?:why|what|that|where)\b|\bperspective\b/g, " empathy "],
  [/\blessons?\b|\bi learned\b|\blearned\b|\btakeaways?\b|\btaught me\b/g, " lesson "],
  [/\bas a result\b|\boutcomes?\b|\bin the end\b|\bended up\b/g, " outcome "],
  [/\bresolv\w*|\bresolution\b|\bcompromis\w*|\bworked it out\b/g, " resolve "],
];
const DIR_UP = /^(?:up|increase[sd]?|increasing|rise[sn]?|rising|rose|grow[sn]?|grew|growing|higher|goes up|gain|gains|plus|positive|add|adds|added|boost)$/;
const DIR_DOWN = /^(?:down|decrease[sd]?|decreasing|fall[sn]?|falling|fell|decline[sd]?|declining|drop[sp]?(?:ed)?|lower|reduce[sd]?|reducing|minus|negative|subtract(?:s|ed)?|less|loss|losses|shrink[s]?)$/;
const NUMWORDS = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,thousand:1000};
const STOP = new Set(("a an the and or but if then so of to in on at by for with from as is are was were be been being it its it's this that these those there their they them we our you your i me my he she his her not no do does did done have has had will would can could should may might also just than too very more most such into over under about out up down off per via each any all both some other own same only i'm we're you're it'll which who whom what when where why how while because also e.g eg i.e ie etc vs versus like using use used one".split(" ")).filter(w=>w!=="up"&&w!=="down"&&w!=="not"&&w!=="no"));

const NUMWORD = "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand";
const NUMRUN = new RegExp(`\\b(?:a |\\d+ )?(?:${NUMWORD})(?:(?:[- ]|,? and )(?:${NUMWORD}))*\\b`, "g");
function parseNumberWords(run){
  // "five hundred sixty" -> 560, "a hundred and sixty" -> 160, "twenty-four hundred" -> 2400
  // Two small numbers in a row ("one sixty", "three four") are separate numbers.
  const ws = run.replace(/,? and /g," ").split(/[- ]+/).filter(Boolean);
  const out = [];
  let total = 0, cur = 0, last = null;
  for (const w of ws){
    const n = w === "a" ? 1 : /^\d+$/.test(w) ? Number(w) : NUMWORDS[w];
    if (w === "hundred") cur = (cur || 1) * 100;
    else if (w === "thousand"){ total += (cur || 1) * 1000; cur = 0; }
    else {
      const tens = n >= 20 && n < 100 && n % 10 === 0;
      const clash = last !== null && last !== "hundred" && last !== "thousand" && (cur % 100 !== 0 || total && !cur) &&
                    (tens || (n < 20 && !(last >= 20 && last % 10 === 0 && cur % 10 === 0)));
      // "five sixty" -> 560, "twenty one sixty" -> 2160 (how people say prices and amounts)
      if (clash && tens && !total && cur < 100) cur = cur * 100;
      else if (clash){ out.push(total + cur); total = 0; cur = 0; }
      cur += n;
    }
    last = w === "hundred" || w === "thousand" ? w : n;
  }
  out.push(total + cur);
  return out.join(" ");
}
function wordsToNumbers(s){
  // "forty" -> 40, "five hundred sixty" -> 560, "one point five" -> 1.5, "ten dollars" -> 10
  return s.replace(NUMRUN, run => parseNumberWords(run.trim()))
          .replace(/\b(\d+) point (\d+)\b/g,"$1.$2");
}
function normalize(text){
  let s = " " + String(text||"")
    .replace(/\bIS\b/g," income statement ").replace(/\bBS\b/g," balance sheet ")
    .replace(/\bNI\b/g," net income ").replace(/\bOI\b/g," operating income ")
    .replace(/\bTV\b/g," terminal value ").replace(/\bCF\b/g," cash flow ")
    .toLowerCase()
    .replace(/[’‘]/g,"'")
    // signed amounts in answer keys: "Net Income –$6" -> down 6, "cash +$4" -> up 4
    .replace(/(^|[\s(:;,])[–—−-]\s?\$\s?(\d)/g,"$1 down $2").replace(/(^|[\s(:;,])\+\s?\$?\s?(\d)/g,"$1 up $2")
    .replace(/[–—−]/g," - ")
    .replace(/\$\s?(\d)/g,"$1").replace(/(\d),(\d{3})/g,"$1$2")
    .replace(/(\d)\s?(k|m|mm|bn|b|x)\b/g,"$1 $2")
    .replace(/\bdollars?\b|\bbucks?\b|\busd\b/g," ") + " ";
  s = wordsToNumbers(s);
  for (const [re, rep] of PHRASES) s = s.replace(re, rep);
  return s.replace(/[^a-z0-9.%\s]/g," ").replace(/(\D)\.|\.(\D)/g,"$1 $2").replace(/\s+/g," ").trim();
}
function stem(w){
  if (/^\d/.test(w) || w.length <= 4) return w;
  return w.replace(/(?:ational|ization|ations|ation|ingly|ments|ment|ness|ities|ity|ings|ing|edly|ies|ied|ed|es|ly|s)$/,"")
          .replace(/(.)\1$/,"$1").replace(/(?<=\w{4})e$/,"");
}
const DOMAIN = new Set(["da","ppe","ar","ap","accrued","deferredrevenue","dtl","dta","nol","netincome","incomestatement","balancesheet","cfs","cfo","cfi","cff","shequity","retainedearnings","apic","treasury","sbc","capex","nwc","cogs","sga","ebitda","ebit","ev","equityvalue","wacc","costequity","costdebt","capm","erp","riskfree","fcf","terminalvalue","gordon","exitmultiple","dcf","lbo","irr","moic","mna","pe","eps","nopat","comps","precedents","sourcesuses","nci","preferred","goodwill","intangibles","interestexpense","dividend","revolver","synergy","accretive","dilutive","pretax","beta","inventory","cash","debt","equity","revenue","tax","taxes","interest","depreciation","amortization","impairment","premium","leverage","multiple","discount","growth","margin","valuation","asset","liability","liabilities","assets","fed","rates","inflation","yield","spread","bond","coupon","duration","convexity"]);
function tokens(text){ return normalize(text).split(" ").filter(Boolean); }
function sigTokens(text){
  return tokens(text).filter(w => !STOP.has(w) && (w.length > 2 || DOMAIN.has(w) || /^\d/.test(w))).map(stem);
}

/* ---------- Answer-key parsing ---------- */
function keyPoints(q){
  const raw = (q.k || []).map(x => String(x).trim()).filter(Boolean);
  const pts = [];
  for (let i = 0; i < raw.length; i++){
    const line = raw[i];
    // "The three statements are:" style lead-ins carry no content of their own.
    if (/:$/.test(line) && line.split(/\s+/).length <= 10) continue;
    // Sample answers in the key ("Example: My secret is…") illustrate; they aren't required.
    if (/^(?:example|e\.g\.|for example|sample answer)\b/i.test(line)) continue;
    const toks = [...new Set(sigTokens(line))];
    if (!toks.length) continue;
    const guide = q.t === "beh" || q.t === "mkt";
    const concepts = guide ? CONCEPTS.filter(c => c.key.test(line)) : [];
    pts.push({text: line, toks, label: shortLabel(line), concepts});
  }
  return pts;
}
function shortLabel(line){
  const head = line.split(/[:–—]| - /)[0].trim();
  return head.length > 4 && head.length < 60 ? head : line.slice(0, 70) + (line.length > 70 ? "…" : "");
}
const META = new Set(["star","structur","structure","show","specific","concret","concrete","exampl","example","avoid","mention","answer","clear","strong","good","candidat","interview","interviewer","explain","demonstr","highlight","discuss","brief","briefly","emphas","ensur","focus","includ","situat","task","action","result","quantifi","possibl","sound","real","genuin","persona","relev","relevant","detail","short","long","generic","answers"].map(stem));
const GENERIC = new Set(["detail","details","compan","company","show","shows","present","presents","categoriz","categorized","includ","includes","typic","typically","general","main","key","overall","firm","business","busines","provid","provides","certain","various","specif","specific","particular","usual","usually","differ","different","import","important","term","terms","way","ways","make","makes","impact","affect","affects","help","helps"].map(stem));
function weightOf(t){ return DOMAIN.has(t) || /^\d/.test(t) ? 2 : GENERIC.has(t) ? 0.35 : 1; }

/* ---------- Content coverage ---------- */
function lev1(a,b){ // edit distance <= 1, cheap
  if (Math.abs(a.length-b.length) > 1) return false;
  let i=0,j=0,e=0;
  while(i<a.length && j<b.length){ if(a[i]===b[j]){i++;j++;continue;} if(++e>1) return false; if(a.length>b.length) i++; else if(b.length>a.length) j++; else {i++;j++;} }
  return e + (a.length-i) + (b.length-j) <= 1;
}
function hasTok(set, arr, t){
  if (set.has(t)) return true;
  if (t.length >= 6 && !/^\d/.test(t)) return arr.some(x => x.length >= 5 && lev1(x, t));
  return false;
}
/* ---------- Concepts: guidance-style key points ("show empathy", "price target")
   are matched by meaning, not by repeating the key's words. ---------- */
const BLAME = /\b(?:lazy|stupid|idiot|incompetent|useless|annoying|hated|his fault|her fault|their fault|didn'?t do anything|did nothing|blame)\b/i;
const CONCEPTS = [
  {name:"STAR story", key:/\bstar\b/i, ans:a => [/\b(?:when|while|during|last|at my|in my|as (?:a|the))\b/i, /\b(?:had to|needed to|goal|deadline|problem|challenge|disagreed|stakes)\b/i, /\bi (?:\w+ed|built|made|took|led|met|set|split|wrote)\b/i, /\b(?:result|ended up|in the end|we (?:won|finished|placed|got|hit)|\d)/i].filter(r => r.test(a)).length >= 3},
  {name:"empathy", key:/empath|other (?:side|person'?s)|perspective|understood/i, ans:/\b(?:listen\w*|understand\w*|understood|perspective|their side|(?:his|her|their) (?:situation|concerns?|side|point|view|reasons?)|where (?:he|she|they) (?:was|were) coming from|turned out|realiz\w+ (?:he|she|they)|asked (?:him|her|them) (?:why|what|how|about)|hear (?:him|her|them) out)\b/i},
  {name:"resolution", key:/resolution|resolv|team goal|constructive|compromise|collaborat/i, ans:/\b(?:resolv\w*|compromis\w*|agreed|we (?:split|divided|combined|decided|landed)|middle ground|together|both (?:approaches|ideas|methods|views)|common goal|team goal|a plan)\b/i},
  {name:"outcome", key:/outcome|result|impact/i, ans:/\b(?:as a result|in the end|ended up|result|outcome|we (?:won|finished|delivered|raised|grew|cut|saved|hit|closed|placed|got|beat|met)|placed|finished|increased|reduced|improved|on time|early)\b|\d/i},
  {name:"lesson", key:/lesson|learn|takeaway|reflect/i, ans:/\b(?:learn\w*|lesson|taught me|takeaway|realiz\w+|now i|since then|going forward|next time|ever since)\b/i},
  {name:"no blame", key:/blame|negativ|criticiz|bad[- ]mouth/i, ans:a => !BLAME.test(a)},
  {name:"real weakness", key:/disguised|real weakness|genuine weakness|not a (?:strength|humblebrag)|work too hard/i, ans:a => /\bweakness|struggle|i (?:tend|used) to|hard for me|not (?:great|good|strong) at|i can be\b/i.test(a) && !/\b(?:perfectionist|work too hard|care too much|too detail|too dedicated)\b/i.test(a)},
  {name:"not a core skill", key:/core (?:requirement|skill)|attention to detail|not (?:a )?core/i, ans:a => !/\b(?:attention to detail|careless|excel|math|time management|deadlines|work ethic|lazy)\b/i.test(a)},
  {name:"steps to improve", key:/steps|improv|progress|fix|working on|overcome/i, ans:/\b(?:started|began|joined|signed up|set (?:a|myself)|practic\w*|work(?:ing|ed) on|now i|since then|i've (?:been|started|gotten)|habit|system|checklist|each (?:week|meeting|day)|every (?:week|meeting|day)|forced myself|made a point)\b/i},
  {name:"evidence", key:/evidence|proof|quantif|specific number|metric/i, ans:/\d|\b(?:percent|doubled|tripled|first time|every)\b/i},
  {name:"name, ticker and price", key:/ticker|name.*price|price.*name/i, ans:/\b(?:ticker|trad(?:es|ing) (?:at|around|near)|shares? (?:are|trade)|per share|a share|stock price|\d+ dollars)\b/i},
  {name:"thesis", key:/thesis|one-line|pitch/i, ans:/\b(?:thesis|undervalued|overvalued|mispriced|market (?:is )?(?:missing|underestimat\w*|overlook\w*)|i(?:'d| would) (?:buy|pitch|go long|short|recommend)|long|short)\b/i},
  {name:"reasons with numbers", key:/reasons|catalyst|growth|margins/i, ans:a => /\b(?:first|second|third|catalyst|growth|margins?|driver)\b/i.test(a) && /\d/.test(a)},
  {name:"valuation vs comps", key:/valuation|mispriced|comps|multiple|history/i, ans:/\b(?:times (?:earnings|ebitda|sales|revenue)|p\/?e|multiples?|trades? (?:at|around)|comps|peers|historical|histor\w+|cheap|expensive|discount|premium|ev ?\/ ?ebitda)\b/i},
  {name:"risks", key:/risk|wrong|downside/i, ans:/\b(?:risks?|downside|wrong if|concerns?|worr\w+|what could go wrong|bear case)\b/i},
  {name:"price target", key:/target|expected return|upside/i, ans:/\b(?:target|upside|expected return|return of|\d+ ?(?:percent|%) (?:upside|return|up))\b/i},
  {name:"business lines", key:/business lines|services|m&a|restructuring|products/i, ans:/\b(?:m ?& ?a|m and a|mergers|advis\w*|capital markets|restructuring|sales and trading|wealth|asset management|lending|equity|debt|underwrit\w*)\b/i},
  {name:"industries", key:/vertical|industr|sector|niche|known for/i, ans:/\b(?:industr\w*|sectors?|healthcare|tech\w*|industrials|consumer|energy|fig|financial institutions|real estate|middle[- ]market|transportation|logistics|media|telecom)\b/i},
  {name:"recent deals or culture", key:/recent deals|rankings|culture|league|news/i, ans:/\b(?:deals?|transactions?|advised|league tables?|ranks?|ranked|culture|spoke|talked|met with|analysts?|associates?)\b/i},
  {name:"lighthearted and unique", key:/lighthearted|quirky|unique skill|memorable|creative|fun/i, ans:/\b(?:hobby|weekend|secret|funny|surprising\w*|not on my resume|i (?:restore|bake|play|collect|build|cook|paint|run|juggle|speak|brew|fix|knit|draw))\b/i},
  {name:"ties to a positive trait", key:/positive trait|reflects|shows|transferable|relevant/i, ans:/\b(?:shows|reflects|taught me|which is (?:useful|why|what)|helps? me|same (?:skill|patience|discipline)|banking|at work|on a team|attention to detail|patience|discipline|focus)\b/i},
  {name:"professional", key:/professional|appropriate/i, ans:a => !/\b(?:drunk|hangover|illegal|weed|drugs|crime|arrested)\b/i.test(a)},
  {name:"why banking: learning and deals", key:/learning curve|exposure|deal|interest in|why (?:ib|banking)/i, ans:/\b(?:learn\w*|exposure|deals?|transactions?|clients?|analytical|fast[- ]paced|steep|work on)\b/i},
  {name:"a real experience", key:/experience|story|example|background/i, ans:/\b(?:when i|at my|in my|during|last (?:summer|year|semester)|i (?:interned|worked|led|founded|started|built|joined))\b/i},
  {name:"how it led to finance", key:/led (?:you|to)|brought you|tie|connect|why finance|path/i, ans:/\b(?:that'?s (?:when|why|how|what)|which (?:is what|led|got)|led me|got me|drew me|pulled me|realized i|now i'?m|that'?s what|that experience|so i (?:started|joined|decided))\b/i},
];
function conceptRatio(p, answer){
  if (!p.concepts.length) return null;
  const got = p.concepts.filter(c => typeof c.ans === "function" ? c.ans(answer) : c.ans.test(answer));
  return {ratio: got.length / p.concepts.length, got: got.map(c=>c.name), miss: p.concepts.filter(c => !got.includes(c)).map(c=>c.name)};
}

function coverage(points, ansToks, answer){
  const set = new Set(ansToks), arr = [...set];
  return points.map(p => {
    let tot = 0, got = 0; const hit = [], miss = [];
    for (const t of p.toks){ const w = weightOf(t); tot += w; if (hasTok(set, arr, t)){ got += w; hit.push(t); } else miss.push(t); }
    let ratio = tot ? got / tot : 0;
    const cr = conceptRatio(p, answer || "");
    if (cr && cr.ratio > ratio) return {...p, ratio: cr.ratio, status: cr.ratio >= 0.66 ? "hit" : cr.ratio >= 0.34 ? "partial" : "miss", hit: cr.got, miss: cr.miss, byConcept: true};
    const need = p.toks.length <= 3 ? 0.99 : p.toks.length <= 6 ? 0.6 : 0.5;
    const status = ratio >= need ? "hit" : ratio >= need * 0.5 ? "partial" : "miss";
    return {...p, ratio, status, hit, miss};
  });
}

/* ---------- Sentences ---------- */
function sentences(text){
  const t = String(text).replace(/\s+/g," ").trim();
  if (!t) return [];
  // Speech-to-text is often all lowercase, so don't require a capital after the full stop.
  let parts = t.split(/(?<=[.!?])\s+(?=["'(]?[A-Za-z0-9$])/);
  // Speech-to-text often has no punctuation: chunk on discourse markers instead.
  if (parts.length === 1 && t.split(" ").length > 35){
    parts = t.split(/\s+(?=(?:so|and then|then|next|after that|finally|also|but|because|which means|that means|first|second|third|lastly)\b)/i);
    const merged = []; let buf = "";
    for (const p of parts){ buf = buf ? buf + " " + p : p; if (buf.split(" ").length >= 10){ merged.push(buf); buf = ""; } }
    if (buf) merged.length ? merged[merged.length-1] += " " + buf : merged.push(buf);
    parts = merged;
  }
  return parts.map(s => s.trim()).filter(Boolean);
}
const wc = s => (String(s).match(/\S+/g) || []).length;

/* ---------- Delivery patterns ---------- */
const FILLERS = [
  {re:/\b(?:um+|uh+|uhm+|erm+|er|ah+|hmm+|mm+)\b/gi, label:"um / uh"},
  {re:/\byou know\b(?! (?:what|how|that|the|if|when|why|where))/gi, label:"you know"},
  {re:/\bi mean\b/gi, label:"I mean"},
  {re:/\bbasically\b/gi, label:"basically"},
  {re:/\bliterally\b/gi, label:"literally"},
  {re:/\bactually\b/gi, label:"actually"},
  {re:/\b(?:kind|sort) of\b(?= (?:like|a|an|the|just|\w+(?:ing|ed)\b))/gi, label:"kind of / sort of"},
  {re:/(?:^|[,.]\s*|\b(?:and|so|but|was|is|it's|were|just|um|uh)\s+)like\b(?!\s+(?:to|the way|this|that|a|an|it|them|him|her|me|us|you|i|we|they)\b)/gi, label:"like"},
  {re:/\bso yeah\b|\byeah so\b/gi, label:"so yeah"},
  {re:/\bor something(?: like that)?\b|\band stuff\b|\band things like that\b|\bor whatever\b|\bblah blah\b/gi, label:"or something / and stuff"},
  {re:/\bright\?/gi, label:"right?"},
  {re:/\bokay so\b|\balright so\b/gi, label:"okay so"},
  {re:/\bpretty much\b/gi, label:"pretty much"},
];
const HEDGES = [
  {re:/\bi think\b/gi, label:"I think"}, {re:/\bi guess\b/gi, label:"I guess"},
  {re:/\bi believe\b/gi, label:"I believe"}, {re:/\bi feel like\b/gi, label:"I feel like"},
  {re:/\bmaybe\b/gi, label:"maybe"}, {re:/\bprobably\b/gi, label:"probably"},
  {re:/\bi'?m not (?:100% |a hundred percent |totally |completely |really )?sure\b|\bnot sure\b/gi, label:"I'm not sure"},
  {re:/\bi don'?t (?:really )?know\b/gi, label:"I don't know"},
  {re:/\bmight be\b|\bcould be\b/gi, label:"might / could be"},
  {re:/\bif (?:that|this) makes sense\b|\bdoes (?:that|this) make sense\b/gi, label:"if that makes sense"},
  {re:/\bhopefully\b/gi, label:"hopefully"}, {re:/\bi would say\b|\bi'd say\b/gi, label:"I'd say"},
  {re:/\bsomewhat\b|\bkinda\b|\bsorta\b/gi, label:"somewhat / kinda"},
];
const WORDING = [
  {re:/\b(?:a lot of|lots of|tons of|a bunch of)\b/gi, from:"a lot of", to:"a number: “three”, “40%”, “$2M”", why:"Vague quantity. Bankers trust numbers."},
  {re:/\bstuff\b|\bthings\b/gi, from:"stuff / things", to:"name the item: “working capital”, “the debt schedule”", why:"Generic nouns sound like you don't know the specific term."},
  {re:/\bgonna\b/gi, from:"gonna", to:"going to / will", why:"Too casual for a superday."},
  {re:/\bwanna\b/gi, from:"wanna", to:"want to", why:"Too casual for a superday."},
  {re:/\bgotta\b/gi, from:"gotta", to:"have to / need to", why:"Too casual for a superday."},
  {re:/\byou guys\b/gi, from:"you guys", to:"your team / the firm", why:"Too casual for an interviewer."},
  {re:/\bobviously\b/gi, from:"obviously", to:"(cut it)", why:"Can sound condescending, and if it were obvious they wouldn't ask."},
  {re:/\bjust\b/gi, from:"just", to:"(cut it)", why:"Minimises what you did or said."},
  {re:/\breally\b|\bvery\b|\bsuper\b/gi, from:"really / very / super", to:"a stronger single word or a number", why:"Intensifiers add length, not meaning."},
  {re:/\btry(?:ing)? to\b/gi, from:"try to", to:"state what you do or did", why:"Signals you didn't follow through."},
  {re:/\bhelped (?:with|out)\b/gi, from:"helped with", to:"a concrete verb: built, led, analysed, drafted", why:"Says nothing about what YOU did."},
  {re:/\bworked on\b/gi, from:"worked on", to:"built / modelled / owned / delivered", why:"Weak verb; it hides your contribution."},
  {re:/\bresponsible for\b/gi, from:"responsible for", to:"what you actually did and the result", why:"Duties aren't results."},
  {re:/\bpassionate\b/gi, from:"passionate", to:"proof: what you did because you cared", why:"Every candidate says it; show it instead."},
  {re:/\bthat'?s a (?:great|good) question\b|\bgreat question\b|\bgood question\b/gi, from:"great question", to:"(start with the answer)", why:"Stalling filler. Interviewers notice."},
  {re:/\bsorry\b/gi, from:"sorry", to:"(drop it; pause, then restate)", why:"Apologising undercuts confidence."},
  {re:/\bto be honest\b|\bhonestly\b|\bto tell (?:you )?the truth\b/gi, from:"honestly", to:"(cut it)", why:"Implies your other answers weren't honest."},
  {re:/\bin order to\b/gi, from:"in order to", to:"to", why:"Same meaning, fewer words."},
  {re:/\bdue to the fact that\b/gi, from:"due to the fact that", to:"because", why:"Same meaning, fewer words."},
  {re:/\bat the end of the day\b/gi, from:"at the end of the day", to:"ultimately / (cut it)", why:"Cliché."},
  {re:/\bgoes away\b|\bdisappears\b/gi, from:"goes away", to:"flows to / is offset by / decreases by $X", why:"Name exactly where it moves on the statements."},
];
const RESTARTS = /\b(?:wait|no wait|let me (?:rephrase|restart|start over|think)|scratch that|actually no|i mean no|hold on|where was i)\b/gi;
const TRAIL = /(?:so yeah|and stuff|or something|i guess|etc\.?|and so on|whatever|yeah)\W*$/i;
const OPENER_WEAK = /^(?:\W*(?:um+|uh+|so+|well|okay|ok|alright|yeah|hmm+|great question|good question|that'?s a (?:great|good) question|basically|i think|i guess|let me think)\b)+/i;

function findAll(text, list){
  const out = [];
  for (const f of list){ f.re.lastIndex = 0; let m; while ((m = f.re.exec(text))){ out.push({i:m.index, len:m[0].length, text:m[0], label:f.label || f.from, rule:f}); if (!f.re.global) break; } }
  return out.sort((a,b)=>a.i-b.i);
}
function repeatedPhrases(text){
  const w = tokens(text).filter(x=>!STOP.has(x));
  const seen = {}, rep = new Set();
  for (let i = 0; i + 3 <= w.length; i++){ const g = w.slice(i,i+3).join(" "); if (/\d/.test(g)) continue; seen[g] = (seen[g]||0)+1; if (seen[g] === 2) rep.add(g); }
  return [...rep];
}

/* ---------- Common factual mistakes (technical) ---------- */
// Each rule: pattern in the normalised answer, optional "unless" (negation
// present nearby means they said it correctly), and the correction.
const NEG = "(?:not|n't|never|no|doesn t|don t|isn t|aren t|won t|cannot|can t)";
const M = (re, fix, opts={}) => ({re: new RegExp(re), fix, ...opts});
const MISTAKES = [
  M("goodwill (?:\\w+ ){0,4}(?:amortiz|gets amortiz|is amortiz)", "Goodwill is NOT amortized under US GAAP. It stays on the balance sheet and is tested for impairment.", {unless:new RegExp("goodwill (?:\\w+ ){0,5}"+NEG+"|"+NEG+" (?:\\w+ ){0,3}amortiz|intangible|private compan|private firms|ifrs|tax purposes|for tax")}),
  M("deferredrevenue (?:\\w+ ){0,4}(?:is|as|counts as)(?: \\w+){0,2} (?:current )?asset", "Deferred revenue is a LIABILITY. The company owes the customer a product or service it was already paid for."),
  M("(?:ar|inventory|prepaid) (?:\\w+ ){0,3}(?:is|are) (?:a |an )?liabilit", "AR, inventory and prepaid expenses are ASSETS."),
  M("(?:ap|accrued) (?:\\w+ ){0,3}(?:is|are) (?:a |an )?(?:current )?asset", "Accounts payable and accrued expenses are LIABILITIES."),
  M("dividend (?:\\w+ ){0,5}(?:(?:on|hit|hits|appears? on|go on|goes on) (?:the )?incomestatement|(?:are|is) tax deductible|reduce (?:\\w+ )?tax|lower (?:\\w+ )?tax)", "Dividends don't touch the income statement and aren't tax-deductible. They hit CFF and retained earnings.", {unless:new RegExp("dividend (?:\\w+ ){0,5}"+NEG+"|preferred dividend|received deduction|corporate investors|"+NEG+" (?:\\w+ ){0,3}(?:incomestatement|tax deductible)")}),
  M("(?:capex|purchase of ppe|buy(?:ing)? ppe) (?:\\w+ ){0,4}(?:on|hits|appears on|goes on|shows up on) (?:the )?incomestatement", "CapEx does NOT go on the income statement. It is in CFI and only hits the income statement over time through depreciation.", {unless:new RegExp("capex (?:\\w+ ){0,6}"+NEG)}),
  M("(?:repay|pay(?:ing)? (?:back|down|off)|issu\\w*) (?:\\w+ ){0,3}debt (?:principal )?(?:\\w+ ){0,3}(?:on|hits|appears on) (?:the )?incomestatement", "Issuing or repaying debt principal never hits the income statement. Only interest expense does.", {unless:new RegExp(NEG+" (?:\\w+ ){0,4}incomestatement")}),
  M("interest (?:expense )?(?:\\w+ ){0,2}(?:is )?"+NEG+" (?:\\w+ )?tax deductible", "Interest expense IS tax-deductible. That's the tax shield on debt.", {unless:/no longer|if (?:\w+ ){0,4}(?:were|was|is)|suppose|assume|weren t|limit|cap on|above|beyond|excess/}),
  M("(?:depreciation|da) (?:\\w+ ){0,3}(?:is|as)(?: \\w+){0,2} cash (?:expense|cost|charge|item|outflow)", "Depreciation is a NON-cash expense. It only affects cash through the lower tax bill.", {unless:new RegExp(NEG+" (?:\\w+ ){0,2}cash|non ?cash")}),
  M("precedents (?:\\w+ ){0,4}(?:lowest|lower|cheapest|smallest)", "Precedent transactions usually give the HIGHEST value because they include a control premium.", {unless:new RegExp("precedents (?:\\w+ ){0,4}"+NEG)}),
  M("wacc (?:\\w+ ){0,8}book (?:value|weights)", "Use MARKET values (not book values) for the WACC weights.", {unless:new RegExp(NEG+" (?:\\w+ ){0,3}book|instead of book|rather than book")}),
  M("(?:higher|increase\\w*|rais\\w*) (?:\\w+ ){0,2}(?:wacc|discount rate) (?:\\w+ ){0,6}(?:higher|increase\\w*|rais\\w*|more) (?:\\w+ ){0,2}(?:valuation|value|price|ev|dcf)", "A higher WACC / discount rate LOWERS the present value, so valuation goes DOWN.", {group:"wacc", unless:/outweigh|offset|despite|even though|net effect|cash flows? (?:\w+ ){0,3}(?:higher|increase)/}),
  M("(?:leverage|more debt) (?:\\w+ ){0,4}(?:lower|reduce|decrease|hurt)\\w* (?:\\w+ ){0,2}(?:irr|returns)", "More leverage usually INCREASES IRR because the equity check is smaller (with more risk).", {unless:/too much|interest (?:\w+ )?(?:exceed|too high)|default/}),
  M("buyer\\w* (?:\\w+ ){0,3}(?:lower|smaller) pe (?:\\w+ ){0,6}accretive", "In an all-stock deal, it's accretive when the BUYER's P/E is HIGHER than the seller's."),
  M("terminalvalue (?:\\w+ ){0,5}(?:small|tiny|minor|little) (?:portion|part|percent|share)", "Terminal value is usually the MAJORITY of a DCF, often 60–80% of the total."),
  M("beta (?:\\w+ ){0,4}(?:total|overall|all) (?:\\w+ )?risk", "Beta measures SYSTEMATIC (market) risk, not total risk."),
  M("treasury (?:\\w+ ){0,14}(?:is|as|sits as) (?:an |a )?(?:positive )?asset", "Treasury stock is a CONTRA-EQUITY account (negative in shareholders' equity), not an asset."),
  M("dtl (?:\\w+ ){0,6}(?:has paid|paid|have paid) (?:\\w+ )?(?:more|too much|higher)", "A DTL means the company has paid LESS tax than its book tax expense; it pays more later.", {unless:/later|future|revers|make up|decreas|unwind|eventually/}),
  M("(?:ebitda) (?:\\w+ ){0,2}(?:is|equals|same as|=) (?:\\w+ )?(?:cash flow|fcf|cfo)", "EBITDA is NOT cash flow. It ignores CapEx, working capital, interest and taxes.", {unless:new RegExp(NEG+" (?:\\w+ ){0,2}(?:cash|fcf)|proxy|rough")}),
  M("sbc (?:\\w+ ){0,3}(?:is|as)(?: \\w+){0,2} cash (?:expense|cost)", "Stock-based compensation is a NON-cash expense, added back on the CFS (though it dilutes shareholders).", {unless:new RegExp(NEG+" (?:\\w+ ){0,2}cash|non ?cash|treat|prefer|econom|dilut|conservativ|some (?:\\w+ )?(?:argue|people|analysts)")}),
  M("(?:netincome) (?:\\w+ ){0,3}(?:top|first) (?:line|item) (?:\\w+ ){0,3}(?:balancesheet)", "Net income flows to the top of the CFS and into retained earnings on the balance sheet, not to the top of the balance sheet."),
  M("balancesheet (?:\\w+ ){0,6}(?:over a period|over (?:a|the) (?:year|quarter)|period of time)|incomestatement (?:\\w+ ){0,6}(?:point in time|snapshot|single point|specific date)", "The income statement covers a PERIOD (a quarter or year). The balance sheet is a snapshot at a single POINT in time.", {unless:new RegExp(NEG)}),
  M("assets (?:\\w+ ){0,2}(?:equal|=|is|are) (?:\\w+ ){0,1}liabilities (?:minus|less) (?:\\w+ )?(?:shequity|equity)", "Assets = Liabilities + Shareholders' Equity, not minus."),
  M("cfs (?:\\w+ ){0,4}(?:starts|begins|start|begin) (?:\\w+ ){0,3}(?:cash balance|beginning cash|balancesheet|revenue)", "The cash flow statement STARTS with net income, then adjusts for non-cash items and working capital.", {unless:/netincome/}),
  M("(?:subtract|minus|deduct|take out|remove)\\w* (?:\\w+ ){0,3}(?:da|depreciation|sbc|amortization) (?:\\w+ ){0,6}(?:cfs|cfo|cash flow)|(?:cfs|cfo|cash flow) (?:\\w+ ){0,6}(?:subtract|minus|deduct|take out)\\w* (?:\\w+ ){0,2}(?:da|depreciation|amortization|sbc)\\b", "On the cash flow statement you ADD BACK depreciation, amortization and other non-cash expenses. You don't subtract them.", {unless:/add (?:\w+ ){0,3}back|added back|adds? (?:it|them|this|that) back|mandatory|debt amortization|principal|lfcf|levered/}),
  M("(?:inventory|dividend|capex|ar|ap) (?:is|are|goes|go|appears?|shows? up|is recorded|are recorded|is a line|line item) (?:\\w+ ){0,2}(?:on|in) (?:the )?incomestatement", "Inventory, AR and AP are balance sheet items, CapEx is in investing and dividends are in financing. None of them are income statement lines.", {unless:new RegExp(NEG+" (?:\\w+ ){0,4}incomestatement|cogs|expens|writ|impair|bad debt|allowance|change in|preferred")}),
  M("capex (?:is|are|goes|go|belongs|appears|shows up|falls) (?:\\w+ ){0,3}(?:in |under )(?:the )?(?:operating activities|cfo)|(?:da|depreciation) (?:is|are|goes|go|belongs|appears|shows up|falls) (?:\\w+ ){0,3}(?:in |under )(?:the )?(?:investing activities|cfi)", "CapEx belongs in cash flow from INVESTING. Depreciation is a non-cash add-back in OPERATING.", {unless:new RegExp(NEG)}),
  M("(?:higher|increas\\w*|rais\\w*|more) (?:\\w+ ){0,2}(?:wacc|discount rate) (?:\\w+ ){0,8}(?:(?:raise|increase|boost)\\w* (?:\\w+ ){0,2}(?:valuation|value|price|ev|dcf)|(?:valuation|value|price|ev) (?:\\w+ ){0,2}(?:goes up|go up|increase\\w*|rise\\w*|higher)|more valuable|worth more)", "A higher WACC or discount rate LOWERS present value, so the valuation goes DOWN.", {unless:new RegExp(NEG+" (?:\\w+ ){0,3}(?:raise|increase|higher)|outweigh|offset|despite|even though|net effect|cash flows? (?:\\w+ ){0,3}(?:higher|increase)")}),
  M("(?:sum|add up|adding up|total) (?:\\w+ ){0,6}(?:unlevered|ufcf) (?:\\w+ ){0,8}(?:gives|get|is|equals) (?:\\w+ ){0,2}equityvalue", "Discounting UNLEVERED free cash flow (at WACC) gives ENTERPRISE value. You get equity value by discounting levered FCF at the cost of equity, or by bridging from EV."),
  M("terminalvalue (?:\\w+ ){0,8}divided by (?:the )?growth(?: rate)?\\b(?! (?:\\w+ ){0,2}(?:minus|less))", "Gordon Growth: Terminal Value = Final-year FCF × (1 + g) ÷ (Discount Rate − g). You divide by the discount rate MINUS growth, not by growth alone."),
  M("(?:more|higher|additional|adding|extra) (?:\\w+ )?(?:leverage|debt) (?:\\w+ ){0,4}(?:reduces?|lowers?|decreases?) (?:\\w+ ){0,2}risk", "More leverage INCREASES risk (more interest to cover, higher chance of default). It boosts returns because the equity check is smaller.", {unless:new RegExp(NEG+" (?:\\w+ ){0,3}(?:reduce|lower)|holders|lenders|creditors")}),
  M("(?:exit|sell|hold) (?:\\w+ ){0,5}(?:1[0-9]|20|25|30) (?:to (?:\\w+ )?)?years?", "PE firms usually exit an LBO in 3–7 years (often 5), not after 10+ years.", {when:/lbo|private equity|pe firm|sponsor/}),
  M("(?:all ?equity|no debt|100 percent equity|unlevered compan\\w*) (?:\\w+ ){0,8}wacc (?:\\w+ ){0,3}(?:equal|is|=|same as) (?:\\w+ ){0,2}costdebt", "With no debt, WACC equals the COST OF EQUITY, not the cost of debt."),
  M("(?:debt|costdebt) (?:\\w+ ){0,4}(?:is|are) (?:\\w+ ){0,1}(?:more expensive|costlier|a higher cost) (?:\\w+ ){0,3}than (?:\\w+ )?(?:equity|costequity)", "Debt is usually CHEAPER than equity: lenders are paid first and interest is tax-deductible.", {unless:/distress|too much|at (?:very )?high leverage|bankrupt|now|if |when rates|higher rates/}),
  M("netincome (?:\\w+ ){0,4}(?:flows?|goes|links?) (?:\\w+ ){0,2}(?:into|to) (?:\\w+ ){0,1}assets", "Net income flows into RETAINED EARNINGS (shareholders' equity), and to the top of the cash flow statement. It doesn't flow into assets directly."),
  M("(?:ending|end of (?:the )?period) cash (?:\\w+ ){0,4}(?:to|into|on) (?:the )?incomestatement", "Ending cash from the cash flow statement becomes CASH on the balance sheet, not an income statement line."),
  M("(?:there are no|there s no|there is no|it has no|no real|zero|aren t any|isn t any) (?:real |major |big |significant )?risks?\\b", "Every pitch or investment has risks. Name the 2–3 that would make you wrong and how you'd watch for them.", {when:/pitch|recommend|stock|invest in|would you buy/}),
  M("(?:high|higher|expensive|premium) (?:\\w+ ){0,3}(?:pe|multiple|valuation) (?:\\w+ ){0,5}(?:undervalued|cheap|bargain)", "A HIGH P/E or multiple means the market already prices in a lot of growth. That's a reason it could be overvalued, not proof it's cheap."),
  M("(?:common stock|apic) (?:\\w+ ){0,8}current market value|(?:common stock|apic) (?:\\w+ ){0,8}(?:goes up|rises|increases|changes) (?:\\w+ ){0,3}(?:every time|whenever|when|as|with) (?:\\w+ ){0,2}(?:stock|share) price", "Common Stock & APIC record what investors paid when the shares were ISSUED. They don't change when the share price moves.", {unless:new RegExp(NEG+"|at (?:the )?time|when (?:they were |it was )?issued|at issuance")}),
  M("cash (?:basis|accounting) (?:\\w+ ){0,6}(?:when (?:it is |it s )?earned|regardless of (?:payment|cash|when))|accrual (?:\\w+ ){0,6}when (?:the )?(?:cash|payment) (?:is )?(?:received|collected)", "Accrual accounting records revenue when it's EARNED, regardless of payment. Cash accounting records it when cash is received."),
  M("(?:debt|leverage|borrow\\w*|raise\\w*) (?:\\w+ ){0,10}(?:1[0-9]|20) (?:to (?:1[0-9]|20) )?(?:times|x) (?:\\w+ )?ebitda", "Typical LBO debt is about 4–7× EBITDA, set by Debt/EBITDA and interest coverage, not 10× or more.", {when:/lbo|leverag|private equity|sponsor|debt can be raised/, unless:/purchase|multiple|valu|ev |paid|price/}),
  M("(?:fund|financ|pay for)\\w* (?:\\w+ ){0,6}(?:8[5-9]|9[0-9]|100) percent (?:\\w+ ){0,4}debt|(?:8[5-9]|9[0-9]|100) percent (?:of (?:the )?(?:purchase )?price )?(?:\\w+ )?(?:with |in |from )?debt", "LBOs are usually funded with roughly 50–70% debt. Lenders cap it by Debt/EBITDA and coverage ratios.", {when:/lbo|private equity|sponsor|debt can be raised/, unless:/add on|acquisition|refinanc|existing/}),
  M("mezzanine (?:\\w+ ){0,5}(?:senior|first|ahead of|before) (?:\\w+ ){0,3}(?:term loans?|bank debt|senior)", "Mezzanine debt is JUNIOR to senior term loans: it's repaid later, so it's riskier and costs more."),
  M("add (?:\\w+ ){0,2}back (?:\\w+ ){0,4}after ?tax (?:amount|portion|value)", "You add back the FULL pre-tax non-cash expense on the cash flow statement. The cash benefit is the tax savings."),
  M("(?:da|depreciation|amortization) (?:\\w+ ){0,4}(?:generates?|creates?|produces?|brings in) (?:\\w+ )?cash", "Depreciation doesn't generate cash. It's non-cash; the only cash effect is the lower tax bill.", {unless:new RegExp(NEG+" (?:\\w+ ){0,3}(?:generate|create|produce)")}),
  M("guarante\\w* (?:\\w+ ){0,4}(?:return|upside|go up|double|percent)", "Never 'guarantee' a return. Give a target with the assumptions behind it and what would make you wrong."),
];

/* ---------- EV bridge: signs of debt / cash relative to the direction ---------- */
// "EV = equity value + debt − cash" and "equity value = EV − debt + cash" are both
// right; the sign of cash or debt is only wrong relative to which side you start from.
function bridgeErrors(norm){
  const t = norm.split(" "), out = new Set();
  const SIGN = {plus:1, add:1, adding:1, adds:1, added:1, minus:-1, subtract:-1, subtracting:-1, subtracts:-1, less:-1, deduct:-1, deducting:-1};
  const OP = x => x === "ev" || x === "equityvalue";
  for (let i = 0; i < t.length; i++){
    if (!["cash","debt","preferred","nci"].includes(t[i])) continue;
    // the sign word right before the item ("minus cash", "minus net debt", "add back debt")
    let sign = 0;
    for (let j = i-1; j >= Math.max(0, i-3); j--){ if (SIGN[t[j]]){ sign = SIGN[t[j]]; break; } if (["cash","debt","preferred","nci"].includes(t[j])) break; }
    if (!sign) continue;
    const ctx = t.slice(Math.max(0, i-14), i).join(" ");
    let start = null;
    const fromTo = ctx.match(/from (?:the )?(ev|equityvalue) to (?:the )?(ev|equityvalue)/);
    const toGet = ctx.match(/to get (?:to |from )?(?:the )?(ev|equityvalue)\b/);
    const eq = [...ctx.matchAll(/\b(ev|equityvalue) (?:is|equals|would be|comes out to|=)?\s?(?:just |basically )?(?:the )?(ev|equityvalue)\b/g)].filter(m => m[1] !== m[2]).pop();
    if (fromTo && fromTo[1] !== fromTo[2]) start = fromTo[1];
    else if (eq) start = eq[2];
    else if (toGet) start = toGet[1] === "ev" ? "equityvalue" : "ev";
    else {
      // Only a clear "EV minus debt…" / "equity value plus debt…" counts; "for EV, … subtract cash" is ambiguous.
      for (let j = i-1; j >= Math.max(0, i-10); j--) if (OP(t[j])){ if (SIGN[t[j+1]] || SIGN[t[j+2]] || /^(?:take|start with|starting)$/.test(t[j-1]||"")) start = t[j]; break; }
    }
    if (!start) continue;
    const target = start === "equityvalue" ? "ev" : "equityvalue";
    const want = start === "equityvalue" ? (t[i] === "cash" ? -1 : 1) : (t[i] === "cash" ? 1 : -1);
    if (sign !== want){
      out.add(target === "ev"
        ? "Equity value → Enterprise value: ADD debt, preferred stock and noncontrolling interest, SUBTRACT cash."
        : "Enterprise value → Equity value: SUBTRACT debt, preferred stock and noncontrolling interest, ADD cash.");
    }
  }
  return [...out];
}

/* ---------- Yes / no questions: does the answer take the key's side? ---------- */
const YN_Q = /^\s*(?:could|can|is|does|do|would|should|will|are|was|were|has|have|did)\b/i;
const NEG_WORD = /\b(?:no|not|never|cannot|can't|cant|don't|dont|doesn't|doesnt|isn't|isnt|shouldn't|wouldn't|won't|aren't)\b/i;
function polarity(text, words){
  const head = String(text).toLowerCase().replace(/^\W*(?:um+|uh+|so|well|okay|ok|yeah)\W+/,"").split(/\s+/).slice(0, words).join(" ");
  if (/^(?:yes|yeah|yep|it can|it could|they can|you can|it does|absolutely|definitely|correct|sure)\b/.test(head)) return 1;
  if (/^(?:no|nope|not really|it can't|it cannot|never|you don't|you shouldn't|it doesn't)\b/.test(head)) return -1;
  return 0;
}
function yesNoError(q, answer){
  if (!YN_Q.test(q.q) || /\bor\b/i.test(q.q.split(/[?]/)[0].slice(-60))) return null;
  const k0 = String((q.k || [])[0] || "");
  let kp = polarity(k0, 6);
  if (!kp) kp = /^(?:\w+\s){0,8}?(?:could|can|may|might) (?:be|have|go)\b/i.test(k0) && !NEG_WORD.test(k0.split(/\s+/).slice(0,10).join(" ")) ? 1
             : NEG_WORD.test(k0.split(/\s+/).slice(0,6).join(" ")) ? -1 : 0;
  const ap = polarity(answer, 6);
  if (!kp || !ap || kp === ap) return null;
  return `You answered "${ap > 0 ? "yes" : "no"}", but the correct answer is ${kp > 0 ? "yes" : "no"}: ${k0.replace(/\s+/g," ").slice(0, 160)}`;
}

/* ---------- Final-number check for math questions ---------- */
function numsIn(text){ return (normalize(text).match(/\b\d+(?:\.\d+)?\b(?! percent)/g) || []).map(Number); }
function mathError(q, answer){
  const qNums = new Set(numsIn(q.q));
  if (!qNums.size) return null;                       // only for questions that give numbers
  const keyText = (q.k || []).join(" ");
  const keyNums = numsIn(keyText).filter(n => !qNums.has(n) && n !== 0);
  if (!keyNums.length) return null;
  // The result is in the key's last point; any number from it counts (keys often give "≈30%" and "2.7x").
  const allNums = t => (normalize(t).match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number);
  const last = String((q.k || []).slice(-1)[0] || "");
  const afterEq = last.includes("=") ? last.slice(last.lastIndexOf("=")) : last;
  const lastNums = allNums(afterEq).filter(n => !qNums.has(n) && n !== 0);
  if (!lastNums.length) return null;
  const finalNum = lastNums[lastNums.length - 1];
  const ans = allNums(answer);
  const near = n => ans.some(a => Math.abs(a - n) <= Math.max(0.011 * Math.abs(n), 0.05));
  if (near(finalNum)) return null;
  const own = ans.filter(a => !qNums.has(a) && !keyNums.includes(a));
  if (!own.length) return null;                       // they gave no number of their own to judge
  return `Check your math: the answer works out to ${finalNum} (${String((q.k||[]).slice(-1)[0]||"").replace(/\s+/g," ").slice(0,140)}).`;
}

/* ---------- Direction / number checks against the key ---------- */
const ITEM_TOKS = ["netincome","cash","ar","ap","inventory","ppe","accrued","deferredrevenue","debt","retainedearnings","shequity","apic","ebit","pretax","tax","taxes","revenue","cogs","da","dtl","dta","goodwill","assets","liabilities","eps","ev","equityvalue","wacc","irr","fcf","cfo","cfi","cff","interestexpense","prepaid","sbc"];
const DIR_FLAT = /^(?:unchanged|unaffected|flat|same|stays|constant|neutral)$/;
function dirFacts(toks){
  // (item, direction, number) triples: "netincome down 6", "cash up 4", "ev unchanged"
  const out = [];
  for (let i = 0; i < toks.length; i++){
    if (!ITEM_TOKS.includes(toks[i])) continue;
    let dir = null, num = null;
    for (let j = i+1; j < Math.min(toks.length, i+5); j++){
      const t = toks[j];
      if (ITEM_TOKS.includes(t) || /^(?:and|but|while|so|because|which|since|then|cfs|incomestatement|balancesheet)$/.test(t) && j > i+1) break;
      if (/^(?:add|adds|added|adding)$/.test(t) && toks[j+1] === "back") break;   // "add back" isn't a direction
      if (/^(?:not|no|doesn|don|never|isn)$/.test(t)) { if (/^(?:change|move|affect|impact)/.test(toks[j+1]||"") || /^(?:change|move)/.test(toks[j+2]||"")) dir = "flat"; break; }
      if (!dir && DIR_UP.test(t)) dir = "up";
      else if (!dir && DIR_DOWN.test(t)) dir = "down";
      else if (!dir && DIR_FLAT.test(t)) dir = "flat";
      else if (num === null && /^\d+(?:\.\d+)?$/.test(t) && toks[j+1] !== "percent") num = t;
      if (dir && num !== null) break;
    }
    if (dir || num !== null) out.push({item:toks[i], dir, num});
  }
  return out;
}
const NICE = {netincome:"Net Income", cash:"Cash", ar:"AR", ap:"AP", inventory:"Inventory", ppe:"PP&E", accrued:"Accrued Expenses", deferredrevenue:"Deferred Revenue", debt:"Debt", retainedearnings:"Retained Earnings", shequity:"Shareholders' Equity", apic:"Common Stock & APIC", ebit:"Operating Income", pretax:"Pre-Tax Income", tax:"Taxes", taxes:"Taxes", revenue:"Revenue", cogs:"COGS", da:"D&A", dtl:"DTL", dta:"DTA", goodwill:"Goodwill", assets:"Assets", liabilities:"Liabilities", eps:"EPS", ev:"Enterprise Value", equityvalue:"Equity Value", wacc:"WACC", irr:"IRR", fcf:"FCF", cfo:"Cash Flow from Operations", cfi:"Cash Flow from Investing", cff:"Cash Flow from Financing", interestexpense:"Interest Expense", prepaid:"Prepaid Expenses", sbc:"SBC"};
function factChecks(q, answer){
  const keyText = (q.k || []).join(". ");
  const kf = dirFacts(tokens(keyText)), af = dirFacts(tokens(answer));
  const wrong = [];
  const keyBy = {};
  kf.forEach(f => { (keyBy[f.item] = keyBy[f.item] || []).push(f); });
  const ansDirs = {}, ansNums = new Set(numsIn(answer).map(String));
  af.forEach(f => { if (f.dir) (ansDirs[f.item] = ansDirs[f.item] || new Set()).add(f.dir); });
  const said = d => d === "flat" ? "doesn't change" : `goes ${d}`;
  for (const a of af){
    const ks = keyBy[a.item]; if (!ks) continue;
    // Only flag when every key mention agrees, the answer contradicts it, and the
    // answer never also states the key's direction for that item.
    const dirs = [...new Set(ks.map(k=>k.dir).filter(Boolean))];
    if (a.dir && dirs.length === 1 && dirs[0] !== a.dir && !ansDirs[a.item].has(dirs[0])){
      const k = ks.find(k=>k.dir);
      wrong.push(`You said ${NICE[a.item]||a.item} ${said(a.dir)}. It ${said(k.dir)}${k.num && k.dir !== "flat" ? ` by ${k.num}` : ""}.`);
      continue;
    }
    const nums = [...new Set(ks.map(k=>k.num).filter(n=>n!==null))];
    if (a.num !== null && nums.length === 1 && nums[0] !== a.num && !ansNums.has(nums[0]) && a.dir && dirs[0] === a.dir && Number(a.num) > 0 && Number(nums[0]) > 0){
      wrong.push(`Check your number: you said ${NICE[a.item]||a.item} ${said(a.dir)} by ${a.num}. It should be ${nums[0]}.`);
    }
  }
  return [...new Set(wrong)];
}

/* ---------- Behavioral checks ---------- */
const STORY_Q = /tell me about a time|describe a (?:time|situation)|give (?:me )?an example|example of a time|walk me through a time|a time when|have you ever|biggest (?:challenge|failure|mistake|accomplishment)|proudest|most difficult|toughest/i;
function behavioralChecks(q, answer, norm){
  const out = {flags:[], star:null, praise:[]};
  const qq = q.q.toLowerCase();
  const isStory = STORY_Q.test(q.q);
  if (isStory){
    const s = {
      situation: /\b(?:when i was|while i was|last (?:year|summer|semester|spring|fall|month|week)|during (?:my|the|our|a)|at (?:my|a|the) (?:\w+ )?(?:internship|job|firm|company|club|school|university|bank|restaurant|store|team)|in my (?:\w+ ){0,2}(?:role|job|internship|club|team|class|course|group|year|semester|organization|fraternity|sorority|chapter|company)|in (?:a|our|the) (?:\w+ ){0,2}(?:class|course|club|team|group project|competition|internship)|back in|in 20\d\d|my (?:freshman|sophomore|junior|senior|first|second) year|this (?:past )?(?:summer|semester|year)|as (?:a|the) (?:\w+ ){0,2}(?:treasurer|president|captain|intern|analyst|member|lead|leader|manager|tutor|server|cashier|associate|founder|chair))\b/i.test(answer),
      task: /\b(?:my (?:role|job|task|goal|responsibility)|i was (?:responsible|tasked|asked|in charge|supposed)|(?:we|i) needed to|(?:we|i) had to|the (?:goal|problem|challenge|issue|deadline|risk|stakes?) (?:was|were|is)|had (?:a|an|the) (?:\w+ ){0,2}(?:deadline|goal|target)|deadline|due (?:in|on|by)|at stake|we were (?:behind|stuck|losing|short)|(?:work|project|progress) (?:stalled|slipped)|disagreed|conflict)\b/i.test(answer),
      action: (answer.match(/\bi (?:then |also |first |quickly |personally )?(?!(?:learned|realized|realised|felt|thought|wanted|liked|loved|was|had|knew|think|guess|noticed|got|needed|hoped|wished|enjoyed|found|saw|heard|became|seemed|tended|used)\b)(?:\w+ed|built|made|took|wrote|led|met|spoke|ran|set|split|broke|sent|drew|chose|began|brought|caught|taught|sought|kept|told|gave|went|did|put|cut|stepped|reached|rebuilt|rewrote|stood)\b/gi) || []).length,
      result: /\b(?:as a result|in the end|ended up|result(?:ed)? (?:was|in)|outcome|we (?:won|finished|delivered|raised|grew|cut|saved|hit|closed|placed|got|beat|met|launched|signed)|which (?:led|meant)|(?:placed|finished) (?:first|second|third|\d)|increased|decreased|reduced|saved|grew|improved|on time|early|ahead of|\d+ ?(?:%|percent)|\$ ?\d|\d+ (?:out of|of) \d+)/i.test(answer),
      lesson: /\b(?:i learned|taught me|lesson|takeaway|now i|since then|going forward|next time|i realized|i realised|i've learned|from then on|ever since|what i took away)\b/i.test(answer),
    };
    out.star = s;
    if (!s.situation) out.flags.push({sev:2, title:"Set the scene in one line", body:"Open with where and when (\"Last spring, as treasurer of…\"). Without it the story floats."});
    if (!s.task) out.flags.push({sev:2, title:"State the stakes or your goal", body:"Say what had to happen and why it mattered. That's what makes the action impressive."});
    if (s.action < 2) out.flags.push({sev:3, title:"Show what YOU did", body:"Use 2–3 \"I + strong verb\" actions (\"I rebuilt the schedule\", \"I called each member\"). This is the part interviewers score."});
    if (!s.result) out.flags.push({sev:3, title:"Land a concrete result", body:"Finish with an outcome, ideally a number: \"we raised $4,000\", \"cut turnaround from 5 days to 2\"."});
    if (!s.lesson && /fail|mistake|weak|conflict|challenge|wrong/i.test(qq)) out.flags.push({sev:2, title:"Close with the lesson", body:"For failure and conflict questions, end with what you changed afterwards and proof it stuck."});
    const iCount = (answer.match(/\bi\b/gi)||[]).length, weCount = (answer.match(/\bwe\b/gi)||[]).length;
    if (weCount > iCount && weCount >= 4) out.flags.push({sev:2, title:"Too much \"we\", not enough \"I\"", body:`You said "we" ${weCount}× and "I" ${iCount}×. Credit the team once, then own your actions with "I".`});
    if (s.action >= 2 && s.result) out.praise.push("Clear actions and a result. That's the core of a good story.");
  }
  if (/\b(?:lazy|stupid|idiot|incompetent|useless|annoying|hated|his fault|her fault|their fault|didn'?t do anything|did nothing|blame)\b/i.test(answer))
    out.flags.push({sev:3, title:"Don't blame or criticise others", body:"Negativity about a teammate reads as a red flag. Describe the situation neutrally and focus on what you did."});
  const MONEY = /\b(?:the money|for (?:the )?money|salary|salaries|pay(?:s|ing)? (?:well|a lot)|(?:the )?pay is (?:\w+ )?good|compensation|bonus(?:es)?|get rich|prestig\w*|brand (?:name )?opens doors|exit opp\w*|make (?:around |about )?\d+ ?(?:k|thousand|grand)?)\b/i;
  const motiveQ = /why (?:investment banking|ib|banking|finance)|why do you want to|why this (?:role|job)|about yourself|your (?:resume|background)|what (?:drew|led|brought) you/i.test(qq);
  if ((motiveQ && /\b(?:money|rich)\b/i.test(answer)) || MONEY.test(answer))
    out.flags.push({sev:3, title:"Money, prestige or exit opps", body:"Leave them out. Lead with the learning curve, deal exposure and a real experience that pulled you in."});
  if (/five years|5 years|long[- ]term|future goals|career goals/i.test(qq) && /\b(?:private equity|hedge fund|buy[- ]side|business school|mba|start (?:my own|a) (?:company|business)|leave)\b/i.test(answer))
    out.flags.push({sev:2, title:"Don't signal you'll leave", body:"Mentioning PE, a hedge fund or business school suggests you're using banking as a stepping stone. Talk about growing into associate-level work."});
  if (/weakness/i.test(qq)){
    if (/\b(?:perfectionist|work too hard|care too much|too detail|too dedicated|overachiev|too hard on myself)\b/i.test(answer))
      out.flags.push({sev:3, title:"That's a disguised strength", body:"\"Perfectionist\" and \"I work too hard\" are the answers interviewers hear most and trust least. Pick a real, fixable weakness."});
    if (/\b(?:attention to detail|careless|excel|math|numbers|time management|deadlines|organi[sz]ation|work ethic)\b/i.test(answer) && !/\bimprov|working on|fixed|now i\b/i.test(answer))
      out.flags.push({sev:3, title:"Weakness hits a core banking skill", body:"Detail, Excel, deadlines and work ethic are the job. If you use one, show the system you built that fixed it."});
    if (!/\b(?:improv|working on|i now|now i|started|began|use|built|system|habit|checklist|since then)\b/i.test(answer))
      out.flags.push({sev:2, title:"Show the fix", body:"After naming the weakness, spend most of the answer on the concrete steps you took and the evidence it's improving."});
  }
  if (/why (?:our|this) (?:bank|firm|company)|why (?:us|here)/i.test(qq)){
    if (/\b(?:great culture|good culture|prestig|best bank|top bank|great reputation|reputation|big name|well known)\b/i.test(answer) && !/\b(?:spoke|talked|met|coffee|call|chat)\b/i.test(answer))
      out.flags.push({sev:3, title:"Too generic for \"why us\"", body:"\"Great culture\" and \"reputation\" fit any bank. Name a group, a recent deal and a person you spoke with."});
    if (!/\b(?:spoke|talked|met|coffee|call|chat|conversation)\b/i.test(answer))
      out.flags.push({sev:2, title:"Mention who you spoke with", body:"\"When I spoke with [name] in the industrials group…\" is the strongest signal of genuine interest."});
  }
  if (/about yourself|walk me through your (?:resume|background)/i.test(qq)){
    if (!/\b(?:why|that'?s why|which is why|led me|brought me|now i'?m|today|here|this role|banking)\b/i.test(answer.slice(-220)))
      out.flags.push({sev:2, title:"End on why you're here", body:"Your story should finish with what brought you to banking and to this interview."});
  }
  if (/deal|transaction|acquisition/i.test(qq) && /follow|recent|tell me about a deal/i.test(qq)){
    const need = [[/\b(?:billion|million|\$|\bbn\b|\d)/i,"the deal size"],[/\b(?:multiple|x ebitda|times|premium)\b/i,"the multiple or premium"],[/\b(?:synerg|rationale|because|strategic|why)\b/i,"the strategic rationale"],[/\b(?:risk|concern|downside|worry|challenge)\b/i,"a risk"]];
    const miss = need.filter(([re]) => !re.test(answer)).map(x=>x[1]);
    if (miss.length) out.flags.push({sev:2, title:"Add the deal facts", body:"A strong deal answer includes " + miss.join(", ") + "."});
  }
  return out;
}

/* ---------- Model answer from the key ---------- */
function modelAnswer(q, points){
  if (!points.length) return "";
  const beh = q.t === "beh";
  const lines = points.map(p => p.text.replace(/\s+/g," ").replace(/[;]\s*/g,", ").replace(/\.$/,""));
  if (beh) return lines.map(l => "• " + l).join("\n");
  const joiners = ["", "Then ", "Next, ", "On top of that, ", "Also, ", "Finally, "];
  return lines.map((l,i) => {
    const j = i === 0 ? "" : i === lines.length-1 && lines.length > 2 ? "Finally, " : joiners[Math.min(i, joiners.length-2)];
    const body = j ? l.charAt(0).toLowerCase() + l.slice(1) : l;
    return (j + (/^[A-Z]{2,}/.test(l) ? l : body)) + ".";
  }).join(" ");
}

/* ---------- Tightened version of their own answer ---------- */
function tighten(answer){
  let s = " " + answer + " ";
  const cut = [/\b(?:um+|uh+|uhm+|erm+|er|ah+|hmm+)\b[,.]?/gi, /\byou know,?\s/gi, /\bi mean,?\s/gi, /\bbasically,?\s/gi, /\bliterally\s/gi, /\bactually,?\s/gi,
               /\b(?:kind|sort) of\s/gi, /,?\s*like,\s/gi, /\bso yeah\b[,.]?/gi, /\s*(?:or something(?: like that)?|and stuff|and things like that|or whatever)\b/gi,
               /\bpretty much\s/gi, /\bi think (?:that )?/gi, /\bi guess,?\s/gi, /\bi feel like\s/gi, /\bjust\s/gi, /\b(?:really|very|super)\s(?=\w)/gi,
               /\b(?:that'?s a (?:great|good) question|great question|good question)[,.!]?\s*/gi, /\bto be honest,?\s|\bhonestly,?\s/gi, /,?\s*if (?:that|this) makes sense\??/gi, /\bobviously,?\s/gi,
               /^\s*(?:so|okay so|well|alright),?\s/i, /\bokay so,?\s/gi, /,?\s*\b(?:and )?yeah\b,?(?: so\b)?/gi, /,?\s*\bi'?m not (?:really |totally )?sure\b,?/gi];
  for (const re of cut) s = s.replace(re, " ");
  s = s.replace(/\bin order to\b/gi,"to").replace(/\bdue to the fact that\b/gi,"because").replace(/\bgonna\b/gi,"going to").replace(/\bwanna\b/gi,"want to")
       .replace(/\s+([,.!?])/g,"$1").replace(/([,.]){2,}/g,"$1").replace(/\s{2,}/g," ").trim();
  return s.replace(/(^|[.!?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase());
}

/* ---------- Main ---------- */
function clamp(x, a=0, b=10){ return Math.max(a, Math.min(b, x)); }
function analyze(q, answer, seconds){
  answer = String(answer || "").trim();
  const beh = q.t === "beh";
  const words = wc(answer);
  const target = q.s || 60;                      // seconds
  const targetWords = Math.round(target * 2.2);  // ~130 wpm with natural pauses
  const lenRatio = words / targetWords;
  const secs = seconds && seconds >= 5 ? seconds : null;
  const wpm = secs ? Math.round(words / (secs / 60)) : null;
  const sents = sentences(answer);
  const norm = normalize(answer);
  const ansToks = sigTokens(answer);

  /* content */
  const points = keyPoints(q).map(p => beh ? {...p, toks: p.toks.filter(t => !META.has(t))} : p).filter(p => p.toks.length);
  const cov = coverage(points, ansToks, answer).map(p => {
    if (p.byConcept) return p;
    if (!beh) return p;
    // guidance points are satisfied loosely
    const status = p.ratio >= 0.34 ? "hit" : p.ratio >= 0.15 ? "partial" : "miss";
    return {...p, status};
  });
  const contentRatio = cov.length ? cov.reduce((s,p)=>s + (p.status==="hit"?1:p.status==="partial"?0.5:0), 0) / cov.length : null;

  /* accuracy */
  const corrections = [], said = {};
  // Quote the sentence of theirs that a correction is about, so they can see what to change.
  const sentNorm = sentences(answer).map(s => ({s, n: normalize(s)}));
  const quote = frag => { if (!frag) return null; const head = frag.split(" ").slice(0, 4).join(" "); const hit = sentNorm.find(x => x.n.includes(head)); return hit ? hit.s.trim().slice(0, 180) : null; };
  if (!beh){
    const groups = new Set();
    const normQ = normalize(q.q);
    // Rules are checked one sentence at a time: a claim and its qualifier live in the same sentence,
    // and matching across sentences pairs words that were never said together.
    for (const m of MISTAKES){
      if (m.when && !m.when.test(normQ)) continue;
      if (m.group && groups.has(m.group)) continue;
      const hit = sentNorm.find(x => m.re.test(x.n) && !(m.unless && m.unless.test(x.n)));
      if (hit){ corrections.push(m.fix); said[m.fix] = hit.s.trim().slice(0, 180); if (m.group) groups.add(m.group); }
    }
    corrections.push(...bridgeErrors(norm));
    const yn = yesNoError(q, answer); if (yn){ corrections.push(yn); said[yn] = (sentNorm[0]||{}).s || null; }
    const mathErr = mathError(q, answer); if (mathErr) corrections.push(mathErr);
    corrections.push(...factChecks(q, answer));
  }
  const uniqCorr = [...new Set(corrections)];

  /* delivery */
  const fillers = findAll(answer, FILLERS);
  const hedges = findAll(answer, HEDGES);
  const wording = findAll(answer, WORDING);
  const restarts = (answer.match(RESTARTS) || []).length;
  const fillerRate = words ? fillers.length / words * 100 : 0;     // per 100 words
  const hedgeRate = words ? hedges.length / words * 100 : 0;
  const reps = repeatedPhrases(answer);
  // Not committing: "three or seven, I'm not sure", "you do something with the cash"
  const VAGUE = /\b(?:i'?m not (?:\w+ )?sure|not sure|i don'?t (?:really )?(?:know|remember)|i forget|i can'?t remember|somehow|(?:do|does) something (?:with|to)|something like that|or whatever|i'?m guessing|no idea)\b/gi;
  const altNums = /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)(?: percent)? or (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(answer) ? 1 : 0;
  const vagueQty = (answer.match(/\b(?:by some amount|some amount|a (?:little )?bit|a little|somewhat|some number|a certain amount|not by the full|something like that|the exact numbers?)\b/gi) || []).length;
  const unsure = (answer.match(VAGUE) || []).length + altNums + (vagueQty ? 1 : 0) + (!beh && hedges.length >= 3 ? 1 : 0);

  /* numbers: on a question that gives numbers, the key's results must be said */
  const qNumSet = new Set(numsIn(q.q));
  const keyResultNums = qNumSet.size ? [...new Set(numsIn((q.k||[]).join(" ")).filter(n => n && !qNumSet.has(n)))] : [];
  const ansNumList = numsIn(answer);
  const numHits = keyResultNums.filter(n => ansNumList.some(a => Math.abs(a - n) <= Math.max(0.011 * n, 0.05)));
  const numCov = keyResultNums.length >= 2 ? numHits.length / keyResultNums.length : null;

  /* relevance: sentences that share nothing with the question or key */
  const vocab = new Set([...sigTokens(q.q), ...points.flatMap(p=>p.toks)]);
  // A tangent shares nothing with the question or key AND uses no finance vocabulary at all.
  const offTopic = beh ? [] : sents.filter(s => { const t = sigTokens(s); return t.length >= 8 && !t.some(x => vocab.has(x) || DOMAIN.has(x) || /^\d/.test(x)); });
  const longSents = sents.filter(s => wc(s) > 40);
  const andChains = sents.filter(s => (s.match(/\band\b/gi)||[]).length >= 4);

  /* explanation vs. a list of buzzwords: real answers connect ideas with verbs */
  const RELATE = /\b(?:because|so|which|means?|meaning|since|therefore|then|thus|if|when|while|equals?|is|are|was|were|goes|go|went|flows?|falls?|rises?|increases?|decreases?|reduces?|raises?|lowers?|adds?|subtracts?|minus|plus|times|divided|gives?|gets?|uses?|has|have|shows?|tells?|comes?|leads?|causes?|makes?|starts?|links?|connects?|moves?|drops?|grows?|pays?|paid|buys?|sells?|projects?|discounts?|calculates?|takes?|would|will|can|did|led|built|worked|helped|learned|wanted|decided)\b/gi;
  const segs = answer.split(/[,.;!?]|\band\b|\byeah\b/i).map(s => s.trim()).filter(s => wc(s) > 0);
  const listRatio = segs.length ? segs.filter(s => wc(s) <= 3).length / segs.length : 0;
  const relDensity = words ? (answer.match(RELATE) || []).length / words : 0;
  const domainShare = ansToks.length ? ansToks.filter(t => DOMAIN.has(t)).length / Math.max(1, words) : 0;
  // Spoken answers are roughly a third function words ("the", "is", "so", "it"); a string
  // of buzzwords has almost none. Typed math ("EV = 80 x 7 = 560") is exempt.
  const funcDensity = words ? (answer.match(/\b(?:the|a|an|and|is|are|was|were|be|been|being|of|to|it|its|that|this|these|those|so|you|i|we|they|he|she|them|his|her|in|on|for|by|with|if|then|than|because|which|what|how|why|who|when|as|from|at|into|over|about|around|but|or|not|no|there|their|your|my|our|has|have|had|do|does|did|will|would|can|could|should|may|might|must|goes|get|gets|too|more|less|most|some|any|all|each|only|also|just|very|up|down|out|becomes?|makes?)\b/gi) || []).length / words : 0;
  const mathy = (answer.match(/[=+×*÷]|\d\s?[x\/-]\s?\d/g) || []).length >= 2;
  // A list IS the answer to "name the multiples" or "give examples of line items", and typed notes
  // with real facts ("NI down 6, cash up 4") are terse, not empty.
  const listQ = /\b(?:examples?|list|name (?:some|a few|the)|what are (?:the|some)|which (?:\w+ )?(?:are|do)|types of|kinds of|line items|multiples|methods|methodologies|ways)\b/i.test(q.q);
  const facts = dirFacts(tokens(answer)).filter(f => f.dir && f.num !== null).length;
  const salad = words >= 8 && !mathy && facts < 3 && relDensity < 0.15 && !listQ &&
                (funcDensity < 0.1 || (funcDensity < 0.16 && relDensity < 0.06) || (listRatio >= 0.8 && segs.length >= 5) || (relDensity < 0.045 && domainShare > 0.3));

  /* structure */
  const first = sents[0] || "";
  const weakOpen = OPENER_WEAK.test(answer);
  const firstToks = new Set(sigTokens(first));
  const bluf = beh ? true : points.length ? [...firstToks].some(t => vocab.has(t) && (DOMAIN.has(t) || points[0].toks.includes(t))) : true;
  const signposts = (answer.match(/\b(?:first(?:ly)?|second(?:ly)?|third(?:ly)?|finally|lastly|next|then|to start|to begin|there are (?:two|three|four|\d) (?:main |key )?(?:ways|reasons|things|steps|parts|methods)|in summary|overall|bottom line)\b/gi) || []).length;
  const trails = TRAIL.test(answer);
  const itDepends = /\bit depends\b/i.test(answer) && !/\bit depends (?:on|whether|if)\b/i.test(answer);
  const behx = beh ? behavioralChecks(q, answer, norm) : {flags:[], star:null, praise:[]};

  /* ---------- scores (0–10) ---------- */
  let content;
  if (beh){
    // Behavioral keys are guidance ("use STAR", "show empathy"), so blend
    // key coverage with a rubric for what actually persuades a banker.
    const s = behx.star;
    const numbers = (answer.match(/\b\d[\d,.]*\s?(?:%|percent|k|million|billion|people|members|teams|hours|days|weeks)?\b|\$\s?\d/gi) || []).length;
    const proper = (answer.slice(1).match(/(?<![.!?]\s)\b[A-Z][a-z]{2,}/g) || []).filter(w => !/^(?:I|The|This|That|When|While|After|Before|Then|And|But|So|My|We|Our|Last|First|Second|Finally|Also|It|In|At|On|For|As)$/.test(w)).length;
    const example = /\b(?:for example|for instance|when i|at my|in my|during my|last (?:year|summer|spring|fall|semester)|i (?:led|built|started|worked|interned|founded|managed|organized))\b/i.test(answer);
    let rub;
    if (s) rub = ((s.situation?1:0) + (s.task?1:0) + Math.min(s.action,3)/3*2 + (s.result?2:0) + (s.lesson?1:0) + (numbers?1:0)) / 8;
    else {
      // Credit for actually answering what was asked, then for proof (examples, numbers, names).
      const qWords = new Set(sigTokens(q.q).filter(t => !META.has(t)));
      const onTopic = ansToks.some(t => qWords.has(t)) || words >= 25 ? 1 : 0;
      rub = (onTopic*0.75 + (example?1:0) + Math.min(numbers,2)/2 + Math.min(proper,3)/3 + (lenRatio >= 0.3 ? 1 : lenRatio/0.3)) / 4.75;
    }
    rub -= behx.flags.filter(f => f.sev >= 3).length * 0.12;
    const blended = contentRatio === null ? rub : rub * 0.7 + contentRatio * 0.3;
    content = clamp(Math.round(Math.max(0, blended) * 10));
  } else {
    content = contentRatio === null ? 5 : clamp(Math.round(contentRatio * 10 + (contentRatio > 0.85 ? 0.5 : 0)));
  }
  // Naming the right terms without explaining how they connect is not knowing the answer.
  if (salad) content = Math.min(content, 3);
  // "Net income goes down by some amount" covers the words but not the answer.
  if (numCov !== null && numCov === 0) content = Math.min(content, 5);
  else if (numCov !== null && numCov < 0.5) content = Math.max(0, content - 2);
  const accuracy = beh ? null : clamp(10 - uniqCorr.length * 3);
  let structure = 10;
  if (weakOpen) structure -= 1.5;
  if (!bluf) structure -= 2;
  if (!beh && points.length >= 3 && signposts === 0 && words > 60) structure -= 1.5;
  if (trails) structure -= 1;
  if (longSents.length) structure -= Math.min(1.5, longSents.length * 0.75);
  if (behx.star){ const s = behx.star; structure -= (!s.situation?1:0) + (!s.task?1:0) + (s.action<2?2:0) + (!s.result?2:0); }
  structure = clamp(Math.round(structure));
  let concision = 10;
  if (lenRatio > 1.25) concision -= Math.min(5, (lenRatio - 1.25) * 6 + 1);
  if (lenRatio < 0.3 && !(contentRatio >= 0.8)) concision -= Math.min(5, (0.3 - lenRatio) * 15 + 1);
  concision -= Math.min(3, offTopic.length * 1.5);
  concision -= Math.min(2, reps.length * 0.7);
  concision -= Math.min(1.5, andChains.length * 0.75);
  concision = clamp(Math.round(concision));
  let delivery = 10;
  delivery -= Math.min(4, fillerRate * 0.9);
  delivery -= Math.min(3, hedgeRate * 1.1);
  delivery -= Math.min(2, restarts * 0.8);
  if (wpm && (wpm > 185 || wpm < 105)) delivery -= 1.5;
  delivery -= Math.min(1.5, wording.length * 0.25);
  delivery = clamp(Math.round(delivery));

  // Structure, delivery, concision and accuracy only count when there's a real
  // answer to judge. "No mistakes" in two sentences isn't a 10 — cap each one
  // by how much substance the answer actually has.
  const lenFactor = clamp(words / (targetWords * 0.35), 0, 1);
  const contentFactor = clamp(content / 6, 0, 1);
  const substance = contentFactor * (0.5 + 0.5 * lenFactor);
  const cap = Math.round(2 + 8 * substance);
  structure = Math.min(structure, cap);
  concision = Math.min(concision, cap);
  delivery = Math.min(delivery, cap);
  let accuracyOut = accuracy;
  if (!beh){
    if ((contentRatio ?? 0) < 0.15 && !uniqCorr.length) accuracyOut = null;   // too little said to judge
    else if (!uniqCorr.length) accuracyOut = Math.min(accuracy, cap);
  }
  const accuracyForScore = accuracyOut ?? 0;

  let overall = beh
    ? content*0.35 + structure*0.25 + concision*0.15 + delivery*0.25
    : content*0.45 + accuracyForScore*0.20 + structure*0.10 + concision*0.15 + delivery*0.10;
  // Hard ceilings: an interviewer stops listening after these, however good the rest is.
  const caps = [];
  const capAt = (n, why) => { if (overall > n){ overall = n; caps.push({max:n, why}); } };
  if (uniqCorr.length) capAt(5 - Math.min(2, uniqCorr.length-1), uniqCorr.length > 1 ? `${uniqCorr.length} factual errors` : "a factual error");
  if (salad) capAt(3, "it lists terms without explaining how they connect");
  if (words < 12) capAt(2, "it's too short to judge");
  if (beh){
    const red = behx.flags.filter(f => f.sev >= 3).length;
    if (red) capAt(6 - red, red > 1 ? `${red} red flags` : "a red flag an interviewer would notice");
    if (words < 30) capAt(4, "there's no real example yet");
  }
  if (!beh && contentRatio !== null && contentRatio < 0.25) capAt(4, "it misses most of the key points");
  else if (!beh && content <= 6) capAt(content + 1, "it leaves out part of the answer");
  if (numCov === 0) capAt(6, "it never gives the numbers");
  if (!beh && unsure >= 3) capAt(5, "you never committed to an answer");
  else if (!beh && unsure >= 2) capAt(6, "you sounded unsure of the core answer");
  if (delivery <= 3 && words >= 20) capAt(7, "heavy filler and hedging");
  if (lenRatio > 2.4) capAt(5, `it runs about ${Math.round(lenRatio*10)/10}× the target length`);
  else if (lenRatio > 1.8) capAt(6, `it runs about ${Math.round(lenRatio*10)/10}× the target length`);
  if (offTopic.length >= 2) capAt(6, "it wanders off topic");
  overall = clamp(Math.round(overall));

  /* ---------- coaching list ---------- */
  const fixes = [];
  const add = (sev, title, body, tag) => fixes.push({sev, title, body, tag});
  uniqCorr.forEach(c => add(5, "Factual error", said[c] ? `You said: “${said[c]}” ${c}` : c, "Accuracy"));
  if (substance < 0.35 && words >= 3) add(5, "Not enough of an answer yet",
    beh ? "There isn't a real example or story here yet, so structure and delivery can't score well. Use the hint, pick one concrete experience, and walk through it."
        : "This doesn't cover the key points, so there's nothing to give structure, delivery or accuracy credit for. Tap Hint to see what to cover, then answer again.", "Content");
  if (salad) add(5, "Explain, don't list", `You named the right terms but never said how they connect, so it sounds memorized. Pick two of them and explain the link out loud: “${(points[0] && points[0].text || "X flows into Y because…").replace(/\s+/g," ").slice(0, 110)}”`, "Content");
  if (!beh && unsure >= 2){
    const ex = (answer.match(VAGUE) || [])[0] || (vagueQty ? (answer.match(/\b(?:by some amount|some amount|a (?:little )?bit|a little|somewhat|not by the full)\b/i)||[""])[0] : "") || "two different answers";
    add(4, "Commit to one answer", `You said “${ex}”. To an interviewer, that sounds like you don't know it. Give one answer, say it once, and back it with the reason. If you're unsure, say “I'd assume X, because Y.”`, "Content");
  }
  if (numCov !== null && numCov < 0.5){
    const withNums = (q.k || []).filter(k => /\d/.test(k)).slice(0, 2).map(k => k.replace(/\s+/g," ").slice(0, 120));
    const gaveOwn = ansNumList.some(n => !qNumSet.has(n));
    add(numCov === 0 ? 4 : 3, gaveOwn ? "Get the numbers right" : numCov === 0 ? "Say the numbers" : "Some numbers are missing",
      (gaveOwn ? "Your numbers don't match the correct results. Work it step by step out loud. " : "The question gives you numbers, so the interviewer expects exact results, not “it goes down”. ")
      + `The right figures: ${withNums.map(k => "“" + k + "”").join(" and ")}.`, "Content");
  }
  const missed = cov.filter(p=>p.status==="miss"), partial = cov.filter(p=>p.status==="partial");
  const point = p => p.text.replace(/\s+/g," ").replace(/\.$/,"").slice(0, 140) + (p.text.length > 140 ? "…" : "");
  if (missed.length) add(4, `Add ${missed.length === 1 ? "this point" : `these ${Math.min(3, missed.length)} points`}`, missed.slice(0,3).map(p => "• " + point(p)).join("\n"), "Content");
  if (partial.length) add(2, "Go one level deeper", partial.slice(0,2).map(p => `• ${p.label}: add ${missingWords(p).slice(0,4).join(", ") || "the specifics"}`).join("\n"), "Content");
  if (!bluf && !beh) add(3, "Lead with the answer", "Your first sentence should answer the question directly. Context comes after. Interviewers decide in the first 10 seconds.", "Structure");
  if (weakOpen) add(2, "Cut the warm-up", `You opened with “${(answer.match(OPENER_WEAK)||[""])[0].trim()}”. Pause silently for a second instead, then start with the answer.`, "Structure");
  if (!beh && points.length >= 3 && signposts === 0 && words > 60) add(2, "Signpost your structure", `Say how many parts there are (“There are ${Math.min(points.length,3)} main pieces…”) and number them. It makes long answers easy to follow.`, "Structure");
  behx.flags.forEach(f => add(f.sev, f.title, f.body, beh ? "Story" : "Structure"));
  if (lenRatio > 1.25) add(lenRatio > 1.8 ? 4 : 3, "You're rambling", `About ${words} words for a ~${target}s answer (aim for ${Math.round(targetWords*0.45)}–${Math.round(targetWords*1.1)}). Cut background and stop once you've made your last key point.`, "Concision");
  if (lenRatio < 0.3 && words >= 12 && !(contentRatio >= 0.8)) add(3, "Too thin", `Only ${words} words. A strong answer here runs about ${Math.round(targetWords*0.45)}–${Math.round(targetWords*1.1)} words. Add the missing points${beh ? " and a concrete example" : ""}.`, "Concision");
  if (offTopic.length) add(3, "Tangent detected", `This doesn't connect to the question: “${offTopic[0].slice(0,110)}${offTopic[0].length>110?"…":""}”. Cut anything that doesn't answer what was asked.`, "Concision");
  if (reps.length) add(2, "You repeated yourself", `“${reps[0]}” came up more than once. Say each point once, clearly.`, "Concision");
  if (longSents.length) add(2, "Break up long sentences", `One sentence ran ${wc(longSents[0])} words. Spoken answers land better in short sentences with a pause between them.`, "Delivery");
  if (andChains.length) add(1, "Too many “and”s", "Chaining ideas with “and… and… and” sounds like stream of consciousness. Finish the sentence and start a new one.", "Delivery");
  if (fillers.length >= 2) add(fillerRate > 4 ? 3 : 2, `${fillers.length} filler words`, `${countLabels(fillers)}. Replace each with a silent pause; pauses sound confident, fillers don't.`, "Delivery");
  if (hedges.length >= 1 && !beh) add(hedges.length >= 3 ? 3 : 2, "Hedging", `${countLabels(hedges)}. On technical questions, state facts directly. If you're unsure, say “I'd assume X because Y” once, not throughout.`, "Delivery");
  if (hedges.length >= 3 && beh) add(2, "Hedging", `${countLabels(hedges)}. Own your story. You were there, so say it with certainty.`, "Delivery");
  if (restarts) add(2, "Restarts", "You stopped and restarted. If you lose your place, pause, then say “Let me take that from the top” once and give the clean version.", "Delivery");
  if (wpm && wpm > 185) add(2, "Slow down", `About ${wpm} words per minute. Aim for 130–165. Speed reads as nerves.`, "Delivery");
  if (wpm && wpm < 105 && words > 30) add(2, "Pick up the pace", `About ${wpm} words per minute. Aim for 130–165. Too slow sounds like you're unsure.`, "Delivery");
  if (trails) add(1, "Finish strong", "You trailed off at the end. Close with a one-line summary, then stop talking.", "Structure");
  if (itDepends) add(2, "“It depends” on what?", "Never leave “it depends” hanging. Say what it depends on and give the answer for the most common case.", "Structure");
  if (wording.length) add(1, "Word choice", `${wording.length} phrase${wording.length>1?"s":""} to upgrade. See the wording section below.`, "Wording");
  fixes.sort((a,b)=>b.sev-a.sev);

  /* ---------- strengths ---------- */
  const strengths = [];
  const hits = cov.filter(p=>p.status==="hit");
  if (hits.length) strengths.push(`Covered ${hits.length} of ${cov.length} key points.`);
  if (!beh && bluf && words > 15 && !uniqCorr.length && contentRatio > 0.3) strengths.push("Led with a direct answer.");
  if (signposts >= 2) strengths.push("Clear signposting made it easy to follow.");
  if (words >= 12 && fillerRate < 1.5) strengths.push("Very few filler words.");
  if (words >= 12 && !hedges.length) strengths.push("Confident: no hedging.");
  if (!beh && !uniqCorr.length && words >= 25 && contentRatio > 0.4) strengths.push("No factual errors caught.");
  if (lenRatio >= 0.35 && lenRatio <= 1.15) strengths.push("Good length for the question.");
  if (wpm && wpm >= 125 && wpm <= 170) strengths.push(`Good pace (${wpm} wpm).`);
  strengths.push(...behx.praise);

  const lead = overall >= 9 ? "Interview-ready. This would pass on a superday."
    : overall >= 7 ? "Solid. A couple of fixes make this a top answer."
    : overall >= 5 ? "Getting there, but an interviewer would push you on what's missing."
    : overall >= 3 ? "This wouldn't pass yet."
    : "Start over with the structure below and aim for the key points.";
  // Say the single biggest reason, so the score never feels arbitrary.
  const why = caps.length ? caps.sort((a,b) => a.max - b.max)[0] : null;
  const verdict = why ? `${lead.replace(/\.$/,"")}: held to ${why.max}/10 because ${why.why}.` : overall < 9 && fixes[0] ? `${lead} Biggest fix: ${fixes[0].title.toLowerCase()}.` : lead;
  // A short plan for the next attempt: the three highest-impact changes.
  const plan = [];
  for (const f of fixes){
    if (plan.length >= 3) break;
    if (f.sev < 2 || plan.some(p => p.tag === f.tag && f.tag !== "Content")) continue;
    // For a factual error, the step is the correction itself, not the label.
    const title = f.tag === "Accuracy" ? "Fix: " + (uniqCorr.find(c => f.body.endsWith(c)) || f.body).split(/(?<=\.)\s/)[0] : f.title;
    plan.push({title, tag: f.tag});
  }

  return {
    overall, verdict, beh, caps, plan,
    scores: {content, accuracy: accuracyOut, structure, concision, delivery}, substance,
    coverage: cov.map(p => ({...p, missWords: p.status === "hit" ? [] : missingWords(p)})), corrections: uniqCorr, said, fixes, strengths,
    stats: {words, targetWords, target, secs, wpm, fillers: fillers.length, hedges: hedges.length, fillerRate: +fillerRate.toFixed(1), sentences: sents.length, longest: Math.max(0, ...sents.map(wc))},
    marks: {fillers, hedges, wording, offTopic, reps},
    star: behx.star,
    wording: dedupeWording(wording),
    tightened: tighten(answer),
    model: modelAnswer(q, points),
  };
}
// Missed pieces of a key point in plain words: "retained earnings", "40%", not stems.
function missingWords(p){
  if (p.byConcept) return p.miss || [];
  const miss = new Set(p.miss || []);
  const out = [];
  const phrase = p.text.replace(/\s+/g," ");
  // keep multi-word finance terms together
  const PHR = /\b(?:net income|retained earnings|shareholders'? equity|cash flow from (?:operations|investing|financing)|working capital|terminal value|enterprise value|equity value|cost of (?:equity|debt)|deferred (?:revenue|tax (?:asset|liability))|interest expense|pre-tax income|operating income|free cash flow|common stock|treasury stock|tax rate|accounts (?:receivable|payable))\b/gi;
  for (const m of phrase.match(PHR) || []){ const st = sigTokens(m); if (st.some(t => miss.has(t))){ out.push(m.toLowerCase()); st.forEach(t => miss.delete(t)); } }
  for (const w of phrase.split(/[\s,;:()]+/)){
    const clean = w.replace(/^[^\w$]+|[^\w%]+$/g,"");
    if (!clean) continue;
    const st = sigTokens(clean);
    if (/^(?:IS|BS|CFS|CF|vs|e\.g|i\.e)$/i.test(clean) || /^(?:shown|show|shows|based|valued|means|mean|uses?|using|via|also|then|both|either|overall|sides?|total|each|[01])$/i.test(clean)) continue;
    if (st.length && st.every(t => miss.has(t)) && !GENERIC.has(st[0])){ out.push(clean); st.forEach(t => miss.delete(t)); }
  }
  return [...new Set(out)].slice(0, 6);
}
function countLabels(list){
  const c = {}; list.forEach(x => { const k = x.label; c[k] = (c[k]||0)+1; });
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,n]) => `“${k}” ×${n}`).join(", ");
}
function dedupeWording(list){
  const seen = new Map();
  for (const w of list){ const k = w.rule.from; if (!seen.has(k)) seen.set(k, {...w.rule, said: w.text, n:1}); else seen.get(k).n++; }
  return [...seen.values()];
}

/* Highlight ranges for the transcript view. */
function highlights(answer, report){
  const r = [];
  report.marks.fillers.forEach(m => r.push({i:m.i, j:m.i+m.len, kind:"filler", tip:"Filler: replace with a pause"}));
  report.marks.hedges.forEach(m => r.push({i:m.i, j:m.i+m.len, kind:"hedge", tip:"Hedge: state it directly"}));
  report.marks.wording.forEach(m => r.push({i:m.i, j:m.i+m.len, kind:"word", tip:`${m.rule.why} Try: ${m.rule.to}`}));
  report.marks.offTopic.forEach(s => { const i = answer.indexOf(s); if (i >= 0) r.push({i, j:i+s.length, kind:"tangent", tip:"Tangent: doesn't answer the question"}); });
  r.sort((a,b)=>a.i-b.i || (b.j-b.i)-(a.j-a.i));
  // drop overlaps, keeping the first/longest
  const out = []; let end = -1;
  for (const x of r){ if (x.i >= end){ out.push(x); end = x.j; } else if (x.kind === "tangent") continue; }
  return out;
}

return {analyze, highlights, normalize, keyPoints, tighten};
})();
if (typeof module !== "undefined") module.exports = Coach;
