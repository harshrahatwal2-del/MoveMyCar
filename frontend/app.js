/* ===========================================================
   MoveMyCar — app.js
   This file has 4 sections:
     1. DATA & SMALL HELPERS  — images, shortcuts, tiny UI builders
     2. SCREENS (the "S" object) — the HTML for each of the 5 screens
     3. SCREEN LOGIC (the "init" object) — what happens when a
        screen's buttons/inputs are used
     4. THE ROUTER ("go" function) — swaps screens in and out
   =========================================================== */


/* ---------- 0. BACKEND CONNECTION ---------- */

// Where our Express server lives. Change this if you deploy the server
// somewhere else later (e.g. a real URL instead of localhost).
const API = 'http://localhost:4000';

// Keeps track of the alert we just created, so the "track" screen
// knows which one to poll.
let currentAlertId = null;

// Which vehicle the Register screen should pre-fill, if any.
// Set just before navigating there from an "Edit" button; read once by
// the register screen, then cleared, so the next visit starts blank again.
let editingVehicle = null;

// The vehicle list most recently fetched by loadGarage(), so the Edit
// button can look up full details by plate without another network call.
let lastLoadedVehicles = [];

// Called by a vehicle card's Edit button.
function editVehicleByPlate(plate) {
  editingVehicle = lastLoadedVehicles.find(v => v.plate === plate) || null;
  go('register');
}


/* ---------- 1. DATA & SMALL HELPERS ---------- */

// Placeholder photos, hotlinked from the Stitch mockups.
const IMG = {
  // Embedded directly (instead of hotlinked) so it can never 404 or expire.
  logo:  'data:image/png;base64,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',
  me:    'https://lh3.googleusercontent.com/aida-public/AB6AXuBXO5mRfEZORX1I_JChaimoBXJyClhhMAmFJp2WgaYih9cpGtgJxoP9doGg0JlVFApBnRlYo5-rkNlRZYg8sMt-Z7LRxtDqXPAsT5YommVabsGYcQgfZkBWhuzgfK-fqaEfSzpTUIMUunbC-cW8pwn8wshZ5Ne2wiXikhq67s7umbCeenMg0w6lagVTIUU5NuLxJr0Ywlrb1rBxtXO1QekJFT4VqnwEFXF3xC7-lF5KNz9p9bBdftyM',
  creta: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAO6DFZkLvuvgKZqX5ZCYzUcAGE6Mddg2f19TbQ5P3nmtNcza14-YeTX73qFU60bfFIPljswazRXbqkMNHTsaEjNp2GZl19WFTrMDU3R8r1PhgKYkTCoJU_yz2GaIHFhUuVcyhDpKGj085j6VqRvjVPGL7FIW8Jc6gdiSTNdcyMyB1m3MYh0LmY8cuEF-PSY3riiGPrkWcQj1ASWT4VAkzDGPV696athJL8acgaxh-0pSQCiWSnnzre',
  qr:    'https://lh3.googleusercontent.com/aida-public/AB6AXuAaDhrrt4pBDiaCbYDyySgiSqr5T5gdRA9hiASWcFHt9jz3PTWxPhC0KGcThUDWk_cXfjjrQGnID4bewWGFgu-j-o422Ob7eOw7CDQ54oxkNKS0saQ0JI2Wp6eEqnb0yFumPdd1Hmr4z9XU84wM2JVaAF6AoMFnJmBX5vcKvAizmCUOT73y8RlON7EGf3UdnD7SaUAcozZODUFzenLeqWc_vrgWtuVKuC89mFB9jlK5qWnJqdgm1hhq',
  block: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhcaawdEeOzEH0h9cMNeW9OopV64B6iA6VyG4qv0L3M1EgMhMK_gxHzwVyM5Gw_2cliJ_Y2Eh6ZFFu2fMVyck52O0jOGU1gwoeqR4CMJVuM1X7rmN8pz9o8JyoxQmRNhljNzcTuxWWc-a66wtRGL6YPW5F3oRa_yFvvusO9Od8jsdEr2F9m_yUBJ91J_3FuE4B2LLsVgxERYrSjClUhitkTxJO-LmCJXG1ASh-lsYnofrKfVAQzUBr'
};

// $('#id') is shorthand for document.querySelector('#id')
const $ = s => document.querySelector(s);

