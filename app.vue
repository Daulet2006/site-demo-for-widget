<script setup lang="ts">
// Demo site: полный showcase кастомизации виджета AppTeka, по секциям.
// Настройки НАКАПЛИВАЮТСЯ в едином конфиге (cfg) — можно комбинировать цвет + тему +
// анимацию и т.д. Каждое действие пересоздаёт живой виджет через публичный API:
// AppTeka.__reset() + AppTeka.init(). Никаких выдуманных опций — только то, что есть.

const API_BASE = 'https://api.appteka.app'

function widget(): any { return (window as any).AppTeka }

/* ------------ единый накапливаемый конфиг ------------ */
function defaults() {
  return {
    theme: 'light', lang: 'ru', position: 'right',
    animation: 'scale', animationDuration: 260,
    colors: {} as Record<string, string>,
    texts: null as any,
    profile: null as any,
    _beta: false, _sound: true, _launcher: true,
  }
}
const cfg = reactive(defaults())

function buildInit() {
  const c: any = {
    apiBase: API_BASE,
    theme: cfg.theme, lang: cfg.lang, position: cfg.position,
    animation: cfg.animation, animationDuration: cfg.animationDuration,
  }
  if (Object.keys(cfg.colors).length) c.colors = { ...cfg.colors }
  if (cfg.texts) c.texts = cfg.texts
  if (cfg.profile) c.profile = cfg.profile
  if (!cfg._beta) c.betaNotice = false
  if (!cfg._launcher) c.launcher = false // headless: без своей плавающей кнопки — хост сам ставит триггер
  return c
}

const liveJson = computed(() => JSON.stringify(buildInit(), null, 2))

let booted = false
function rebuild(open = true) {
  const A = widget(); if (!A) return
  try { localStorage.setItem('appteka-sound', cfg._sound ? 'on' : 'off') } catch {}
  if (cfg._beta) { try { localStorage.removeItem('appteka-beta-ack') } catch {} }
  A.__reset?.(); A.init(buildInit())
  if (open) A.open()
  booted = true
}

/* ------------ действия секций ------------ */
function merge(set: Record<string, any>) {
  if (set.colors) { Object.assign(cfg.colors, set.colors); }
  if ('texts' in set) cfg.texts = set.texts
  if ('profile' in set) cfg.profile = set.profile
  for (const k of ['theme', 'lang', 'position', 'animation', 'animationDuration'] as const)
    if (k in set) (cfg as any)[k] = set[k]
  rebuild()
}
function setFlag(flag: '_beta' | '_sound' | '_launcher', val: boolean) {
  (cfg as any)[flag] = val
  rebuild(!(flag === '_launcher' && !val)) // headless-off: не открывать, показать что своей кнопки нет
}
function act(a: 'open' | 'close' | 'toggle') {
  const A = widget(); if (!A) return
  if (a === 'open') A.open(); else if (a === 'close') A.close(); else A.toggle ? A.toggle() : A.open()
  if (a !== 'close') unread.value = 0 // открыли — сбрасываем бейдж на своей кнопке
}
function doIdentify(p: Record<string, unknown>) {
  const A = widget(); if (!A) return
  A.__reset?.(); A.init(buildInit()); A.open(); A.identify(p)
}
function resetAll() { Object.assign(cfg, defaults()); cfg.colors = {}; rebuild() }

/* непрочитанные — для бейджа на своей кнопке (headless) */
const unread = ref(0)
onMounted(() => {
  window.addEventListener('appteka:unread', (e: any) => { unread.value = e.detail?.unread ?? 0 })
})

/* свой цвет */
const pick = ref('#e11d48')
function darken(hex: string, amt: number) {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const ch = (i: number) => Math.max(0, Math.round(parseInt(n.slice(i, i + 2), 16) * (1 - amt)))
  return '#' + [ch(0), ch(2), ch(4)].map(x => x.toString(16).padStart(2, '0')).join('')
}
function applyPick() {
  merge({ colors: { primary: pick.value, 'primary-d': darken(pick.value, 0.16), me: pick.value } })
}

