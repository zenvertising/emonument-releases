// Builds, OTA updates and runtime dates come from the tablet repo's release mirror
// (.github/workflows/release-mirror.yml); releases.json here only adds notes.
const BUILDS_BASE = "https://zenvertising.github.io/emonument-builds";
const ENROLL_URL =
  "https://expo.dev/register-device/97592745-bf49-49b3-95b4-be7fcc0ccc5a";
const ITMS_PREFIX = "itms-services://?action=download-manifest&url=";
const CHANNELS = ["production", "preview"];

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const getJson = (url) =>
  fetch(url, { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

const longDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
const shortDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
      })
    : "";
const code = (id) => esc((id || "").slice(0, 8));
const updates = (n) => `${n} ${n === 1 ? "actualizare" : "actualizări"}`;

// Newest runtime first: "0.13.0" before "0.9.0".
const byRuntimeDesc = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
  }
  return 0;
};

const ua = navigator.userAgent;
const device =
  /iPad|iPhone|iPod/.test(ua) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    ? "ios"
    : /Android/.test(ua)
      ? "android"
      : null;

const cache = {};
function loadChannel(channel) {
  cache[channel] ??= Promise.all([
    getJson(`${BUILDS_BASE}/latest/${channel}/ios.json`),
    getJson(`${BUILDS_BASE}/latest/${channel}/android.json`),
    getJson(`${BUILDS_BASE}/updates/${channel}.json`),
    getJson(`${BUILDS_BASE}/runtimes/${channel}.json`),
  ]).then(([ios, android, feed, runtimes]) => ({
    ios,
    android,
    updates: feed ? feed.updates : [],
    runtimes: runtimes ? runtimes.runtimes : [],
  }));
  return cache[channel];
}

// Platform marks from Simple Icons (CC0).
const GLYPHS = {
  ios: '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
  android:
    '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5 18.5 12 13 17.5"/></svg>',
  qr: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 18.5v2M18.5 14h2"/></svg>',
};

function installLink(platform, label, pointer) {
  const url = pointer.installUrl || "";
  const itms = url.startsWith(ITMS_PREFIX);
  const safe =
    url.startsWith("https://") ||
    url.startsWith(ITMS_PREFIX + encodeURIComponent("https://"));
  // iOS installs through Safari's own prompt; a new tab would break it.
  const target = itms ? "" : ' target="_blank" rel="noopener"';
  return `<a class="btn" href="${safe ? esc(url) : "#"}"${target}>${GLYPHS[platform]}<span><small>Descarcă pentru</small>${label}</span></a>`;
}

// The visitor's own platform comes first and solid; on a desktop both are equal.
function installButtons(data) {
  const links = [];
  if (data.ios)
    links.push(["ios", installLink("ios", "iPad și iPhone", data.ios)]);
  if (data.android)
    links.push(["android", installLink("android", "Android", data.android)]);
  links.sort(([a], [b]) => (b === device) - (a === device));
  return links
    .map(([, html], i) =>
      html.replace(
        'class="btn"',
        `class="btn ${device && i > 0 ? "btn-quiet" : "btn-primary"}"`,
      ),
    )
    .join("");
}

// iPads and iPhones must be registered once before an Ad Hoc build installs on them, and
// the registration link only works when opened on the device being enrolled.
const showsEnroll = (data) => !!data.ios && device !== "android";

function enrollSteps() {
  const onComputer = device
    ? ""
    : '<p class="hint">Pe computer, pagina de înregistrare îți arată propriul cod QR; scanează-l cu iPad-ul sau iPhone-ul.</p>';
  return `
    <section class="enroll" aria-labelledby="enroll-title">
      <h2 id="enroll-title">Prima instalare pe iPad sau iPhone?</h2>
      <p class="enroll-lede">Se face o singură dată pentru fiecare dispozitiv. După aprobare, instalezi aplicația folosind <a href="#actions">butoanele de mai sus</a>.</p>
      <ol class="track">
        <li class="is-action"><span class="dot">1</span><div>
          <h3>Înregistrează dispozitivul</h3>
          <p>Deschide link-ul chiar pe iPad-ul sau iPhone-ul pe care instalezi și urmează pașii din pagina care se deschide.</p>
          <a class="cta" href="${ENROLL_URL}" target="_blank" rel="noopener">Înregistrează dispozitivul ${GLYPHS.arrow}</a>
          <a class="to-guide" href="#inregistrare">Pașii explicați în română</a>
          ${onComputer}
        </div></li>
        <li class="is-wait"><span class="dot">${GLYPHS.clock}</span><div>
          <h3>Așteaptă aprobarea Apple</h3>
          <p>De obicei, dispozitivul e aprobat până a doua zi. Poate dura până la 3 zile.</p>
          <span class="badge">1–3 zile</span>
        </div></li>
        <li><span class="dot">3</span><div>
          <h3>Instalează din Safari</h3>
          <p>Deschide această pagină în Safari și atinge „Descarcă pentru iPad și iPhone”. Dacă apare mesajul „Unable to Install”, dispozitivul nu a fost încă aprobat: mai încearcă a doua zi.</p>
          <a class="to-actions" href="#actions">Mergi la butonul de descărcare</a>
        </div></li>
      </ol>
      ${enrollGuide()}
    </section>`;
}

