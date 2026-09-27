/* ==========================================================================
   EuroHellenic — assets/js/athena.js
   "Ask Athena": a floating study-match assistant on every page.

   Pure client-side. No backend, no API keys, no network calls. A guided
   questionnaire asks one question at a time, then matches the answers against
   a small data table built ONLY from what this site already publishes:
     - programmes.html  (study areas, anchors, fees, awarding bodies, IELTS)
     - programmes.html#institutions (the four institutions we introduce)
     - costs-and-visa.html (living costs by city, calculator figures, visa timing)
   If you change a fee or a programme on those pages, change it here too.

   Progress is kept in sessionStorage (wrapped in try/catch) so a conversation
   survives moving between pages. "Send this to an advisor" links to
   contact.html with the answers as query params; contact-prefill.js fills the
   form from them.
   ========================================================================== */
(function () {
  'use strict';

  var STORE_KEY = 'eh-athena-v1';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================ DATA */
  /* Indicative 2026–27 figures exactly as published on this site. */

  // Programme areas (programmes.html). anchor = the id on programmes.html.
  var PROGRAMMES = {
    'ug-business': {
      title: 'Business, accounting & finance degrees',
      anchor: 'programmes.html#business',
      detail: 'BA (Hons) Business Management, BA (Hons) Business with Marketing, Finance, HRM or Shipping pathways, and BSc (Hons) Accounting & Finance. 3 years.',
      fact: 'University of Derby awards (Accounting & Finance: a UK partner university) · €6,750 / yr · IELTS 6.0'
    },
    'ug-shipping': {
      title: 'BA (Hons) Business — Shipping pathway',
      anchor: 'programmes.html#business',
      detail: 'Greece controls one of the largest merchant fleets in the world, and the industry recruits locally. 3 years.',
      fact: 'Awarded by the University of Derby · €6,750 / yr · IELTS 6.0'
    },
    'ug-computing': {
      title: 'Computing degrees',
      anchor: 'programmes.html#computing',
      detail: 'BSc (Hons) Computer Science, Cyber Security, or Artificial Intelligence & Data Science. 3 years.',
      fact: 'Awarded by the University of Derby · €6,750 / yr · IELTS 6.0'
    },
    'ug-engineering': {
      title: 'Engineering (MEng / BEng)',
      anchor: 'programmes.html#engineering',
      detail: 'Mechanical Engineering & Design or Marine Engineering, as a five-year integrated master’s. Confirm how the award maps to chartership where you plan to work.',
      fact: 'Awarded by the University of Derby · €6,750 / yr · IELTS 6.0'
    },
    'ug-marine': {
      title: 'MEng / BEng Marine Engineering',
      anchor: 'programmes.html#engineering',
      detail: 'A distinctively Greek strength: the maritime cluster in Piraeus is one of the densest in the world. Five-year integrated route.',
      fact: 'Awarded by the University of Derby · €6,750 / yr · IELTS 6.0'
    },
    'ug-health': {
      title: 'Psychology & health degrees',
      anchor: 'programmes.html#health',
      detail: 'BSc (Hons) Applied Psychology (3 years) or BSc (Hons) Physiotherapy (4 years, with clinical placement). Psychology is regulated nationally, so check registration where you intend to practise.',
      fact: 'Psychology: University of Derby, €6,750 / yr, IELTS 6.0 · Physiotherapy: UK partner university, from €6,750 / yr, IELTS 6.0–6.5'
    },
    'ug-hospitality': {
      title: 'International Hospitality & Tourism Management',
      anchor: 'programmes.html#hospitality',
      detail: 'Tourism is a quarter of the Greek economy, so placements, seasonal earnings and graduate roles are genuinely available where you study. 3 years.',
      fact: 'UK partner university · from €6,750 / yr · IELTS 6.0'
    },
    'foundation': {
      title: 'International Foundation Year',
      anchor: 'programmes.html#foundation',
      detail: 'One year that closes the gap when school qualifications or English sit below degree entry, then progression to Year 1 of a degree. EuroHellenic tutors this in-house.',
      fact: 'Entry English: IELTS 4.5 equivalent · progresses to Year 1 undergraduate'
    },
    'pg-mba': {
      title: 'MBA (Global)',
      anchor: 'programmes.html#postgraduate',
      detail: 'A one-year master’s — the strongest value case on the programmes page for anyone with three or more years of work experience.',
      fact: 'Awarded by the University of Derby · €8,350 total · IELTS 6.0–6.5'
    },
    'pg-cyber': {
      title: 'MSc Cyber Security',
      anchor: 'programmes.html#postgraduate',
      detail: 'A one-year conversion or deepening route. Where a two-year structure is offered, the fee is typically split roughly €5,590 then €3,590.',
      fact: 'Awarded by the University of Derby · €8,350 total · IELTS 6.0–6.5'
    },
    'pg-psych': {
      title: 'MSc Psychology specialisations',
      anchor: 'programmes.html#postgraduate',
      detail: 'Clinical, organisational and educational pathways. Entry usually requires a recognised psychology first degree.',
      fact: 'UK partner university · €8,350 total · IELTS 6.5'
    },
    'pg-general': {
      title: 'Postgraduate routes',
      anchor: 'programmes.html#postgraduate',
      detail: 'The master’s routes on this site are the MBA (Global), MSc Cyber Security and MSc Psychology specialisations. The colleges run many more — an advisor can check your subject.',
      fact: 'One-year master’s from €8,350 total · IELTS 6.0–6.5'
    }
  };

  // Institutions (programmes.html#institutions). cities use the question keys.
  var INSTITUTIONS = {
    medc: {
      name: 'Mediterranean College',
      where: 'Athens · Thessaloniki · Larissa',
      cities: ['athens', 'thessaloniki'],
      award: 'uk',
      awardText: 'degrees awarded by the University of Derby',
      fees: 'undergraduate €6,750/yr; one-year master’s €8,350',
      pitch: 'the widest English-taught choice with one clear awarding body'
    },
    metro: {
      name: 'Metropolitan College',
      where: 'Athens · Thessaloniki · Patras · Heraklion',
      cities: ['athens', 'thessaloniki', 'crete'],
      award: 'uk',
      awardText: 'awards from Queen Margaret, East London, Oxford Brookes and Solent',
      fees: 'fees are set per programme',
      pitch: 'strongest in health sciences, law and education'
    },
    nyc: {
      name: 'New York College',
      where: 'Athens · Thessaloniki',
      cities: ['athens', 'thessaloniki'],
      award: 'us',
      awardText: 'US awards from SUNY Empire State University, plus Greenwich and Greater Manchester',
      fees: 'fees are set per programme',
      pitch: 'the option if an American degree matters at home'
    },
    unic: {
      name: 'University of Nicosia',
      where: 'Nicosia · campus in Athens',
      cities: ['athens'],
      award: 'own',
      awardText: 'a full university awarding its own degrees',
      fees: 'undergraduate €10,320–€11,820/yr (non-EU), plus €1,000–€1,700/yr extra fees; medicine €24,000/yr',
      pitch: 'a university in its own right rather than a college centre'
    }
  };
  var INST_ORDER = ['medc', 'metro', 'nyc', 'unic'];

  // How each subject reads inside a sentence
  var SUBJECT_NOUN = {
    business: 'business and finance', computing: 'computing and AI', engineering: 'engineering',
    health: 'psychology and health', hospitality: 'hospitality and tourism', shipping: 'shipping',
    medicine: 'medicine', lawedu: 'law and education', other: 'your subject', unsure: 'an open choice of subject'
  };

  // Living costs (costs-and-visa.html). Monthly = the calculator's shared-room
  // rent + typical other living costs (€462). Ranges = the "Choose your city" cards.
  var CITY = {
    athens:       { name: 'Athens',       monthly: 982, range: '€930–€1,480 a month', room: '€450–€700' },
    thessaloniki: { name: 'Thessaloniki', monthly: 862, range: '€700–€1,100 a month', room: '€300–€450' },
    crete:        { name: 'Crete',        monthly: 832, range: '€700–€1,050 a month', room: '€300–€430' }
  };
  var TUITION = { bachelor: 6750, master: 8350 };  // published indicative figures

  /* ============================================================ QUESTIONS */
  // Each chip: [key, label shown to the student, label sent to contact.html (optional)]
  var SUBJECT_CHIPS = [
    ['business', 'Business & finance'],
    ['computing', 'Computing & AI'],
    ['engineering', 'Engineering'],
    ['health', 'Psychology & health'],
    ['hospitality', 'Hospitality & tourism'],
    ['shipping', 'Shipping & maritime'],
    ['other', 'Something else…'],
    ['unsure', 'Not sure yet']
  ];

  var SUBJECT_WORDS = [
    ['medicine', /medic|doctor|mbbs|surgeon/],
    ['shipping', /ship|maritime|marine|naval|sea|port/],
    ['computing', /comput|software|\bit\b|cyber|data|\bai\b|artificial|program|coding|tech|web|developer/],
    ['engineering', /engineer|mechanic|robot|design/],
    ['health', /psych|health|physio|therap|nurs|clinic/],
    ['hospitality', /hospitality|touris|hotel|travel|event|culinar|chef/],
    ['lawedu', /\blaw\b|legal|educat|teach/],
    ['business', /business|manag|market|financ|account|\bhr\b|human resource|econom|mba|commerce|entrepreneur/]
  ];

  var STEPS = [
    {
      id: 'name', input: 'text', optional: true, skip: 'I’d rather not say',
      placeholder: 'Your first name', maxlength: 40,
      ask: function () {
        return [
          '<span lang="el">Γειά σου</span> (<em>yia sou</em>) — hello! I’m Athena. In the old stories I’m the goddess of wisdom; here, I help students work out where in Greece they might study.',
          'I’ll ask a few short questions, one at a time, then suggest programme areas and institutions from this website. It takes about two minutes. First — what should I call you?'
        ];
      }
    },
    {
      id: 'level',
      chips: [['foundation', 'Foundation year', 'Foundation / English preparation'],
              ['bachelor', 'Bachelor’s degree', 'Undergraduate'],
              ['master', 'Master’s degree', 'Postgraduate'],
              ['unsure', 'Not sure yet', 'Not sure yet']],
      ask: function (a) {
        var hi = a.name ? '<span lang="el">Χάρηκα</span>, ' + esc(a.name) + ' — lovely to meet you.' :
                          'No problem at all — names can wait.';
        return [hi + ' What level would you like to study at?'];
      }
    },
    {
      id: 'subject', chips: SUBJECT_CHIPS,
      ask: function (a) {
        var pre = {
          foundation: 'A foundation year is a wise first step when the gap is real.',
          bachelor: 'A bachelor’s it is — most English-taught routes in Greece run three years.',
          master: 'A master’s — the one-year routes are good value.',
          unsure: 'That’s fine; your other answers will point the way.'
        }[a.level] || '';
        return [pre + ' Which subject area calls to you?'];
      }
    },
    {
      id: 'subjectText', input: 'text', placeholder: 'e.g. Law, Architecture, Marketing', maxlength: 60,
      when: function (a) { return a.subject === 'other'; },
      ask: function () { return ['Tell me in a few words what you would like to study.']; }
    },
    {
      id: 'city',
      chips: [['athens', 'Athens'], ['thessaloniki', 'Thessaloniki'],
              ['crete', 'Crete (Heraklion / Chania)'], ['any', 'No preference']],
      ask: function (a) {
        var pre = {
          business: 'Business is the largest English-taught cluster in Greece.',
          computing: 'Computing travels well — employers assess your work, not your campus.',
          engineering: 'Engineering here is a five-year integrated route.',
          health: 'Psychology and health — a strong choice, with a registration caveat I’ll mention later.',
          hospitality: 'Hospitality, in the country that practically invented the welcome.',
          shipping: 'Shipping! Greece controls one of the largest merchant fleets in the world.',
          medicine: 'Medicine is a big commitment — I’ll show you what this site lists.',
          lawedu: 'Noted — I know which college is strongest there.',
          other: 'Noted — an advisor can search the full course lists for that.',
          unsure: 'Undecided is honest. We can still narrow things down.'
        }[a.subject] || '';
        return [pre + ' Where in Greece would you like to live?'];
      }
    },
    {
      id: 'tuition',
      chips: [['lt7', 'Under €7,000'], ['7to9', '€7,000–€9,000'], ['9to12', '€9,000–€12,000'],
              ['gt12', 'Over €12,000'], ['unsure', 'Not sure yet']],
      ask: function (a) {
        var pre = {
          athens: 'Athens — the most programmes, the most international cohorts, and the highest rents.',
          thessaloniki: 'Thessaloniki — Greece’s student city, with noticeably lower costs than Athens.',
          crete: 'Crete — the lowest costs and mildest winters, with a narrower choice of programmes.',
          any: 'An open mind — <span lang="el">μπράβο</span> (<em>bravo</em>). That keeps the most doors open.'
        }[a.city] || '';
        return [pre + ' Roughly how much could you spend on <strong>tuition</strong> each year?'];
      }
    },
    {
      id: 'budget',
      chips: [['lt12', 'Under €12,000', 'Under €12,000'],
              ['12to18', '€12,000–€18,000', '€12,000–€18,000'],
              ['18to25', '€18,000–€25,000', '€18,000–€25,000'],
              ['gt25', 'Over €25,000', 'Over €25,000'],
              ['unsure', 'Prefer not to say yet', 'Prefer not to say yet']],
      ask: function () {
        return ['And your <strong>total</strong> yearly budget, including rent and living costs?',
                'For reference, this site’s estimates put living costs at about €700–€1,100 a month in Thessaloniki or Crete, and €930–€1,480 in Athens.'];
      }
    },
    {
      id: 'english',
      chips: [['none', 'Not tested yet', 'Not tested yet'],
              ['lt55', 'IELTS below 5.5', 'IELTS below 5.5'],
              ['55', 'IELTS 5.5', 'IELTS 5.5'],
              ['60', 'IELTS 6.0–6.5', 'IELTS 6.0–6.5'],
              ['70', 'IELTS 7.0 or above', 'IELTS 7.0 or above'],
              ['other', 'Other (PTE, Cambridge, TOEFL)', 'Other qualification (PTE, Cambridge, TOEFL)']],
      ask: function () {
        return ['<span lang="el">Εντάξει</span> (<em>endaxi</em>) — thank you. How is your English? Do you have an IELTS score?'];
      }
    },
    {
      id: 'award',
      chips: [['uk', 'A UK degree'], ['us', 'A US degree'], ['any', 'Either is fine']],
      ask: function () {
        return ['Greek private colleges teach degrees that a UK or US university awards in its own name. Does it matter to you which country awards yours?'];
      }
    },
    {
      id: 'experience',
      chips: [['yes', 'Yes, 3+ years'], ['no', 'Not yet']],
      when: function (a) { return a.level === 'master'; },
      ask: function () { return ['Do you have three or more years of work experience?']; }
    },
    {
      id: 'intake',
      chips: [['next', 'Next available', 'Next available'],
              ['autumn', 'Autumn (Sep/Oct)', 'Autumn (September/October)'],
              ['spring', 'Spring (Jan/Feb)', 'Spring (January/February)'],
              ['later', 'Following academic year', 'Following academic year']],
      ask: function () { return ['When would you like to start?']; }
    },
    {
      id: 'country', input: 'text', optional: true, skip: 'Skip this one',
      placeholder: 'Country you live in now', maxlength: 60,
      ask: function () {
        return ['Last one: which country do you live in now? It helps an advisor judge visa timing.'];
      }
    }
  ];

  /* ============================================================ MATCHING */
  function ieltsBelow6(a) { return a.english === 'none' || a.english === 'lt55' || a.english === '55'; }

  function subjectKey(a) {
    if (a.subject !== 'other') return a.subject;
    var t = (a.subjectText || '').toLowerCase();
    for (var i = 0; i < SUBJECT_WORDS.length; i++) {
      if (SUBJECT_WORDS[i][1].test(t)) return SUBJECT_WORDS[i][0];
    }
    return 'other';
  }

  // Programme cards for a subject at undergraduate level
  function ugCards(subj) {
    switch (subj) {
      case 'business': return ['ug-business'];
      case 'computing': return ['ug-computing'];
      case 'engineering': return ['ug-engineering'];
      case 'health': return ['ug-health'];
      case 'hospitality': return ['ug-hospitality'];
      case 'shipping': return ['ug-shipping', 'ug-marine'];
      default: return [];
    }
  }
  function pgCards(subj, a) {
    switch (subj) {
      case 'business': case 'shipping': return ['pg-mba'];
      case 'computing': return ['pg-cyber'];
      case 'health': return ['pg-psych'];
      default: return ['pg-general'];
    }
  }

  function programmeReason(id, a, subj) {
    var r = [];
    if (id === 'foundation') {
      if (a.level === 'foundation') r.push('You asked for a foundation year, and it progresses straight into Year 1 of a degree.');
      else r.push('Degrees here usually ask for IELTS 6.0; ' + (a.english === 'none' ? 'without an English test yet' : 'with IELTS below 5.5') + ', a foundation year closes the gap rather than hiding it.');
    } else if (id === 'pg-mba') {
      r.push(a.experience === 'yes' ? 'With three or more years of work experience, this is the strongest value case on the programmes page.'
                                    : 'It suits business and shipping interests at master’s level; it is at its best once you have three or more years of work experience.');
    } else if (id === 'pg-psych') {
      r.push('Matches your interest in psychology at master’s level; you will usually need a recognised psychology first degree.');
    } else if (id === 'pg-cyber') {
      r.push('The computing master’s on this site, as one year or split over two.');
    } else if (id === 'pg-general') {
      r.push(subj === 'other' || subj === 'unsure' || subj === 'lawedu' || subj === 'medicine'
        ? 'Your subject is not among the representative routes listed, so start from the postgraduate overview.'
        : 'This site does not list a master’s in ' + SUBJECT_NOUN[subj] + ', so start from the postgraduate overview.');
    } else if (id === 'ug-marine') {
      r.push('The engineering side of shipping — trained beside the Piraeus maritime cluster.');
    } else if (id === 'ug-shipping') {
      r.push('The business side of shipping, in a country whose merchant fleet recruits locally.');
    } else {
      r.push('The closest match on the programmes page for ' + (SUBJECT_NOUN[subj] || 'your subject') + '.');
    }
    if (a.level === 'unsure' && id.indexOf('ug-') === 0) r.push('Shown at bachelor’s level because you are not sure yet.');
    return r.join(' ');
  }

  function scoreInstitutions(a, subj) {
    var out = [];
    INST_ORDER.forEach(function (key, order) {
      var inst = INSTITUTIONS[key];
      var s = 10 - order * 0.1;         // stable tie-break in site order
      var why = [];

      var medUnic = subj === 'medicine' && key === 'unic';
      // City is a hard filter (except that medicine is only listed at UNIC)
      if (a.city !== 'any' && inst.cities.indexOf(a.city) === -1 && !medUnic) return;
      if (a.city === 'crete' && key === 'metro') { s += 3; why.push('the only institution on this site with a Crete campus (Heraklion)'); }
      else if (a.city !== 'any') why.push('teaches in ' + CITY[a.city].name);

      // Budget: UNIC's published undergraduate fee starts at €10,320
      if (key === 'unic') {
        if (medUnic) { s += 6; why.push('the only institution on this site that lists medicine (€24,000/yr)'); }
        else if (a.tuition === 'lt7' || a.tuition === '7to9') return;
        if (a.tuition === '9to12') { s += 0.5; why.push('fees of €10,320–€11,820/yr fit your tuition range, but watch the €1,000–€1,700 extra fees'); }
        if (a.tuition === 'gt12') { s += 1.5; why.push('its €10,320–€11,820/yr fees sit within your tuition budget'); }
        if (a.level === 'master') s -= 2;   // no master's fee published on this site
      }
      if (key === 'medc') {
        if (a.level === 'master') {
          if (a.tuition === 'lt7') why.push('the one-year master’s is €8,350, a little above your tuition range');
          else { s += 2; why.push('published master’s fee of €8,350'); }
        } else {
          s += 2; why.push('published fees of €6,750/yr');
        }
        if (['business', 'computing', 'engineering', 'shipping', 'unsure', 'other'].indexOf(subj) > -1) s += 1.5;
      }
      if (key === 'metro') {
        if (subj === 'health') { s += 2.5; why.push('a natural fit for a health subject'); }
        if (subj === 'lawedu') { s += 4; why.push('the college this site names for law and education'); }
      }
      if (key === 'nyc' && a.award === 'us') { s += 5; why.push('the US-degree route (SUNY Empire State University)'); }

      // Awarding-country preference
      if (a.award === 'us' && key !== 'nyc') s -= 2;
      if (a.award === 'uk' && key === 'unic') s -= 2;
      if (a.award === 'uk' && (key === 'medc' || key === 'metro')) s += 0.5;

      if (subj === 'medicine' && key !== 'unic') s -= 2;

      out.push({ key: key, score: s, why: why });
    });
    out.sort(function (x, y) { return y.score - x.score; });
    return out;
  }

  function institutionReason(item) {
    var inst = INSTITUTIONS[item.key];
    var bits = item.why.slice(0, 2);
    var first = inst.pitch.charAt(0).toUpperCase() + inst.pitch.slice(1) + ', with ' + inst.awardText + '.';
    return first + (bits.length ? ' For you: ' + bits.join('; ') + '.' : '');
  }

  function budgetCeiling(k) { return { lt12: 12000, '12to18': 18000, '18to25': 25000 }[k] || Infinity; }

  function recommend(a) {
    var subj = subjectKey(a);
    var cards = [], notes = [];
    var level = a.level === 'unsure' ? 'bachelor' : a.level;
    var needsFoundation = level === 'foundation' ||
      (level === 'bachelor' && (a.english === 'none' || a.english === 'lt55'));

    // ---- programme areas
    var progIds = [];
    if (level === 'master') {
      progIds = pgCards(subj, a);
    } else {
      if (needsFoundation) progIds.push('foundation');
      progIds = progIds.concat(ugCards(subj));
    }
    progIds = progIds.slice(0, 2);
    progIds.forEach(function (id) {
      var p = PROGRAMMES[id];
      cards.push({ kind: 'Programme area', title: p.title, fact: p.fact, reason: programmeReason(id, a, subj),
                   href: p.anchor, cta: 'See it on the programmes page' });
    });

    // ---- institutions: fill up to three cards (at least one institution)
    var ranked = scoreInstitutions(a, subj);
    var slots = Math.max(1, 3 - cards.length);
    ranked.slice(0, slots).forEach(function (item) {
      var inst = INSTITUTIONS[item.key];
      cards.push({ kind: 'Institution · ' + inst.where, title: inst.name, fact: inst.fees.charAt(0).toUpperCase() + inst.fees.slice(1),
                   reason: institutionReason(item), href: 'programmes.html#institutions', cta: 'Compare the institutions' });
    });
    if (!ranked.length) {
      notes.push('None of the institutions on this site matched every answer — an advisor can look further.');
    }

    // ---- notes (English, subject caveats, budget, timing)
    if (level === 'master' && ieltsBelow6(a)) {
      notes.push('The master’s routes here ask for IELTS 6.0–6.5. EuroHellenic teaches IELTS preparation in-house — see <a href="about.html#support">tutoring</a>.');
    } else if (level === 'bachelor' && a.english === '55') {
      notes.push('IELTS 5.5 is half a band short of the usual 6.0. That gap is common and fixable — see <a href="about.html#support">IELTS tutoring</a>, or ask about the foundation year.');
    } else if (a.english === 'none' && level !== 'foundation') {
      notes.push('Plan to sit IELTS (or an equivalent) early; most degrees here ask for 6.0.');
    }
    // ---- cost estimate from the costs page calculator
    var tuition = level === 'master' ? TUITION.master : (level === 'foundation' ? null : TUITION.bachelor);
    var cost = null;
    var cityKeys = a.city === 'any' ? ['crete', 'thessaloniki', 'athens'] : [a.city];
    var totals = cityKeys.map(function (c) {
      return { city: c, living: CITY[c].monthly * 12, total: (tuition || 0) + CITY[c].monthly * 12 };
    });
    if (a.city === 'any') {
      cost = 'Indicative first year: about ' + euro(totals[0].total) + ' in Crete to ' + euro(totals[2].total) + ' in Athens' +
             (tuition ? ' (' + euro(tuition) + ' tuition plus a shared flat and typical living costs).' : ' in living costs, plus foundation tuition (confirm with the institution).');
    } else {
      var t = totals[0];
      cost = 'Indicative first year in ' + CITY[a.city].name + ': about ' + euro(t.total) +
             (tuition ? ' (' + euro(tuition) + ' tuition plus about ' + euro(CITY[a.city].monthly) + ' a month for a shared flat and typical living).'
                      : ' in living costs (about ' + euro(CITY[a.city].monthly) + ' a month), plus foundation tuition — confirm with the institution.');
    }

    var ceiling = budgetCeiling(a.budget);
    if (tuition && ceiling < Infinity) {
      var cheapest = totals.slice().sort(function (x, y) { return x.total - y.total; })[0];
      var mine = a.city === 'any' ? cheapest : totals[0];
      if (mine.total > ceiling) {
        var cheaper = ['crete', 'thessaloniki'].filter(function (c) {
          return c !== a.city && (tuition + CITY[c].monthly * 12) <= ceiling;
        });
        if (cheaper.length && a.city !== 'any') {
          notes.push('Your total budget is below the ' + CITY[a.city].name + ' estimate. ' +
            cheaper.map(function (c) { return CITY[c].name + ' (about ' + euro(tuition + CITY[c].monthly * 12) + ')'; }).join(' or ') +
            ' would fit more comfortably, if your programme is offered there.');
        } else {
          notes.push('Your total budget is tight: even the lowest-cost combination on this site comes to about ' + euro(cheapest.total) +
            ' for the first year. It is worth a frank conversation with an advisor before applying.');
        }
      }
    }
    if (subj === 'medicine') {
      notes.push('Medicine at the University of Nicosia is listed at €24,000 a year' +
        (a.tuition === 'gt12' ? '' : ', above the tuition range you chose') + '. Ask an advisor where it is taught and what entry requires.');
    }
    if (subj === 'health' || subj === 'medicine') {
      notes.push('Psychology and health professions are regulated nationally. If you plan to practise outside Greece, confirm the registration route with that country’s regulator first.');
    }
    if (subj === 'other' && a.subjectText) {
      notes.push('“' + esc(a.subjectText) + '” is not among the representative routes on this site, but the colleges run well over a hundred English-taught programmes. An advisor will check.');
    }
    if (subj === 'lawedu') {
      notes.push('Law and education are not among the representative routes listed; Metropolitan College is the institution this site names as strongest in them.');
    }

    if (a.tuition === 'lt7' && level === 'master') {
      notes.push('Where a two-year MSc structure is offered, the fee is typically split roughly €5,590 then €3,590, which spreads the cost.');
    }
    if (a.intake === 'next' || a.intake === 'autumn' || a.intake === 'spring') {
      notes.push('Start the visa paperwork early: a criminal-record certificate can take four to eight weeks, and a visa decision one to three months. <a href="costs-and-visa.html#visa">Visa steps</a>.');
    }
    if (a.intake === 'spring') {
      notes.push('Not every programme has a January/February start; an advisor will confirm which do.');
    }

    return { cards: cards.slice(0, 3), notes: notes.slice(0, 4), cost: cost };
  }

  /* ============================================================ HELPERS */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function euro(n) { return '€' + Math.round(n).toLocaleString('en-GB'); }
  function stepById(id) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i]; return null; }
  function chipFor(id, key) {
    var st = stepById(id);
    if (!st || !st.chips) return null;
    for (var i = 0; i < st.chips.length; i++) if (st.chips[i][0] === key) return st.chips[i];
    return null;
  }
  function label(id, key) { var c = chipFor(id, key); return c ? c[1] : ''; }
  function formLabel(id, key) { var c = chipFor(id, key); return c ? (c[2] || c[1]) : ''; }

  function load() {
    try {
      var raw = window.sessionStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return s && s.v === 1 ? s : null;
    } catch (e) { return null; }
  }
  function save() {
    try { window.sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }
  function clearStore() {
    try { window.sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  }

  /* ================================================================= OWL */
  // Hand-drawn owl in the site palette: navy disc, pale-blue body, flag-blue
  // wings, perched on an olive sprig (the olive is Athena's tree).
  var OWL = '' +
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="athena-owl">' +
      '<circle cx="32" cy="32" r="32" fill="#0b2a4a"/>' +
      '<path d="M9 52c10-3.5 30-4.5 46-1.5" fill="none" stroke="#8cc4f2" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M16 51.5c-3.5-1-5-3.6-4.2-6.2 3 .2 4.9 2.6 4.2 6.2z" fill="#8cc4f2"/>' +
      '<path d="M50 50.3c2.8-2 5.8-1.8 7.4.2-2.2 1.9-5.1 1.9-7.4-.2z" fill="#8cc4f2"/>' +
      '<ellipse cx="43.5" cy="54.2" rx="1.7" ry="2.2" fill="#e8eff7" transform="rotate(-20 43.5 54.2)"/>' +
      '<path d="M20.5 14.5l4.3 7.2c4.6-2.3 9.8-2.3 14.4 0l4.3-7.2c2.6 5.4 3.6 11.3 3.2 17.4-.6 10.7-6.8 17.8-14.7 18.4-7.9-.6-14.1-7.7-14.7-18.4-.4-6.1.6-12 3.2-17.4z" fill="#dbe9f6" stroke="#e8eff7" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M19.2 27.5c-2.8 5.6-2.4 14.2 3.1 19.5 1.2-6.3.6-13.1-3.1-19.5z" fill="#0d5eaf"/>' +
      '<path d="M44.8 27.5c2.8 5.6 2.4 14.2-3.1 19.5-1.2-6.3-.6-13.1 3.1-19.5z" fill="#0d5eaf"/>' +
      '<circle cx="26" cy="28.6" r="6.3" fill="#fff" stroke="#0d5eaf" stroke-width="1.4"/>' +
      '<circle cx="38" cy="28.6" r="6.3" fill="#fff" stroke="#0d5eaf" stroke-width="1.4"/>' +
      '<circle cx="26.6" cy="29" r="2.9" fill="#0b2a4a"/>' +
      '<circle cx="37.4" cy="29" r="2.9" fill="#0b2a4a"/>' +
      '<circle cx="27.6" cy="27.9" r=".9" fill="#fff"/>' +
      '<circle cx="38.4" cy="27.9" r=".9" fill="#fff"/>' +
      '<path d="M32 32.2l-2.2 2.6 2.2 3.2 2.2-3.2z" fill="#0a4a8a"/>' +
      '<path d="M27 40.5l2 1.6 2-1.6M33 40.5l2 1.6 2-1.6M30 44.2l2 1.6 2-1.6" fill="none" stroke="#0d5eaf" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M27.5 50.2l-.6 2.4M29.3 50.4l.1 2.4M34.7 50.4l-.1 2.4M36.5 50.2l.6 2.4" stroke="#8cc4f2" stroke-width="1.3" stroke-linecap="round"/>' +
    '</svg>';

  /* ================================================================== UI */
  var state = load() || fresh();
  var ui = {};
  var busy = false;     // true while Athena is "typing"
  var gen = 0;          // bumps on restart so pending typing timers are dropped
  var lastFocus = null;

  function fresh() { return { v: 1, step: 0, answers: {}, log: [], done: false, started: false }; }

  function build() {
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'athena-fab';
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'athena-panel');
    fab.innerHTML = '<span class="athena-fab__owl">' + OWL + '</span>' +
                    '<span class="athena-fab__label">Ask Athena</span>' +
                    '<span class="athena-fab__dot" aria-hidden="true"></span>';

    var panel = document.createElement('section');
    panel.className = 'athena';
    panel.id = 'athena-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'athena-title');
    panel.setAttribute('aria-describedby', 'athena-desc');
    panel.innerHTML =
      '<header class="athena__head">' +
        '<span class="athena__avatar">' + OWL + '</span>' +
        '<div class="athena__who">' +
          '<h2 class="athena__title" id="athena-title">Athena <span aria-hidden="true">&middot;</span><span class="sr-only">,</span> Goddess of Wisdom</h2>' +
          '<p class="athena__sub" id="athena-desc">Your study-match guide</p>' +
        '</div>' +
        '<button type="button" class="athena__icon" data-athena-restart aria-label="Start over">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<button type="button" class="athena__icon" data-athena-close aria-label="Close Athena">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="athena__log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with Athena" tabindex="-1"></div>' +
      '<div class="athena__controls"></div>' +
      '<form class="athena__composer" novalidate>' +
        '<label class="sr-only" for="athena-input">Your answer</label>' +
        '<input id="athena-input" type="text" autocomplete="off" disabled placeholder="Tap an answer above">' +
        '<button type="submit" class="athena__send" aria-label="Send" disabled>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</form>' +
      '<p class="athena__foot">Suggestions use the indicative figures on this site. No data leaves your browser until you choose to contact an advisor.</p>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    ui.fab = fab; ui.panel = panel;
    ui.log = panel.querySelector('.athena__log');
    ui.controls = panel.querySelector('.athena__controls');
    ui.form = panel.querySelector('.athena__composer');
    ui.input = panel.querySelector('#athena-input');
    ui.send = panel.querySelector('.athena__send');

    fab.addEventListener('click', open);
    panel.querySelector('[data-athena-close]').addEventListener('click', close);
    panel.querySelector('[data-athena-restart]').addEventListener('click', restart);
    panel.addEventListener('keydown', onKey);
    ui.form.addEventListener('submit', onSubmitText);
    ui.input.addEventListener('input', function () {
      ui.send.disabled = !ui.input.value.trim();
    });

    // Any element with data-athena-open (e.g. a CTA on a page) opens the panel
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-athena-open]');
      if (t) { e.preventDefault(); open(); }
    });

    window.addEventListener('resize', syncScrollLock);
    updateDot();
  }

  function isOpen() { return ui.panel && !ui.panel.hidden; }
  function isSmall() { return window.matchMedia('(max-width: 600px)').matches; }
  function syncScrollLock() {
    document.documentElement.classList.toggle('athena-lock', isOpen() && isSmall());
  }

  function open() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    ui.panel.hidden = false;
    ui.fab.setAttribute('aria-expanded', 'true');
    ui.fab.classList.add('is-hidden-fab');
    syncScrollLock();
    if (!ui.rendered) {
      ui.rendered = true;
      renderLog();
    }
    if (!state.started) {
      state.started = true;
      advance();
    } else if (!busy && !state.done && state.asked !== state.step) {
      advance();          // left mid-question on another page: ask it again
    } else {
      renderControls(true);
    }
    scrollDown();
    if (!busy) focusCurrent(); else ui.log.focus();
  }

  function close() {
    if (!isOpen()) return;
    ui.panel.hidden = true;
    ui.fab.setAttribute('aria-expanded', 'false');
    ui.fab.classList.remove('is-hidden-fab');
    syncScrollLock();
    updateDot();
    var back = lastFocus && document.contains(lastFocus) && lastFocus !== document.body ? lastFocus : ui.fab;
    // Return focus to the launcher unless the dialog was opened from another control
    (back.closest && back.closest('#athena-panel') ? ui.fab : back).focus();
  }

  function restart() {
    gen++;
    busy = false;
    state = fresh();
    clearStore();
    ui.log.innerHTML = '';
    ui.controls.innerHTML = '';
    state.started = true;
    advance();
  }

  function updateDot() {
    ui.fab.classList.toggle('has-progress', state.started && !state.done && state.log.length > 0);
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(
      ui.panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'),
      function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ui.log)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ------------------------------------------------------------- the log */
  function renderLog() {
    ui.log.innerHTML = '';
    state.log.forEach(function (m) { appendMessage(m, true); });
  }

  function appendMessage(m, restoring) {
    var row = document.createElement('div');
    row.className = 'athena-msg athena-msg--' + (m.r === 'user' ? 'user' : 'bot') + (restoring || reduced ? '' : ' is-new');
    if (m.r === 'summary') {
      row.classList.add('athena-msg--summary');
      row.innerHTML = '<span class="athena-msg__avatar" aria-hidden="true">' + OWL + '</span>' + summaryHTML();
    } else if (m.r === 'user') {
      row.innerHTML = '<span class="sr-only">You said: </span><div class="athena-bubble">' + m.h + '</div>';
    } else {
      row.innerHTML = '<span class="athena-msg__avatar" aria-hidden="true">' + OWL + '</span>' +
                      '<span class="sr-only">Athena: </span><div class="athena-bubble">' + m.h + '</div>';
    }
    ui.log.appendChild(row);
    if (m.r === 'summary') wireSummary(row);
    return row;
  }

  function push(m) {
    state.log.push(m);
    save();
    appendMessage(m, false);
    scrollDown();
  }

  function scrollDown() {
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function botSay(lines, done) {
    var myGen = gen;
    busy = true;
    ui.controls.innerHTML = '';
    setComposer(null);
    var i = 0;
    (function next() {
      if (myGen !== gen) return;
      if (i >= lines.length) { busy = false; if (done) done(); return; }
      var line = lines[i++];
      if (reduced) { push({ r: 'bot', h: line }); next(); return; }
      var typing = document.createElement('div');
      typing.className = 'athena-msg athena-msg--bot athena-typing';
      typing.setAttribute('aria-hidden', 'true');
      typing.innerHTML = '<span class="athena-msg__avatar">' + OWL + '</span><div class="athena-bubble"><i></i><i></i><i></i></div>';
      ui.log.appendChild(typing);
      scrollDown();
      var wait = Math.min(1100, 380 + line.replace(/<[^>]+>/g, '').length * 6);
      window.setTimeout(function () {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        if (myGen !== gen) return;
        push({ r: 'bot', h: line });
        next();
      }, wait);
    })();
  }

  /* ---------------------------------------------------------- the flow */
  function currentStep() {
    while (state.step < STEPS.length) {
      var st = STEPS[state.step];
      if (!st.when || st.when(state.answers)) return st;
      state.step++;
    }
    return null;
  }

  function advance() {
    var st = currentStep();
    if (!st) { finish(); return; }
    save();
    botSay(st.ask(state.answers), function () {
      state.asked = state.step;
      save();
      renderControls(false);
    });
  }

  function renderControls(fromOpen) {
    ui.controls.innerHTML = '';
    if (busy) return;
    if (state.done) { setComposer(null); return; }
    var st = currentStep();
    if (!st) return;

    if (st.chips) {
      var group = document.createElement('div');
      group.className = 'athena-chips';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Answer options');
      st.chips.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'athena-chip';
        b.textContent = c[1];
        b.addEventListener('click', function () { answer(st, c[0], c[1]); });
        group.appendChild(b);
      });
      ui.controls.appendChild(group);
    }
    if (st.input === 'text' && st.optional) {
      var g = document.createElement('div');
      g.className = 'athena-chips';
      var skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'athena-chip athena-chip--quiet';
      skip.textContent = st.skip || 'Skip';
      skip.addEventListener('click', function () { answer(st, '', st.skip || 'Skip'); });
      g.appendChild(skip);
      ui.controls.appendChild(g);
    }
    setComposer(st.input === 'text' ? st : null);
    scrollDown();
    if (!fromOpen && isOpen()) focusCurrent();
  }

  function focusCurrent() {
    if (!isOpen()) return;
    var target = !ui.input.disabled ? ui.input : ui.controls.querySelector('button') ||
                 ui.log.querySelector('.athena-summary .btn') || ui.panel.querySelector('[data-athena-close]');
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  function setComposer(st) {
    if (st) {
      ui.input.disabled = false;
      ui.input.placeholder = st.placeholder || 'Type your answer';
      ui.input.maxLength = st.maxlength || 80;
      ui.input.value = '';
      ui.send.disabled = true;
      ui.form.classList.remove('is-off');
    } else {
      ui.input.disabled = true;
      ui.input.value = '';
      ui.input.placeholder = state.done ? 'Use Start over to begin again' : 'Tap an answer above';
      ui.send.disabled = true;
      ui.form.classList.add('is-off');
    }
  }

  function onSubmitText(e) {
    e.preventDefault();
    var st = currentStep();
    var v = ui.input.value.trim();
    if (!st || st.input !== 'text' || !v || busy) return;
    answer(st, v.slice(0, st.maxlength || 80), v.slice(0, st.maxlength || 80));
  }

  function answer(st, value, shown) {
    if (busy) return;
    state.answers[st.id] = value;
    ui.controls.innerHTML = '';
    push({ r: 'user', h: esc(shown) });
    state.step++;
    save();
    advance();
  }

  function finish() {
    var who = state.answers.name ? ', ' + esc(state.answers.name) : '';
    botSay(['<span lang="el">Ευχαριστώ</span> (<em>efcharistó</em>)' + who + ' — thank you. Here is what I would look at first, based on what this site lists.'], function () {
      state.done = true;
      push({ r: 'summary' });
      save();
      updateDot();
      renderControls(false);
      var first = ui.log.querySelector('.athena-msg--summary');
      if (first) {
        // Show the top of the summary rather than its end
        ui.log.scrollTop += first.getBoundingClientRect().top - ui.log.getBoundingClientRect().top - 8;
      }
      focusCurrent();
    });
  }

  /* ------------------------------------------------------------- summary */
  function answerRows() {
    var a = state.answers;
    var rows = [];
    if (a.name) rows.push(['Name', esc(a.name)]);
    rows.push(['Level', label('level', a.level)]);
    rows.push(['Subject', a.subject === 'other' && a.subjectText ? esc(a.subjectText) : label('subject', a.subject)]);
    rows.push(['City', label('city', a.city)]);
    rows.push(['Tuition / yr', label('tuition', a.tuition)]);
    rows.push(['Total / yr', label('budget', a.budget)]);
    rows.push(['English', label('english', a.english)]);
    rows.push(['Degree from', label('award', a.award)]);
    if (a.level === 'master') rows.push(['Experience', label('experience', a.experience)]);
    rows.push(['Start', label('intake', a.intake)]);
    if (a.country) rows.push(['Lives in', esc(a.country)]);
    return rows;
  }

  function summaryHTML() {
    var a = state.answers;
    var rec = recommend(a);
    var h = '<div class="athena-summary">';
    h += '<p class="athena-summary__eyebrow">Your study-match summary</p>';
    h += '<h3 class="athena-summary__title">' + (a.name ? esc(a.name) + '’s shortlist' : 'Your shortlist') + '</h3>';

    h += '<ol class="athena-recs">';
    rec.cards.forEach(function (c) {
      h += '<li class="athena-rec">' +
             '<span class="athena-rec__kind">' + esc(c.kind) + '</span>' +
             '<h4>' + esc(c.title) + '</h4>' +
             '<p>' + esc(c.reason) + '</p>' +
             '<p class="athena-rec__fact">' + esc(c.fact) + '</p>' +
             '<a class="tlink" href="' + c.href + '">' + c.cta + ' <span class="arr" aria-hidden="true">&rarr;</span></a>' +
           '</li>';
    });
    h += '</ol>';

    h += '<div class="athena-summary__cost"><p>' + esc(rec.cost) + '</p>' +
         '<a class="tlink" href="costs-and-visa.html">Build your own estimate <span class="arr" aria-hidden="true">&rarr;</span></a></div>';

    if (rec.notes.length) {
      h += '<ul class="athena-notes">' + rec.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>';
    }

    h += '<details class="athena-answers"><summary>Your answers</summary><dl>' +
         answerRows().map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') +
         '</dl></details>';

    h += '<div class="athena-summary__actions">' +
           '<a class="btn btn--gold btn--block" href="' + contactHref(rec) + '">Send this to an advisor <span class="arr" aria-hidden="true">&rarr;</span></a>' +
           '<button type="button" class="btn btn--ghost btn--block" data-athena-restart-inline>Start over</button>' +
         '</div>';
    h += '<p class="athena-summary__small">Indicative 2026–27 figures from this site. Always confirm fees and entry requirements with the institution.</p>';
    h += '</div>';
    return h;
  }

  function wireSummary(row) {
    var b = row.querySelector('[data-athena-restart-inline]');
    if (b) b.addEventListener('click', restart);
  }

  function contactHref(rec) {
    var a = state.answers;
    var subjectText = a.subject === 'other' && a.subjectText ? a.subjectText : label('subject', a.subject);
    var lines = [
      'Hello, I used Athena on your website. My answers:',
      '- Study level: ' + label('level', a.level),
      '- Subject: ' + subjectText,
      '- Preferred city: ' + label('city', a.city),
      '- Tuition budget per year: ' + label('tuition', a.tuition),
      '- Total budget per year: ' + label('budget', a.budget),
      '- English: ' + label('english', a.english),
      '- Degree awarded by: ' + label('award', a.award)
    ];
    if (a.level === 'master') lines.push('- 3+ years work experience: ' + label('experience', a.experience));
    lines.push('- Start: ' + label('intake', a.intake));
    lines.push('', 'Athena suggested: ' + rec.cards.map(function (c) { return c.title; }).join('; ') + '.');
    lines.push('', 'My current qualifications and grades: ');

    var p = {
      from: 'athena',
      name: a.name || '',
      country: a.country || '',
      level: formLabel('level', a.level),
      intake: formLabel('intake', a.intake),
      english: formLabel('english', a.english),
      budget: formLabel('budget', a.budget),
      field: a.subject === 'unsure' ? '' : subjectText.replace('…', ''),
      message: lines.join('\n')
    };
    var q = Object.keys(p).filter(function (k) { return p[k]; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(p[k]); }).join('&');
    return 'contact.html?' + q;
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    if (document.getElementById('athena-panel')) return;
    build();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Exposed for automated checks (verify.py) only.
  window.EHAthena = { recommend: recommend, _state: function () { return state; } };
})();