/* ------------ данные секций ------------ */
type Chip = { label: string; color?: string; value?: string; set?: Record<string, any>; identify?: Record<string, unknown> }
type Section = {
  n: string; title: string; desc: string; lang?: string; code?: string
  type: 'chips' | 'pick' | 'toggle' | 'actions' | 'code' | 'matrix' | 'headless'
  group?: string; chips?: Chip[]; flag?: '_beta' | '_sound' | '_launcher'
}

const sections: Section[] = [
  {
    n: '01', title: 'Подключение', type: 'code', lang: 'html',
    desc: 'Один файл, без сборки. Три способа — выберите под свой стек.',
    code:
`<!-- 1. просто тег + init() -->
<script src="https://cdn.appteka.app/widget/appteka-widget.js" defer><\/script>
<script> AppTeka.init({ apiBase: "${API_BASE}" }) <\/script>

<!-- 2. ноль JS: конфиг прямо на теге (auto-init) -->
<script src="…/appteka-widget.js" defer
  data-api-base="${API_BASE}" data-theme="light"
  data-lang="ru" data-position="right" data-primary="#16a34a"
  data-animation="slide" data-animation-duration="300"><\/script>

// 3. импорт в сборку (React / Vue / Nuxt / Next.js)
import "appteka-widget.js"        // прикрепляет window.AppTeka
AppTeka.init({ apiBase: "${API_BASE}" })`,
  },
  {
    n: '02', title: 'Тема', type: 'chips', group: 'theme',
    desc: 'light · dark · auto (следует системной prefers-color-scheme).',
    code: `AppTeka.init({ apiBase: "${API_BASE}", theme: "dark" })`,
    chips: [
      { label: 'Light', value: 'light', set: { theme: 'light' } },
      { label: 'Dark', value: 'dark', set: { theme: 'dark' } },
      { label: 'Auto', value: 'auto', set: { theme: 'auto' } },
    ],
  },
  {
    n: '03', title: 'Позиция', type: 'chips', group: 'position',
    desc: 'Кнопка и панель — слева или справа.',
    code: `AppTeka.init({ apiBase: "${API_BASE}", position: "left" })`,
    chips: [
      { label: 'Слева', value: 'left', set: { position: 'left' } },
      { label: 'Справа', value: 'right', set: { position: 'right' } },
    ],
  },
  {
    n: '04', title: 'Анимация открытия / закрытия', type: 'chips', group: 'animation',
    desc: 'scale · slide · fade · none. Скорость — в миллисекундах.',
    code: `AppTeka.init({\n  apiBase: "${API_BASE}",\n  animation: "slide",\n  animationDuration: 300\n})`,
    chips: [
      { label: 'Scale', value: 'scale', set: { animation: 'scale' } },
      { label: 'Slide', value: 'slide', set: { animation: 'slide' } },
      { label: 'Fade', value: 'fade', set: { animation: 'fade' } },
      { label: 'None', value: 'none', set: { animation: 'none' } },
    ],
  },
  {
    n: '05', title: 'Скорость анимации', type: 'chips', group: 'animationDuration',
    desc: 'animationDuration в мс. (В полной песочнице — плавный ползунок.)',
    code: `AppTeka.init({ apiBase: "${API_BASE}", animationDuration: 600 })`,
    chips: [
      { label: '150 ms', value: '150', set: { animationDuration: 150 } },
      { label: '260 ms', value: '260', set: { animationDuration: 260 } },
      { label: '400 ms', value: '400', set: { animationDuration: 400 } },
      { label: '600 ms', value: '600', set: { animationDuration: 600 } },
    ],
  },
  {
    n: '06', title: 'Акцентный цвет', type: 'chips',
    desc: 'Готовые схемы. Меняют primary + primary-d (градиент кнопки/шапки) + me.',
    code:
`AppTeka.init({
  apiBase: "${API_BASE}",
  colors: { primary: "#7c3aed", "primary-d": "#6d28d9", me: "#7c3aed" }
})`,
    chips: [
      { label: 'Green', color: '#16a34a', set: { colors: { primary: '#16a34a', 'primary-d': '#15803d', me: '#16a34a' } } },
      { label: 'Blue', color: '#2563eb', set: { colors: { primary: '#2563eb', 'primary-d': '#1d4ed8', me: '#2563eb' } } },
      { label: 'Purple', color: '#7c3aed', set: { colors: { primary: '#7c3aed', 'primary-d': '#6d28d9', me: '#7c3aed' } } },
      { label: 'Red', color: '#dc2626', set: { colors: { primary: '#dc2626', 'primary-d': '#b91c1c', me: '#dc2626' } } },
      { label: 'Orange', color: '#ea580c', set: { colors: { primary: '#ea580c', 'primary-d': '#c2410c', me: '#ea580c' } } },
      { label: 'Black', color: '#0f172a', set: { colors: { primary: '#0f172a', 'primary-d': '#020617', me: '#0f172a' } } },
    ],
  },
  {
    n: '07', title: 'Полная палитра', type: 'chips',
    desc: 'Все 8 токенов сразу — фон (bg), пузыри (me/ai), текст (fg), границы, muted. Работает и в белой теме.',
    code:
`AppTeka.init({
  apiBase: "${API_BASE}",
  colors: {
    primary: "#e11d48", "primary-d": "#be123c",
    bg: "#fffafb", fg: "#0f172a", muted: "#64748b",
    border: "#fecdd3", me: "#e11d48", ai: "#fff1f2"
  }
})`,
    chips: [
      { label: 'Розовая', color: '#e11d48', set: { colors: { primary: '#e11d48', 'primary-d': '#be123c', bg: '#fffafb', fg: '#0f172a', muted: '#9f7480', border: '#fecdd3', me: '#e11d48', ai: '#fff1f2' } } },
      { label: 'Индиго', color: '#4f46e5', set: { colors: { primary: '#4f46e5', 'primary-d': '#4338ca', bg: '#ffffff', fg: '#0f172a', muted: '#64748b', border: '#e0e7ff', me: '#4f46e5', ai: '#eef2ff' } } },
      { label: 'Изумруд', color: '#059669', set: { colors: { primary: '#059669', 'primary-d': '#047857', bg: '#ffffff', fg: '#0f172a', muted: '#64748b', border: '#d1fae5', me: '#059669', ai: '#ecfdf5' } } },
      { label: 'Тёплый беж', color: '#b45309', set: { colors: { primary: '#b45309', 'primary-d': '#92400e', bg: '#fffdf7', fg: '#1c1917', muted: '#8a7a5c', border: '#fde68a', me: '#b45309', ai: '#fef3c7' } } },
      { label: 'Тёмная на светлом', color: '#0ea5e9', set: { colors: { primary: '#0ea5e9', 'primary-d': '#0284c7', bg: '#0b1220', fg: '#e2e8f0', muted: '#94a3b8', border: '#334155', me: '#0ea5e9', ai: '#1e293b' } } },
    ],
  },
  {
    n: '08', title: 'Свой цвет', type: 'pick',
    desc: 'Передайте любой HEX — виджет перекрасится (primary + авто-затемнённый primary-d + me).',
    code: `AppTeka.init({\n  apiBase: "${API_BASE}",\n  colors: { primary: "#e11d48", "primary-d": "#be123c", me: "#e11d48" }\n})`,
  },
  {
    n: '09', title: 'Язык', type: 'chips', group: 'lang',
    desc: 'ru · kk · en (или авто-детект, если не задан).',
    code: `AppTeka.init({ apiBase: "${API_BASE}", lang: "kk" })`,
    chips: [
      { label: 'Русский', value: 'ru', set: { lang: 'ru' } },
      { label: 'Қазақша', value: 'kk', set: { lang: 'kk' } },
      { label: 'English', value: 'en', set: { lang: 'en' } },
    ],
  },
  {
    n: '10', title: 'Свои тексты', type: 'chips',
    desc: 'Переопределение любых строк интерфейса для выбранного языка.',
    code:
`AppTeka.init({
  apiBase: "${API_BASE}", lang: "ru",
  texts: { ru: {
    title: "Аптека №1",
    welcome: "Здравствуйте! Чем помочь?",
    requestOperator: "Позвать оператора"
  }}
})`,
    chips: [
      { label: 'Применить тексты', set: { lang: 'ru', texts: { ru: { title: 'Аптека №1', subtitle: 'Онлайн-консультант', welcome: 'Здравствуйте! Чем помочь?', requestOperator: 'Позвать оператора', placeholder: 'Введите сообщение...' } } } },
      { label: 'Сбросить тексты', set: { texts: null } },
    ],
  },
  {
    n: '11', title: 'Экран Beta', type: 'toggle', flag: '_beta',
    desc: 'Экран согласия перед чатом («это бета, AI может ошибаться»). Off → betaNotice:false.',
    code: `AppTeka.init({ apiBase: "${API_BASE}", betaNotice: false })  // Off\n// betaNotice не задан → экран Beta показывается`,
  },
  {
    n: '12', title: 'Звук уведомлений', type: 'toggle', flag: '_sound',
    desc: 'Runtime-настройка (localStorage["appteka-sound"]), не параметр init(). В шапке чата тоже есть переключатель.',
    code: `// звук хранится в localStorage; init-параметра нет\nlocalStorage.setItem("appteka-sound", "off")`,
  },
  {
    n: '13', title: 'Известный пользователь', type: 'chips',
    desc: 'profile при init() или identify() после логина — чат и история сохраняются, оператор видит, кто это. Без отдельного логина в виджете.',
    code:
`// сразу с профилем
AppTeka.init({ apiBase: "${API_BASE}", profile: { name: "Иван", phone: "+7701…" } })

// или после авторизации в вашем приложении
AppTeka.identify({ name: "Айгүл", phone: "+7707…", extra: { userId: 777 } })`,
    chips: [
      { label: 'init с профилем', set: { profile: { name: 'Иван Иванов', phone: '+77011234567', address: 'Алматы', extra: { userId: 15 } } } },
      { label: 'Сбросить профиль', set: { profile: null } },
      { label: 'identify()', identify: { name: 'Айгүл', phone: '+77070000000', address: 'Алматы', extra: { userId: 777, email: 'aigul@test.kz' } } },
    ],
  },
  {
    n: '14', title: 'Управление из вашего UI', type: 'actions',
    desc: 'open · close · toggle · isOpen — повесьте на собственную кнопку «Поддержка».',
    code:
`AppTeka.open()
AppTeka.close()
AppTeka.toggle()
if (AppTeka.isOpen) { /* ... */ }`,
  },
  {
    n: '15', title: 'Своя кнопка «Служба Поддержки» (headless)', type: 'headless', flag: '_launcher',
    desc: 'launcher:false — виджет прячет свою плавающую кнопку. Ставите её сами: пункт меню, иконку чата, строку в настройках. Открытие — AppTeka.open(). Бейдж — AppTeka.unread + событие appteka:unread.',
    code:
`// 1. init без своей кнопки
AppTeka.init({ apiBase: "${API_BASE}", launcher: false })

// 2. ваша кнопка / пункт меню открывает чат
supportBtn.onclick = () => AppTeka.open()

// 3. бейдж непрочитанных на вашей кнопке
addEventListener("appteka:unread", e => {
  badge.textContent = e.detail.unread   // или AppTeka.unread
})

// мобилка (WebView): нативная кнопка -> webview.evaluate("AppTeka.open()")`,
  },
  {
    n: '16', title: 'Все возможности', type: 'matrix',
    desc: 'Что виджет умеет сегодня — из коробки, одним файлом.',
  },
]