// The Expo registration page is English-only; this walks through it screen by screen.
function enrollGuide() {
  const ui = (ro, en) => `<kbd>${ro}</kbd>${en ? ` <span class="en">(${en})</span>` : ""}`;
  const shot = (file, alt) =>
    `<figure class="shot"><img src="assets/guide/${file}.svg" alt="${alt}" width="240" height="260" loading="lazy" /></figure>`;
  return `
    <details class="guide" id="inregistrare">
      <summary><h3>Cum înregistrezi iPad-ul sau iPhone-ul</h3><span class="caret" aria-hidden="true"></span></summary>
      <ol class="guide-steps">
        <li><div>
          <h3>Deschide link-ul pe dispozitiv, în Safari</h3>
          <p>Folosește iPad-ul sau iPhone-ul pe care vrei să instalezi aplicația. Dacă link-ul se deschide pe computer, pagina îți arată un cod QR: scanează-l cu aplicația Cameră și atinge notificarea care apare.</p>
          <a class="cta" href="${ENROLL_URL}" target="_blank" rel="noopener">Deschide pagina de înregistrare ${GLYPHS.arrow}</a>
        </div></li>
        <li class="has-shot"><div>
          <h3>Descarcă profilul</h3>
          <p>Atinge ${ui("Download profile")}. În fereastra care apare, atinge ${ui("Permiteți", "Allow")}.</p>
        </div>${shot("allow", "Fereastra Safari care cere permisiunea de a descărca profilul, cu butonul Permiteți evidențiat")}</li>
        <li class="has-shot"><div>
          <h3>Deschide Configurări</h3>
          <p>Deschide aplicația ${ui("Configurări", "Settings")} și atinge ${ui("Profil descărcat", "Profile Downloaded")}, aproape de începutul listei. Pe unele dispozitive, rândul se numește ${ui("Înscrieți-vă în …", "Enroll in …")}.</p>
          <p class="aside">Nu apare? Îl găsești și în ${ui("General")} → ${ui("VPN și gestionare dispozitive", "VPN &amp; Device Management")}.</p>
        </div>${shot("settings", "Aplicația Configurări, cu rândul Profil descărcat evidențiat sub numele contului")}</li>
        <li class="has-shot"><div>
          <h3>Instalează profilul</h3>
          <p>Atinge ${ui("Instalați", "Install")} în colțul din dreapta sus, introdu codul de deblocare al dispozitivului și confirmă. Urmează instrucțiunile de pe ecran până la capăt.</p>
          <p class="aside">Pe iPhone, dacă funcția ${ui("Protecție dispozitiv furat", "Stolen Device Protection")} este activă și nu ești acasă sau la birou, instalarea e blocată. Dezactiveaz-o temporar (o găsești căutând-o în Configurări) și reactiveaz-o după instalare.</p>
        </div>${shot("install", "Ecranul de instalare a profilului, cu butonul Instalați din dreapta sus evidențiat")}</li>
        <li class="is-done"><div>
          <h3>Gata, dispozitivul este înregistrat</h3>
          <p>Urmează aprobarea Apple: de obicei până a doua zi, cel mult 3 zile. Apoi revino pe această pagină în Safari și <a href="#actions">descarcă aplicația</a>.</p>
        </div></li>
      </ol>
      <p class="guide-note"><strong>Ai la dispoziție 8 minute.</strong> Dacă nu instalezi profilul în 8 minute de la descărcare, este șters automat și trebuie descărcat din nou. Poți avea un singur profil în așteptare: unul descărcat ulterior îl înlocuiește pe primul.</p>
    </details>`;
}

// Opens a code for this page on another screen, so the device lands on the same channel.
// Kept behind a button so it isn't mistaken for the QR on the Expo registration page.
const PAGE_QR = `
  <div class="page-qr">
    <button type="button" class="page-qr-toggle" aria-expanded="false" aria-controls="page-qr-panel">${GLYPHS.qr}<span>Deschide pe<br />tabletă sau telefon</span></button>
    <div class="page-qr-panel" id="page-qr-panel" role="dialog" aria-labelledby="page-qr-title" hidden>
      <div class="qr-code"></div>
      <div>
        <h3 id="page-qr-title">Deschide pe tabletă sau telefon</h3>
        <p>Scanează codul cu camera dispozitivului.</p>
      </div>
    </div>
  </div>`;