// Builds a Material Symbols icon span, e.g. ic('call') -> <span ...>call</span>
const ic = (name, extraClass = '') =>
  `<span class="material-symbols-outlined ${extraClass}">${name}</span>`;

// Builds an on/off toggle switch
const tog = (on = 1) =>
  `<button class="tg ${on ? 'on' : ''}" onclick="this.classList.toggle('on')" aria-label="toggle"><i></i></button>`;

// Builds the blue "IND" number-plate badge + whatever is passed as "inner"
const plateBox = inner =>
  `<div class="flex rounded-2xl border-2 border-ink overflow-hidden bg-white h-14 shadow-sm">
     <div class="w-11 bg-hsrp text-white text-[10px] font-bold flex flex-col items-center justify-center leading-none gap-0.5">${ic('flare', '!text-[16px]')}IND</div>
     ${inner}
   </div>`;

// A read-only plate display (used on the "My Cars" screen)
const plate = v => plateBox(
  `<div class="flex-1 px-3 flex items-center mono font-extrabold text-lg tracking-widest">${v}</div>`
);

// Builds one vehicle card's HTML from a vehicle row the server sent back,
// e.g. { plate: "KA01MJ8821", nickname: "White Creta", ownerName: "Rohan" }
const vehicleCard = v => `
  <article class="card p-4 space-y-3">
    <div class="flex justify-between items-start gap-2">
      <b class="text-xl">${v.nickname || 'Unnamed vehicle'}</b>
      <span class="text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full px-3 py-1.5 whitespace-nowrap">● Active</span>
    </div>
    ${plate(fmt(v.plate))}
    <div class="grid grid-cols-2 gap-2 text-sm font-semibold">
      <button onclick="editVehicleByPlate('${v.plate}')" class="bg-slate-100 rounded-xl py-3 flex flex-col items-center gap-1">${ic('edit')}Edit</button>
      <button onclick="toast('Alerts paused for ${v.nickname || v.plate}')" class="bg-slate-100 rounded-xl py-3 flex flex-col items-center gap-1">${ic('pause_circle')}Pause</button>
    </div>
  </article>`;

// Turns a millisecond duration into a short human phrase, e.g. "3m ago", "2h ago".
const timeAgo = ms => {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Builds one row of the "Recent alerts" list from a server alert row.
const alertRow = a => {
  const resolved = !!a.ownerReply;
  const icon = resolved ? 'check_circle' : 'hourglass_top';
  const iconColor = resolved ? 'text-emerald-600' : 'text-amb-d';
  const title = resolved ? 'Owner replied' : 'Waiting for owner';
  const detail = resolved
    ? `${timeAgo(Date.now() - a.createdAt)} · replied in ${Math.max(1, Math.round((a.ownerReplyAt - a.createdAt) / 60000))} min`
    : `${timeAgo(Date.now() - a.createdAt)} · no reply yet`;

  return `
    <div class="card p-4 flex items-center gap-3">
      <span class="${iconColor}">${ic(icon, '!text-[30px]')}</span>
      <div class="flex-1">
        <b>${title}</b>
        <p class="text-sm text-mute">${detail}${a.note ? ` · "${a.note}"` : ''}</p>
      </div>
      <span class="text-xs bg-slate-100 rounded-lg px-2 py-1 font-semibold mono">${fmt(a.plate)}</span>
    </div>`;
};

// Shows a small message at the bottom of the screen for ~2 seconds
const toast = msg => {
  const t = $('#toast');
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.opacity = 0), 2200);
};

// The top header bar, shared by every screen. `back` is the screen to return to.
const head = back => `
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur flex items-center justify-between px-4 h-16 border-b border-line">
    <div class="flex items-center gap-2">
      ${back ? `<button onclick="go('${back}')" class="w-10 h-10 grid place-items-center" aria-label="Back">${ic('arrow_back')}</button>` : ''}
      <img src="${IMG.logo}" alt="MoveMyCar" class="h-8">
    </div>
    <div class="flex items-center gap-3">
      <div class="flex bg-teal-l rounded-full p-1 text-xs font-bold">
        <button class="px-3 py-1.5 rounded-full bg-teal text-white">EN</button>
        <button class="px-3 py-1.5 text-teal" onclick="toast('Hindi translation comes in a later step')">हिंदी</button>
      </div>
      <img src="${IMG.me}" class="w-9 h-9 rounded-full object-cover border-2 border-white shadow" alt="Profile">
    </div>
  </header>`;