const FEATURES = [
  'Light / Dark / Auto', 'Локализация ru·kk·en', 'WebSocket (realtime)', 'REST API', 'Markdown в ответах',
  'Индикатор печати', 'Кэш сообщений', 'Offline-кэш', 'Анонимный гость', 'identify() без логина',
  'Кастомные цвета', 'Кастомные тексты', 'CSS-переменные', 'Анимации open/close', 'Свой цвет (любой HEX)',
  'Экран Beta', 'Эскалация на оператора', 'Звук + вибрация', 'Уведомления (badge)', 'Мобильный (fullscreen)',
  'Адаптивность', 'open / close / toggle', 'window.AppTeka API', 'Vanilla JS', 'React · Vue · Nuxt · Next',
  'CDN, один файл', 'Headless (своя кнопка)', 'AppTeka.unread + событие',
]

/* ------------ подсветка кода ------------ */
function hl(src: string): string {
  let s = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  s = s.replace(/(&lt;!--[\s\S]*?--&gt;|\/\/[^\n]*)/g, '<span class="c">$1</span>')
  s = s.replace(/('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g, '<span class="s">$1</span>')
  s = s.replace(/\b(const|let|var|function|return|new|import|from|if|else)\b/g, '<span class="k">$1</span>')
  s = s.replace(/\b(AppTeka)\b/g, '<span class="f">$1</span>')
  s = s.replace(/(?<![\w#>"-])(-?\d+(?:\.\d+)?)(?!\w)/g, '<span class="num">$1</span>')
  return s
}

const copiedN = ref<string | null>(null)
function copy(code: string, n: string) {
  navigator.clipboard?.writeText(code).then(() => { copiedN.value = n; setTimeout(() => (copiedN.value = null), 1200) })
}
function onChip(v: Chip) { if (v.identify) doIdentify(v.identify); else merge(v.set || {}) }
</script>

<template>
  <div class="page">
    <header class="hero">
      <span class="pill">AppTeka Support Widget Without Backend</span>
      <h1>Кастомизация виджета — всё сразу</h1>
      <p class="sub">Все возможности и настройки по секциям. Они <b>комбинируются</b>: выберите цвет + тему + анимацию —
        живой виджет в углу окна меняется мгновенно, без перезагрузки.</p>
      <div class="cta">
        <button class="btn primary" @click="act('open')">Открыть виджет</button>
        <button class="btn" @click="act('toggle')">Toggle</button>
        <button class="btn" @click="resetAll">Сбросить всё</button>
      </div>
    </header>

    <!-- live config -->
    <div class="jsoncard">
      <div class="bar"><span class="lang">Текущая конфигурация · AppTeka.init()</span>
        <button class="copy" @click="copy(liveJson, '__json')">{{ copiedN === '__json' ? 'Copied ✓' : 'Copy' }}</button>
      </div>
      <pre><code v-html="hl(liveJson)" /></pre>
    </div>

    <div class="callout">
      <span class="ci">💡</span>
      <span>Виджет живёт прямо здесь (<code>position: fixed</code>, угол окна, как Intercom/Crisp). Каждое действие
        пересоздаёт его через <code>AppTeka.__reset()</code> + <code>AppTeka.init()</code>. Настройки накапливаются.</span>
    </div>

    <section v-for="s in sections" :key="s.n" class="sec">
      <div class="sec-head">
        <span class="n">{{ s.n }}</span>
        <div class="sec-meta"><h2>{{ s.title }}</h2><p>{{ s.desc }}</p></div>
      </div>

      <!-- chips -->
      <div v-if="s.type === 'chips'" class="variants">
        <button v-for="v in s.chips" :key="v.label" class="chip"
                :class="{ on: s.group && String((cfg as any)[s.group]) === v.value }" @click="onChip(v)">
          <span v-if="v.color" class="cdot" :style="{ background: v.color }" />{{ v.label }}
        </button>
      </div>

      <!-- color picker -->
      <div v-else-if="s.type === 'pick'" class="variants pickrow">
        <input type="color" v-model="pick" class="cpick" />
        <input type="text" v-model="pick" class="chex" />
        <button class="chip on" @click="applyPick">Применить цвет</button>
        <span class="cprev" :style="{ background: pick }" />
      </div>

      <!-- toggle (beta / sound) -->
      <div v-else-if="s.type === 'toggle'" class="variants">
        <button class="chip" :class="{ on: (cfg as any)[s.flag!] }" @click="setFlag(s.flag!, true)">On</button>
        <button class="chip" :class="{ on: !(cfg as any)[s.flag!] }" @click="setFlag(s.flag!, false)">Off</button>
      </div>

      <!-- actions -->
      <div v-else-if="s.type === 'actions'" class="variants">
        <button class="chip" @click="act('open')">Open</button>
        <button class="chip" @click="act('close')">Close</button>
        <button class="chip" @click="act('toggle')">Toggle</button>
      </div>

      <!-- headless: своя кнопка -->
      <div v-else-if="s.type === 'headless'" class="variants headlessrow">
        <button class="chip" :class="{ on: cfg._launcher }" @click="setFlag('_launcher', true)">Кнопка виджета (FAB)</button>
        <button class="chip" :class="{ on: !cfg._launcher }" @click="setFlag('_launcher', false)">Своя кнопка (headless)</button>
        <span class="sep" />
        <button class="hostbtn" @click="act('open')">
          <span class="hb-ic">🎧</span> Служба Поддержки
          <span v-if="unread" class="hb-badge">{{ unread }}</span>
        </button>
      </div>

      <!-- matrix -->
      <div v-else-if="s.type === 'matrix'" class="matrix">
        <div v-for="f in FEATURES" :key="f" class="feat"><span class="ic">✓</span>{{ f }}</div>
      </div>

      <!-- code block -->
      <div v-if="s.code" class="code">
        <div class="bar">
          <span class="lang">{{ s.lang || 'javascript' }}</span>
          <button class="copy" @click="copy(s.code!, s.n)">{{ copiedN === s.n ? 'Copied ✓' : 'Copy' }}</button>
        </div>
        <pre><code v-html="hl(s.code)" /></pre>
      </div>
    </section>

    <footer>
      <span>AppTeka Widget — single-file vanilla SDK. Никаких зависимостей, никакой сборки.</span>
      <span class="muted">Полная песочница со всеми ползунками и JSON-viewer: <code>widget/playground.html</code></span>
    </footer>
  </div>
</template>

<style>
:root {
  --bg: #f7f8fa; --panel: #fff; --fg: #0b1220; --fg2: #3b4250; --muted: #697586;
  --border: #e7e9ee; --accent: #5b5bd6; --accent-soft: #eef0ff;
  --code-bg: #0d1424; --code-fg: #e6e8ef;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
code { font-family: var(--mono); font-size: .92em; }
.page { max-width: 880px; margin: 0 auto; padding: 0 22px 90px; }

.hero { margin: 46px 0 20px; padding: 44px 40px; border-radius: 22px; position: relative; overflow: hidden;
  background: radial-gradient(120% 120% at 0 0, #f2f2ff, #fff 48%); border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 30px rgba(16,24,40,.06); }
.pill { display: inline-block; margin-bottom: 16px; font: 600 11px/1 var(--sans); letter-spacing: .06em;
  text-transform: uppercase; color: var(--accent); background: var(--accent-soft); padding: 6px 10px; border-radius: 999px; }
.hero h1 { margin: 0; font-size: clamp(26px, 4.6vw, 38px); font-weight: 680; letter-spacing: -.02em; }
.hero .sub { margin: 14px 0 0; font-size: 16.5px; color: var(--muted); max-width: 620px; line-height: 1.55; }
.cta { margin-top: 24px; display: flex; gap: 10px; flex-wrap: wrap; }

.btn { appearance: none; border: 1px solid var(--border); background: #fff; color: var(--fg);
  font: 600 14px var(--sans); padding: 10px 16px; border-radius: 10px; cursor: pointer; transition: .14s; }
.btn:hover { background: #fbfbfd; border-color: #d3d7e0; }
.btn.primary { background: linear-gradient(180deg, #6d6ae8, #5b5bd6); border-color: transparent; color: #fff;
  box-shadow: 0 1px 2px rgba(91,91,214,.35); }
.btn.primary:hover { background: linear-gradient(180deg, #7a77ef, #5b5bd6); }

.jsoncard { border-radius: 13px; overflow: hidden; border: 1px solid #0a1120; margin-bottom: 22px; }
.callout { display: flex; gap: 12px; margin-bottom: 26px; padding: 15px 18px; border: 1px solid #e6e9f5;
  background: #f7f8ff; border-radius: 12px; font-size: 14px; color: var(--fg2); line-height: 1.55; }
.callout .ci { font-size: 18px; }

.sec { padding: 26px 0; border-top: 1px solid var(--border); }
.sec-head { display: flex; gap: 14px; align-items: flex-start; }
.sec-head .n { flex-shrink: 0; font: 700 12px var(--mono); color: var(--accent); background: var(--accent-soft);
  width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; }
.sec-meta h2 { margin: 3px 0 5px; font-size: 20px; font-weight: 650; letter-spacing: -.01em; }
.sec-meta p { margin: 0; color: var(--muted); font-size: 14.5px; line-height: 1.5; }

.variants { display: flex; flex-wrap: wrap; gap: 9px; margin: 16px 0 0 44px; align-items: center; }
.chip { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: #fff;
  border-radius: 999px; padding: 7px 15px; font: 600 13px var(--sans); color: var(--fg); cursor: pointer; transition: .12s; }
.chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.chip.on { border-color: var(--accent); background: var(--accent); color: #fff; }
.chip.on .cdot { box-shadow: 0 0 0 2px #fff inset; }
.chip .cdot { width: 15px; height: 15px; border-radius: 50%; }

.pickrow { gap: 12px; }
.cpick { width: 42px; height: 34px; padding: 0; border: 1px solid var(--border); border-radius: 9px; background: none; cursor: pointer; }
.chex { width: 100px; font: 600 13px var(--mono); padding: 8px 10px; border: 1px solid var(--border); border-radius: 9px; }
.cprev { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--border); }

.headlessrow { gap: 10px; }
.headlessrow .sep { width: 1px; height: 26px; background: var(--border); margin: 0 4px; }
.hostbtn { position: relative; display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer;
  background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; font: 600 13.5px var(--sans);
  padding: 10px 18px; border-radius: 11px; box-shadow: 0 4px 14px rgba(22,163,74,.32); }
.hostbtn:hover { filter: brightness(1.05); }
.hostbtn .hb-ic { font-size: 15px; }
.hostbtn .hb-badge { position: absolute; top: -7px; right: -7px; min-width: 20px; height: 20px; padding: 0 5px;
  border-radius: 10px; background: #ef4444; color: #fff; font: 700 11px/20px var(--sans); text-align: center; }

.matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 9px; margin: 16px 0 0 44px; }
.feat { display: flex; align-items: center; gap: 10px; padding: 10px 13px; border: 1px solid var(--border);
  border-radius: 11px; background: #fff; font-size: 13.5px; }
.feat .ic { width: 20px; height: 20px; border-radius: 6px; background: #dcfce7; color: #166534;
  display: grid; place-items: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }

.code { margin: 16px 0 0 44px; border-radius: 12px; overflow: hidden; border: 1px solid #0a1120; }
.bar { display: flex; align-items: center; justify-content: space-between; padding: 9px 13px;
  background: #0a1120; border-bottom: 1px solid #1e2740; }
.bar .lang { font: 600 11px var(--mono); color: #8b93a7; text-transform: uppercase; letter-spacing: .05em; }
.bar .copy { background: transparent; border: none; color: #9aa3b8; font: 600 12px var(--sans);
  padding: 4px 9px; border-radius: 7px; cursor: pointer; }
.bar .copy:hover { background: rgba(255,255,255,.08); color: #fff; }
pre { margin: 0; background: var(--code-bg); color: var(--code-fg); padding: 15px 17px; overflow-x: auto;
  font: 500 12.8px/1.65 var(--mono); }
.k { color: #c79bf0; } .s { color: #9ae6a4; } .num { color: #f6a96b; }
.c { color: #5f6b85; font-style: italic; } .f { color: #f2c97d; }

footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--muted);
  font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
footer .muted { color: #9aa3b8; }

@media (max-width: 560px) {
  .variants, .code, .matrix { margin-left: 0; }
  .hero { padding: 32px 24px; }
}
</style>
