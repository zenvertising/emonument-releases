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

const GLYPHS = {
  ios: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
  android:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="13" rx="2"/><path d="M8.5 21h7M12 17.5V21"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5 18.5 12 13 17.5"/></svg>',
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
function enrollSteps() {
  const onComputer = device
    ? ""
    : '<p class="hint">Ești pe computer? Scanează codul QR de mai sus cu dispozitivul și continuă de acolo.</p>';
  return `
    <section class="enroll" aria-labelledby="enroll-title">
      <h2 id="enroll-title">Prima instalare pe iPad sau iPhone</h2>
      <p class="enroll-lede">Se face o singură dată pentru fiecare dispozitiv. După aprobare, instalezi direct de aici.</p>
      <ol class="track">
        <li class="is-action"><span class="dot">1</span><div>
          <h3>Înregistrează dispozitivul</h3>
          <p>Deschide link-ul chiar pe iPad-ul sau iPhone-ul pe care instalezi și urmează pașii din pagina care se deschide.</p>
          <a class="cta" href="${ENROLL_URL}" target="_blank" rel="noopener">Înregistrează dispozitivul ${GLYPHS.arrow}</a>
          ${onComputer}
        </div></li>
        <li class="is-wait"><span class="dot">${GLYPHS.clock}</span><div>
          <h3>Așteaptă aprobarea Apple</h3>
          <p>De obicei, dispozitivul e aprobat până a doua zi. Poate dura până la 3 zile.</p>
          <span class="badge">1–3 zile</span>
        </div></li>
        <li><span class="dot">3</span><div>
          <h3>Instalează din Safari</h3>
          <p>Deschide această pagină în Safari și apasă „Descarcă pentru iPad și iPhone”. Dacă apare mesajul „Unable to Install”, dispozitivul nu a fost încă aprobat: mai încearcă a doua zi.</p>
          <a class="to-actions" href="#actions">Mergi la butonul de descărcare</a>
        </div></li>
      </ol>
    </section>`;
}

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
  const enroll = data.ios && device !== "android" ? enrollSteps() : "";
  return `
    <section class="card hero${preview ? " is-preview" : ""}">
      ${warn}
      <div class="hero-grid">
        <div>
          ${chip}
          <h1>${title}</h1>
          <dl class="facts"><div><dt>Versiunea</dt><dd>${esc(pointers[0].runtimeVersion)}</dd></div></dl>
          <div class="actions" id="actions">${installButtons(data)}</div>
        </div>
        <figure class="qr"><figcaption>Scanează codul QR ca să deschizi această pagină pe tabletă sau telefon.</figcaption></figure>
      </div>
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

// Desktop visitors scan this to open the same channel on the device; the page, not the
// raw link, so iOS still installs through Safari.
function renderQr(slot, channel) {
  const figure = slot.querySelector(".qr");
  if (!figure || typeof qrcode !== "function") return;
  const qr = qrcode(0, "M");
  qr.addData(`${location.origin}${location.pathname}?channel=${channel}`);
  qr.make();
  figure.insertAdjacentHTML("afterbegin", qr.createSvgTag(6, 0));
}

let selected = null;
async function showChannel(channel, notesPromise) {
  selected = channel;
  document
    .querySelectorAll(".channels button")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.channel === channel)),
    );
  history.replaceState(null, "", `?channel=${channel}`);
  const slot = document.getElementById("channel");
  slot.innerHTML = '<p class="loading">Se încarcă…</p>';
  const [data, notes] = await Promise.all([loadChannel(channel), notesPromise]);
  // Another channel may have been picked while this one was loading.
  if (channel !== selected) return;
  slot.innerHTML =
    hero(channel, data) + STEPS + historySection(channel, data, notes);
  renderQr(slot, channel);
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
  showChannel(initial, notes);
});