// The 4 bottom navigation tabs: [route, icon name, label]
const tabs = [
  ['home', 'notifications_active', 'Alert'],
  ['cars', 'directions_car', 'My Cars'],
  ['track', 'schedule', 'Activity'],
  ['register', 'verified_user', 'Trust & Set']
];

// Keeps track of any running timers/intervals so we can clear them
// when the user leaves a screen (otherwise old countdowns keep running).
let timers = [];
const clearTimers = () => { timers.forEach(clearInterval); timers.forEach(clearTimeout); timers = []; };


/* ---------- 2. SCREENS ---------- */
// Each function below returns the full HTML string for one screen.

const S = {

  home: () => `${head()}
    <main class="px-4 pt-5 space-y-5">
      <div>
        <span class="inline-flex items-center gap-1.5 bg-teal-l text-teal-d text-xs font-bold rounded-full px-3 py-1.5">
          <i class="w-2 h-2 rounded-full bg-amb"></i>0 phone numbers shared
        </span>
        <h1 class="text-[28px] leading-9 font-bold tracking-tight mt-3">
          Someone blocking your car?<br><span class="text-teal">Let them know in 10 seconds.</span>
        </h1>
        <p class="text-mute mt-2">Your number stays private. The owner gets an instant alert on WhatsApp and SMS.</p>
      </div>

      <section class="card p-4 space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="font-semibold flex items-center gap-2">${ic('directions_car')}Enter vehicle plate</h2>
          <button class="text-teal text-sm font-semibold" onclick="toast('QR scanner comes in a later step')">${ic('qr_code_scanner')} Scan QR</button>
        </div>
        ${plateBox(`<input id="plate" maxlength="13" autocomplete="off" placeholder="MH 02 AB 1234" class="flex-1 min-w-0 px-3 outline-none mono font-extrabold text-lg tracking-widest uppercase placeholder:text-slate-300">`)}
        <p id="det" class="hidden text-sm bg-teal-l/50 text-teal-d rounded-xl px-3 py-2">${ic('location_on', '!text-[18px]')} <span></span></p>
        <div class="grid grid-cols-2 gap-2" id="ctx">
          ${['Blocking my exit', 'Need to leave now', 'Double parked', 'Handbrake on?']
            .map((c, i) => `<button class="chip ${i ? '' : 'on'}">${c}</button>`).join('')}
        </div>
        <button id="notify" class="btn bg-teal text-white active:bg-teal-d">${ic('notifications_active')} Notify car owner</button>
      </section>

      <button onclick="go('register')" class="card p-4 flex items-center gap-3 w-full text-left">
        <span class="w-12 h-12 rounded-full bg-teal-l grid place-items-center text-teal">${ic('add_moderator')}</span>
        <span class="flex-1"><b class="block">Register my own vehicle</b><span class="text-sm text-mute">Get anonymous alerts when your car is blocking someone.</span></span>
        ${ic('chevron_right', 'text-mute')}
      </button>

      <section class="card p-4">
        <h2 class="font-bold mb-3">How it works</h2>
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          ${[['pin', 'Enter plate', 'No sign-up needed'],
             ['send', 'Alert sent', 'Instant masked ping'],
             ['key', 'Car moved', 'No arguments']]
            .map(x => `<div class="bg-slate-50 rounded-xl p-3"><div class="text-teal">${ic(x[0])}</div><b class="block text-sm mt-1">${x[1]}</b><span class="text-mute">${x[2]}</span></div>`).join('')}
        </div>
      </section>

      <p class="text-sm text-mute flex gap-2 px-1">${ic('shield', 'text-teal')}Neither your number nor the owner's identity is revealed. Calls and messages pass through a masked relay.</p>
      <p class="text-sm px-1">${ic('support_agent', 'text-amb-d')} Road helpline: <b class="mono">1073</b> (toll free)</p>
    </main>`,

  cars: () => `${head()}
    <main class="px-4 pt-5 space-y-4">
      <section class="rounded-2xl bg-teal-l/60 p-4 flex items-center gap-4">
        <img src="${IMG.me}" class="w-16 h-16 rounded-full object-cover border-4 border-white" alt="Rohan">
        <div class="flex-1"><b class="text-xl block">Hello Rohan</b><span class="text-sm text-teal-d">2 vehicles · numbers 100% masked</span></div>
      </section>

      <section class="card p-4 flex items-center gap-3">
        <span class="w-12 h-12 rounded-full bg-slate-100 grid place-items-center text-teal">${ic('notifications_active')}</span>
        <div class="flex-1"><b>Alerts are on</b><p class="text-sm text-mute">Via masked call and SMS</p></div>
        ${tog()}
      </section>

      <h2 class="font-bold flex items-center gap-2 pt-2">${ic('garage')} Your garage <span id="garageCount" class="text-mute text-sm font-normal"></span></h2>

      <!-- Vehicle cards get inserted here by loadGarage() in the init.cars logic below.
           Starts with a loading message, replaced once the server responds. -->
      <div id="garageList" class="space-y-4">
        <p class="text-mute text-sm px-1">Loading your vehicles…</p>
      </div>

      <button onclick="go('register')" class="btn bg-teal-l text-teal-d">${ic('add_circle')} Register another vehicle</button>

      <div class="flex justify-between items-center pt-2">
        <h2 class="font-bold">Recent alerts</h2>
        <button onclick="go('incoming')" class="text-teal text-sm font-semibold">Simulate incoming</button>
      </div>
      <!-- Alert cards get inserted here by loadAlerts() -->
      <div id="alertsList" class="space-y-3">
        <p class="text-mute text-sm px-1">Loading recent alerts…</p>
      </div>

      <p class="text-xs text-mute text-center flex gap-1 justify-center">${ic('lock', '!text-[16px]')} Phone numbers stay masked on every call and alert.</p>
    </main>`,

  register: () => {
    // Read whatever the Edit button set, then immediately clear it —
    // so if the user later taps "Register another vehicle" instead,
    // this screen starts blank rather than reusing stale data.
    const editing = editingVehicle;
    editingVehicle = null;

    const plateVal = editing ? fmt(editing.plate) : '';
    const nicknameVal = editing ? (editing.nickname || '') : '';
    const phoneVal = editing ? (editing.phone || '') : '';

    return `${head('cars')}
    <main class="px-4 pt-5 space-y-4">
      <div class="flex items-center gap-2 text-xs font-bold text-mute">
        ${['Verified', 'Vehicle', 'Alerts'].map((s, i) => `<div class="flex-1"><div class="h-1.5 rounded-full ${i < 2 ? 'bg-teal' : 'bg-slate-200'}"></div><span class="${i == 1 ? 'text-teal' : ''}">${s}</span></div>`).join('')}
      </div>

      <section class="card p-4 space-y-4">
        <div class="flex justify-between items-center"><h1 class="text-xl font-bold">${editing ? 'Edit vehicle' : 'New vehicle'}</h1><span class="text-xs font-bold bg-teal-l text-teal-d rounded-full px-3 py-1.5">Privacy safe</span></div>
        <label class="block text-sm font-semibold">Registration number
          ${plateBox(`<input id="regPlate" value="${plateVal}" placeholder="MH 02 AB 1234" class="mt-0 flex-1 min-w-0 px-3 outline-none mono font-extrabold text-lg tracking-widest uppercase placeholder:text-slate-300">`)}
        </label>
        <div>
          <p class="text-sm font-semibold mb-2">Vehicle type</p>
          <div class="grid grid-cols-2 gap-2" id="cls">
            ${['Sedan', 'SUV / MUV', 'Hatchback', 'Two-wheeler'].map((c, i) => `<button class="chip ${i == 1 ? 'on' : ''}">${c}</button>`).join('')}
          </div>
        </div>
        <label class="block text-sm font-semibold">Nickname<input id="regNickname" value="${nicknameVal}" placeholder="e.g. White Creta / Office commute" class="mt-1 w-full h-12 bg-slate-100 rounded-xl px-3 font-normal outline-none placeholder:text-slate-400"></label>
        <label class="block text-sm font-semibold">Owner phone number (for alerts)
          <input id="regPhone" value="${phoneVal}" placeholder="+91 98765 43210" type="tel" class="mt-1 w-full h-12 bg-slate-100 rounded-xl px-3 font-normal outline-none placeholder:text-slate-400">
        </label>
        <p class="text-xs text-mute -mt-2">Include the country code (e.g. +91 for India) so real alerts can reach this number.</p>
        <div>
          <p class="text-sm font-semibold mb-2">Colour</p>
          <div class="flex gap-3" id="col">
            ${['#fff', '#0F172A', '#94A3B8', '#B91C1C', '#1D4ED8'].map((c, i) => `<button style="background:${c}" class="w-11 h-11 rounded-full border-2 ${i ? 'border-line' : 'border-teal ring-2 ring-teal/30'}"></button>`).join('')}
          </div>
        </div>
      </section>

      <section class="card p-4 space-y-3">
        <h2 class="text-xl font-bold">How should we reach you?</h2>
        ${[['chat', 'WhatsApp', 'One-tap reply templates', 1],
           ['sms', 'SMS alerts', 'Works in basements', 1],
           ['call', 'Masked call relay', 'Your number is never shown', 1]]
          .map(r => `<div class="bg-slate-50 rounded-xl p-3 flex items-center gap-3"><span class="text-teal">${ic(r[0])}</span><div class="flex-1"><b class="text-sm">${r[1]}</b><p class="text-xs text-mute">${r[2]}</p></div>${tog(r[3])}</div>`).join('')}
        <div class="bg-slate-50 rounded-xl p-3"><b class="text-sm">${ic('bedtime')} Quiet hours</b><p class="text-sm mt-1">11:00 PM to 6:00 AM · emergencies only</p></div>
        <div class="bg-slate-50 rounded-xl p-3 flex justify-between items-center"><div><b class="text-sm">Backup contact</b><p class="text-sm text-mute">+91 98765 43210 · Spouse</p></div><span class="text-xs font-bold bg-amber-100 text-amb-d rounded-full px-2 py-1">after 3 min</span></div>
      </section>

      <section class="rounded-2xl bg-teal text-white p-4 flex items-center gap-3">
        <div class="flex-1"><b class="text-lg">Free waterproof QR tag</b><p class="text-sm text-teal-l">Delivered by India Post</p></div>
        <img src="${IMG.qr}" class="w-20 h-14 rounded-lg object-cover bg-white" alt="QR tag">
      </section>

      <div class="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4">
        <button id="saveVehicle" class="btn bg-teal text-white shadow-lg">${ic('qr_code_2')} Save vehicle</button>
      </div>
    </main>`;
  },

  track: () => `${head('home')}
    <main class="px-4 pt-5 space-y-4">
      <div id="ack" class="hidden rounded-2xl bg-emerald-700 text-white p-4">
        <span class="text-xs font-bold opacity-80">OWNER REPLIED</span>
        <p class="text-lg font-semibold mt-1">"Coming down now, taking the lift. 4 mins."</p>
      </div>

      <section class="card p-4 space-y-3">
        <div class="flex justify-between items-center">
          <b class="text-teal flex items-center gap-2">${ic('circle', '!text-[14px]')} <span id="st">Alert sending</span></b>
          <span class="text-xs bg-slate-100 rounded-full px-3 py-1.5 mono font-bold">REF #BL-8924</span>
        </div>
        <div class="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
          <div class="flex-1"><p class="text-xs text-mute">Target vehicle</p><b class="mono tracking-widest">MH 02 AB 12••</b></div>
          <span class="text-xs font-bold bg-teal-l text-teal-d rounded-full px-3 py-1.5">${ic('verified', '!text-[16px]')} Verified</span>
        </div>
      </section>

      <section class="card p-4">
        <h2 class="font-bold text-lg mb-3">Live progress</h2>
        <ol id="steps" class="space-y-4">
          ${[['send', 'Alert sent', 'Encrypted message sent to the owner.'],
             ['done_all', 'Delivered', 'WhatsApp and SMS delivered.'],
             ['visibility', 'Seen by owner', 'Owner opened the alert.'],
             ['directions_car', 'Owner is coming', 'ETA about 4 min.']]
            .map((s, i) => `<li data-i="${i}" class="flex gap-3 opacity-30 transition"><span class="w-9 h-9 rounded-full bg-teal text-white grid place-items-center flex-none">${ic(s[0], '!text-[18px]')}</span><div><b>${s[1]}</b><p class="text-sm text-mute">${s[2]}</p></div></li>`).join('')}
        </ol>
      </section>

      <section class="card p-4 flex items-center gap-4">
        <div class="w-20 h-20 rounded-full border-[6px] border-amb grid place-items-center mono font-bold ping" id="esc">04:15</div>
        <div><b class="text-amb-d">Auto-call in <span id="esc2">04:15</span></b><p class="text-sm text-mute">If the car hasn't moved, the owner gets an automated phone call.</p></div>
      </section>

      <button onclick="toast('Masked call needs the telephony backend')" class="btn bg-teal text-white">${ic('call')} Call owner (masked)</button>
      <button id="rem" disabled class="btn bg-slate-100 text-mute">Send gentle reminder</button>

      <div class="card p-4 flex items-center gap-3">
        <div class="flex-1"><b>Still stuck?</b><p class="text-sm text-mute">Traffic police helpline and towing</p></div>
        <a href="tel:103" class="bg-red-700 text-white font-bold rounded-xl px-4 py-3">${ic('call', '!text-[18px]')} 103</a>
      </div>
    </main>`,

  incoming: () => `${head('cars')}
    <main class="px-4 pt-5 space-y-4">
      <div class="rounded-2xl bg-red-100 text-red-900 p-4">
        <span class="text-xs font-bold">${ic('notifications_active', '!text-[18px]')} HIGH PRIORITY</span>
        <h1 class="text-2xl font-bold mt-1">Your car <span class="mono">KA 01 MJ 8821</span> is blocking someone</h1>
        <p class="text-sm mt-1">Received via verified SMS and WhatsApp. Reply needed.</p>
      </div>

      <section class="card p-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold bg-amb rounded-lg px-3 py-2">Blocking driveway / gate</span>
          <span class="text-sm text-mute">${ic('schedule', '!text-[18px]')} 2 mins ago</span>
        </div>
        <div class="bg-slate-50 rounded-xl p-3 flex gap-3">
          <span class="w-10 h-10 rounded-full bg-red-700 text-white grid place-items-center flex-none">${ic('medical_services', '!text-[20px]')}</span>
          <p class="italic">"Need to take my mother to the hospital urgently, please move your vehicle."</p>
        </div>
        <p class="text-sm text-mute">${ic('location_on', '!text-[18px]')} 8th Main, 4th Block, Koramangala, Bengaluru</p>
        <div class="grid grid-cols-2 gap-2">
          <img src="${IMG.block}" class="h-28 w-full object-cover rounded-xl" alt="Proof photo">
          <div class="h-28 rounded-xl bg-teal-l grid place-items-center text-teal-d text-sm font-bold">${ic('near_me')} Location confirmed</div>
        </div>
      </section>

      <p class="text-sm bg-teal-l/50 rounded-xl p-3">${ic('shield', 'text-teal')} <b>Both sides stay private.</b> Replying now tells the driver instantly and avoids a police or towing escalation.</p>

      <button onclick="reply('Coming down now')" class="btn bg-emerald-800 text-white">${ic('directions_run')} Coming down now (within 5 mins)</button>
      <button onclick="reply('Coming in 10 mins')" class="btn bg-teal-d text-white">${ic('timer')} Coming in 10 mins</button>
      <button onclick="reply('Custom note sent')" class="btn bg-slate-100 text-ink">${ic('chat')} Can't move right now</button>
      <button onclick="toast('Masked call needs the telephony backend')" class="btn bg-white border border-line text-teal-d">${ic('call')} Call reporting driver (masked)</button>
      <button onclick="toast('Report submitted');go('cars')" class="block mx-auto text-sm underline text-mute pt-2">Not my car / Report abuse</button>
    </main>`
};