function hero(channel, data) {
  const pointers = [data.ios, data.android].filter(Boolean);
  const preview = channel === "preview";
  const title = preview ? "Instalează versiunea de test" : "Instalează Heritas";
  const chip = `<span class="chip">${preview ? "Canal de test" : "Canal de producție"}</span>`;
  if (!pointers.length)
    return `<section class="card hero">${chip}<h1>${title}</h1><p class="lede">Nu există încă o versiune publicată.</p></section>`;
  const warn = preview
    ? '<p class="warn"><strong>Server de test.</strong> Datele introduse în această versiune nu ajung în sistemul de producție.</p>'
    : "";
  const enroll = showsEnroll(data) ? enrollSteps() : "";
  const qr = onDesktop();
  return `
    <section class="card hero${preview ? " is-preview" : ""}${qr ? " has-qr" : ""}">
      ${warn}
      ${qr ? PAGE_QR : ""}
      ${chip}
      <h1>${title}</h1>
      <dl class="facts"><div><dt>Versiunea</dt><dd>${esc(pointers[0].runtimeVersion)}</dd></div></dl>
      <div class="actions" id="actions">${installButtons(data)}</div>
      ${showsEnroll(data) ? '<p class="ios-note">Pe iPad și iPhone, aplicația se instalează doar dacă dispozitivul a fost <a href="#inregistrare">înregistrat în prealabil</a>.</p>' : ""}
      ${enroll}
    </section>`;
}

const STEPS = `
  <section class="steps">
    <h2>Cum se instalează actualizările</h2>
    <ol>
      <li class="card"><span class="n">1</span><p>Actualizările OTA ajung direct în aplicație, prin internet, fără reinstalare. Aplicația le caută automat la pornire și când revii în ea.</p></li>
      <li class="card"><span class="n">2</span><p>Când apare mesajul „Actualizare disponibilă”, apasă „Repornește acum”.</p></li>
      <li class="card"><span class="n">3</span><p>Verifică versiunea instalată în Setări &amp; Profil → Aplicație. Codul de la „Actualizare OTA” îl găsești și în istoricul de mai jos.</p></li>
    </ol>
    <p class="aside">O versiune nouă a aplicației (de exemplu, de la 0.13 la 0.14) se instalează de pe această pagină, peste cea existentă. Datele se păstrează, deci nu dezinstala aplicația.</p>
  </section>`;