/* ---------- 3. SCREEN LOGIC ---------- */

// Called when the owner taps a quick-reply button on the "incoming" screen
function reply(msg) {
  toast(msg + '. Driver notified.');
  setTimeout(() => go('cars'), 900);
}

// Formats raw typed text into "MH 02 AB 1234" as the user types
const fmt = v => {
  v = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = v.match(/^([A-Z]{0,2})(\d{0,2})([A-Z]{0,3})(\d{0,4})/);
  return m.slice(1).filter(Boolean).join(' ');
};

// Just enough state codes to demo the "state detected" hint
const states = { MH: 'Maharashtra', KA: 'Karnataka', DL: 'Delhi', TN: 'Tamil Nadu', GJ: 'Gujarat', UP: 'Uttar Pradesh' };

// Each function here wires up the interactive bits of ONE screen.
// It runs right after that screen's HTML is inserted into the page.
// Fetches the real vehicle list from the backend and fills in the
// "My Cars" screen's garage section. Separate named function (rather than
// stuffed inline into init.cars) just so it reads clearly on its own.
async function loadGarage() {
  const list = $('#garageList');
  const count = $('#garageCount');

  try {
    const res = await fetch(`${API}/api/vehicles`);
    if (!res.ok) throw new Error('Server error');
    const { vehicles } = await res.json();

    count.textContent = `· ${vehicles.length} registered`;
    lastLoadedVehicles = vehicles; // remembered so Edit buttons can find full details

    list.innerHTML = vehicles.length
      ? vehicles.map(vehicleCard).join('')
      : `<p class="text-mute text-sm px-1">No vehicles yet. Register one below.</p>`;
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p class="text-red-700 text-sm px-1">Could not load your vehicles. Is the server running on localhost:4000?</p>`;
  }
}

// Fetches recent alerts from the backend and fills in the
// "Recent alerts" section of the "My Cars" screen.
async function loadAlerts() {
  const list = $('#alertsList');
  try {
    const res = await fetch(`${API}/api/alerts`);
    if (!res.ok) throw new Error('Server error');
    const { alerts } = await res.json();

    list.innerHTML = alerts.length
      ? alerts.map(alertRow).join('')
      : `<p class="text-mute text-sm px-1">No alerts yet. Report a car to see activity here.</p>`;
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p class="text-red-700 text-sm px-1">Could not load alerts. Is the server running on localhost:4000?</p>`;
  }
}

const init = {

  cars() {
    loadGarage(); // fire-and-forget: both update the screen once data arrives
    loadAlerts();
  },

  home() {
    const p = $('#plate'), d = $('#det');
    p.oninput = () => {
      p.value = fmt(p.value);
      const s = states[p.value.slice(0, 2)];
      d.classList.toggle('hidden', !s);
      d.querySelector('span').textContent = 'Detected: ' + s;
    };
    $('#ctx').onclick = e => {
      if (e.target.matches('.chip')) {
        [...$('#ctx').children].forEach(c => c.classList.remove('on'));
        e.target.classList.add('on');
      }
    };
    $('#notify').onclick = async () => {
      if (p.value.replace(/\s/g, '').length < 6) {
        toast('Enter a full plate number');
        return p.focus();
      }

      const activeChip = $('#ctx .chip.on');
      const btn = $('#notify');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      try {
        // Ask the real backend to create an alert, instead of pretending.
        const res = await fetch(`${API}/api/alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate: p.value,
            urgency: activeChip ? activeChip.textContent : 'Can wait',
            note: ''
          })
        });

        if (!res.ok) throw new Error('Server rejected the alert');
        const data = await res.json();

        currentAlertId = data.alert.id; // remember it for the track screen

        // Let the person know right away if the real SMS didn't go out —
        // the alert itself is still saved either way, this is just visibility.
        if (data.notification && !data.notification.sent) {
          toast('Alert saved, but SMS not sent: ' + data.notification.reason);
          timers.push(setTimeout(() => go('track'), 1600)); // give them a moment to read it
        } else {
          go('track');
        }
      } catch (err) {
        console.error(err);
        toast('Could not reach the server. Is it running on localhost:4000?');
        btn.disabled = false;
        btn.innerHTML = `${ic('notifications_active')} Notify car owner`;
      }
    };
  },

  register() {
    ['cls', 'col'].forEach(id =>
      $('#' + id).onclick = e => {
        const b = e.target.closest('button');
        if (!b) return;
        [...$('#' + id).children].forEach(c => {
          c.classList.remove('on', 'border-teal', 'ring-2', 'ring-teal/30');
          if (id == 'col') c.classList.add('border-line');
        });
        b.classList.add(id == 'cls' ? 'on' : 'border-teal');
        if (id == 'col') {
          b.classList.remove('border-line');
          b.classList.add('ring-2', 'ring-teal/30');
        }
      }
    );

    $('#saveVehicle').onclick = async () => {
      const plate = $('#regPlate').value;
      const nickname = $('#regNickname').value;
      const phone = $('#regPhone').value.trim();
      const btn = $('#saveVehicle');

      if (plate.replace(/\s/g, '').length < 6) {
        return toast('Enter a full plate number');
      }
      if (phone && !phone.startsWith('+')) {
        return toast('Phone number should start with a country code, e.g. +91');
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        const res = await fetch(`${API}/api/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plate, nickname, phone })
        });
        if (!res.ok) throw new Error('Server rejected the vehicle');

        toast('Vehicle saved');
        go('cars');
      } catch (err) {
        console.error(err);
        toast('Could not reach the server. Is it running on localhost:4000?');
        btn.disabled = false;
        btn.innerHTML = `${ic('qr_code_2')} Save vehicle`;
      }
    };
  },

  track() {
    if (!currentAlertId) {
      // If someone lands on this screen directly (e.g. refreshed the page)
      // there's no alert to track, so send them back to report one.
      toast('No active alert. Report a car first.');
      return go('home');
    }

    const li = [...document.querySelectorAll('#steps li')];
    // Maps the backend's status string to how many timeline steps to light up.
    const stepIndexFor = status => ({ sent: 0, delivered: 1, seen: 2, owner_responded: 3 }[status] ?? 0);
    const stepLabel = ['Alert sent', 'Delivered', 'Seen by owner', 'Owner is coming'];

    // Ask the server for the latest status, once per second, until we leave this screen.
    const poll = async () => {
      try {
        const res = await fetch(`${API}/api/alerts/${currentAlertId}`);
        if (!res.ok) throw new Error('Alert not found');
        const { status, escalationSecondsLeft, alert } = await res.json();

        const stepIndex = stepIndexFor(status);
        li.forEach((item, i) => { item.style.opacity = i <= stepIndex ? 1 : 0.3; });
        $('#st').textContent = stepLabel[stepIndex];

        if (status === 'owner_responded') {
          $('#ack').classList.remove('hidden');
          $('#ack').querySelector('p').textContent = `"${alert.ownerReply || 'Coming down now, taking the lift. 4 mins.'}"`;
        }

        const t = String(escalationSecondsLeft / 60 | 0).padStart(2, '0') + ':' + String(escalationSecondsLeft % 60).padStart(2, '0');
        $('#esc').textContent = t;
        $('#esc2').textContent = t;
      } catch (err) {
        console.error(err);
        toast('Lost connection to the server.');
      }
    };

    poll(); // run once immediately, then every second
    timers.push(setInterval(poll, 1000));

    // "Send reminder" cooldown — still a simple local timer, since the
    // backend doesn't need to know about this yet.
    let r = 134;
    const b = $('#rem');
    timers.push(setInterval(() => {
      if (r > 0) {
        r--;
        b.textContent = `Send gentle reminder (wait ${r / 60 | 0}m ${r % 60}s)`;
      } else {
        b.disabled = false;
        b.className = 'btn bg-amb-d text-white';
        b.textContent = 'Send gentle reminder';
        b.onclick = () => toast('Reminder sent');
      }
    }, 1000));
  }
};


/* ---------- 4. THE ROUTER ---------- */

// Swaps the visible screen. `route` is one of: home, cars, register, track, incoming
function go(route) {
  clearTimers();
  $('#app').innerHTML = S[route]();
  init[route] && init[route]();
  scrollTo(0, 0);

  // Highlight the matching bottom-nav tab ("incoming" highlights "cars")
  const activeTab = route == 'incoming' ? 'cars' : route;
  $('#nav').innerHTML = tabs.map(t =>
    `<button onclick="go('${t[0]}')" class="flex-1 flex flex-col items-center gap-0.5 py-1 text-xs font-semibold ${t[0] == activeTab ? 'text-teal' : 'text-mute'}">${ic(t[1])}${t[2]}</button>`
  ).join('');

  history.replaceState(null, '', '#' + route);
}

// Start on whichever screen is in the URL's hash, or "home" by default
go(S[location.hash.slice(1)] ? location.hash.slice(1) : 'home');