function updateRow(update, note) {
  const title =
    note?.summary ||
    (update.isRollBackToEmbedded
      ? "Revenire la versiunea inițială a aplicației"
      : "Îmbunătățiri și remedieri");
  const items = (note?.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
  // Update ids are time-ordered, so both platforms of one publish usually share the
  // 8 characters the app shows under Setări & Profil → Actualizare OTA.
  const ios = code(update.updateIds.ios);
  const android = code(update.updateIds.android);
  const codes =
    ios && android && ios !== android
      ? `iOS ${ios}, Android ${android}`
      : ios || android;
  const [day, ...month] = shortDate(update.createdAt).split(" ");
  return `
    <li class="find">
      <time datetime="${esc(update.createdAt)}"><b>${day}</b>${month.join(" ")}</time>
      <div class="what">
        <p>${esc(title)}</p>${items ? `<ul>${items}</ul>` : ""}
        <details class="code"><summary>Cod ${codes}</summary><p>ID grup: ${esc(update.groupId)}<br />${esc(update.subject)}</p></details>
      </div>
    </li>`;
}

// Five newest per version; the rest behind one toggle so older versions stay in view.
function updateList(list, notes) {
  const row = (u) =>
    updateRow(
      u,
      notes.updates.find((n) => n.groupId === u.groupId),
    );
  const rest = list.slice(5);
  const more = rest.length
    ? `<li class="more"><details><summary>Afișează încă ${updates(rest.length)} mai vechi</summary><ol class="finds">${rest.map(row).join("")}</ol></details></li>`
    : "";
  return `<ol class="finds">${list.slice(0, 5).map(row).join("")}${more}</ol>`;
}

function historySection(channel, data, notes) {
  const current = (data.ios || data.android)?.runtimeVersion;
  const versions = new Set([
    ...data.runtimes.map((r) => r.runtimeVersion),
    ...data.updates.map((u) => u.runtimeVersion),
  ]);
  const sections = [...versions].sort(byRuntimeDesc).map((version, i) => {
    const mine = current ? version === current : i === 0;
    const since = data.runtimes.find(
      (r) => r.runtimeVersion === version,
    )?.firstBuildAt;
    const note = notes.runtimes.find(
      (n) => n.channel === channel && n.runtimeVersion === version,
    );
    const list = data.updates.filter((u) => u.runtimeVersion === version);
    const meta = [
      since ? `Lansată pe ${longDate(since)}` : "",
      list.length ? updates(list.length) : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const notesList = note?.notes || [];
    const items = notesList.map((n) => `<li>${esc(n)}</li>`).join("");
    return `
      <details class="card version${mine ? " mine" : ""}"${mine ? " open" : ""}>
        <summary><div><h3>Versiunea ${esc(version)}${mine ? ' <span class="chip chip-on">actuală</span>' : ""}</h3><p class="meta">${meta}</p></div><span class="caret" aria-hidden="true"></span></summary>
        ${note?.summary ? `<p class="lead">${esc(note.summary)}</p>` : ""}
        ${items ? `<details class="version-notes"><summary>Noutăți în această versiune (${notesList.length})</summary><ul>${items}</ul></details>` : ""}
        ${list.length ? updateList(list, notes) : '<p class="empty">Nu există încă actualizări pentru această versiune.</p>'}
      </details>`;
  });
  return `<section class="history"><h2>Istoricul versiunilor</h2>${sections.join("") || '<p class="empty">Nu există încă nicio versiune publicată.</p>'}</section>`;
}

// Only a mouse-driven screen of tablet width or more needs a way over to the device.
const onDesktop = () =>
  !device && matchMedia("(hover: hover) and (min-width: 760px)").matches;

let qrLib;
const loadQrLib = () =>
  (qrLib ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "assets/vendor/qrcode.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  }));

async function renderPageQr(panel) {
  const slot = panel.querySelector(".qr-code");
  if (slot.firstChild) return;
  await loadQrLib();
  const qr = qrcode(0, "M");
  qr.addData(`${location.origin}${location.pathname}?channel=${selected}`);
  qr.make();
  slot.innerHTML = qr.createSvgTag(6, 24);
}

function setPageQr(open) {
  const toggle = document.querySelector(".page-qr-toggle");
  const panel = document.getElementById("page-qr-panel");
  if (!toggle || !panel) return;
  toggle.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
  if (open) renderPageQr(panel);
}

function openGuide() {
  const guide = document.getElementById("inregistrare");
  if (!guide) return false;
  guide.open = true;
  guide.scrollIntoView();
  return true;
}

let selected = null;
let landing = location.hash.slice(1);
async function showChannel(channel, notesPromise) {
  selected = channel;
  document
    .querySelectorAll(".channels button")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.channel === channel)),
    );
  history.replaceState(null, "", `?channel=${channel}${location.hash}`);
  const slot = document.getElementById("channel");
  slot.innerHTML = '<p class="loading">Se încarcă…</p>';
  const [data, notes] = await Promise.all([loadChannel(channel), notesPromise]);
  // Another channel may have been picked while this one was loading.
  if (channel !== selected) return;
  slot.innerHTML =
    hero(channel, data) + STEPS + historySection(channel, data, notes);
  // The page renders after load, so a shared #inregistrare link has nothing to land on until now.
  if (landing === "inregistrare") openGuide();
  else if (landing) document.getElementById(landing)?.scrollIntoView();
  landing = "";
}

// GitHub Pages sends Last-Modified = publish time, which the browser exposes here.
function renderSiteUpdated() {
  const el = document.querySelector(".site-updated");
  const published = new Date(document.lastModified);
  if (!el || isNaN(published)) return;
  el.textContent = `Pagină actualizată: ${published.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderSiteUpdated();
  const notes = getJson("releases.json").then((n) => ({
    runtimes: n?.runtimes || [],
    updates: n?.updates || [],
  }));
  const requested = new URLSearchParams(location.search).get("channel");
  const initial = CHANNELS.includes(requested) ? requested : "production";
  document
    .querySelectorAll(".channels button")
    .forEach((b) =>
      b.addEventListener("click", () => showChannel(b.dataset.channel, notes)),
    );
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".page-qr-toggle");
    if (toggle) setPageQr(toggle.getAttribute("aria-expanded") !== "true");
    else if (!e.target.closest(".page-qr-panel")) setPageQr(false);
    // A collapsed <details> is not a scroll target, so links to the guide open it first.
    if (!e.target.closest('a[href="#inregistrare"]') || !openGuide()) return;
    e.preventDefault();
    history.replaceState(null, "", `?channel=${selected}#inregistrare`);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setPageQr(false);
  });
  showChannel(initial, notes);
});
