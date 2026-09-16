# EuroHellenic — Education & Student Services

A twelve-page static marketing site for an independent education advisory service
placing international students into English-taught degree programmes in Greece.

No framework. No build step required to run it. No npm install. Upload the folder
to any host and it works.

---

## 1. Run it

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## 2. Deploy it

Drag the whole folder into Netlify, Vercel, Cloudflare Pages, or upload it over
FTP to shared hosting. Nothing needs compiling.

Before you deploy, do these three things:

1. **Set the live domain.** Open `_build/build.py`, change `SITE_URL` to the real
   domain, and re-run `python3 _build/build.py`. This updates every canonical tag,
   the Open Graph URLs, the structured data and `sitemap.xml` in one pass.
2. **Connect the contact form** (section 4 below). Until you do, the form shows an
   honest "not connected yet" message rather than silently losing enquiries.
3. **Work through the launch checklist** (section 6).

---

## 3. How the files fit together

```
index.html  why-greece.html  programmes.html  institutions.html
costs-and-visa.html  student-life.html  support.html  about.html
partners.html  faq.html  contact.html  404.html
sitemap.xml  robots.txt

assets/
  css/style.css        one stylesheet, sectioned and commented
  js/main.js           one script, no dependencies
  img/                 SVG artwork — self-hosted, cannot break

_build/                OPTIONAL tooling, do not upload
  build.py             assembles the shared header/footer into every page
  verify.py            automated browser test of every page
  pages/*.html         the per-page content fragments
  shots/               screenshots from the last verify run
```

### The `_build` folder — read this before editing

The twelve `.html` files in the root are **complete and self-contained**. You can
edit them directly and they will work.

But the header, navigation and footer are identical across all twelve. Editing them
by hand means changing the same markup twelve times and getting it wrong once.

So the chrome lives in one place, `_build/build.py`, and the unique content of each
page lives in `_build/pages/<name>.html`. Running the builder stitches them together:

```bash
python3 _build/build.py
```

Requires Python 3.8+, nothing else installed.

**Pick one approach and stay with it.** If you edit the root `.html` files directly
and then someone runs the builder, your edits are overwritten. If you are handing
this to a developer, tell them the builder exists. If you are handing it to someone
non-technical, tell them to edit the root files and never run the builder.

Do not upload `_build/` to the live server. It is tooling, not content.

### Adding a page

1. Create `_build/pages/my-page.html` containing only the `<section>` blocks.
2. Add a row to the `PAGES` list in `_build/build.py` (slug, nav label, title, meta description).
3. Add the slug to `PRIMARY_NAV` if it belongs in the top menu.
4. Run `python3 _build/build.py`.

---

## 4. Connecting the contact form — required

There are two forms: one on `index.html`, one on `contact.html`. Both post to
[Web3Forms](https://web3forms.com), which is free, needs no backend, and works on
static hosting.

1. Go to web3forms.com and enter the address where enquiries should arrive.
2. They email you an access key immediately. No account, no card.
3. Replace `YOUR-WEB3FORMS-ACCESS-KEY` with it in **both** places:
   - `_build/pages/index.html`
   - `_build/pages/contact.html`
   (then rebuild) — or directly in `index.html` and `contact.html` if you are not using the builder.
4. Submit a test enquiry from the live site and confirm it arrives.

Already included: a honeypot field that silently drops bots, inline success and
error states, and a fallback message pointing at the email address if the network
call fails. Nothing is lost quietly.

**Do not skip step 4.** A contact form nobody tested is the most common way a
lead-generation site loses its first month of enquiries.

---

## 5. Images — the one thing to fix properly

All artwork is original SVG, hand-built for this site and stored in `assets/img/`.
It is sharp at any size, loads instantly, costs nothing in bandwidth, and — unlike
hotlinked stock photography — **cannot break**.

The original draft of this site hotlinked Unsplash URLs, including two
`download?force=true` links. Those are not stable CDN addresses: they rate-limit,
change, and eventually 404, at which point your hero section becomes three grey
boxes. That was removed deliberately.

When you are ready to add real photography:

1. Buy or license the images properly. Download them; do not hotlink.
2. Save them into `assets/img/` as `.webp` (with a `.jpg` fallback if you need old-browser support).
3. Swap the `src` on the relevant `<img>` tags. Every image already has a
   width, height and descriptive `alt` attribute — keep them, and update the `alt`
   text to describe the new photograph.
4. Keep each file under about 250 KB. Squoosh.app does this in a browser.

The places real photography would earn its keep, in priority order: the two hero
panels on `index.html`, the three `.tile` images on `index.html` and
`student-life.html`, and a genuine photograph of the founder on `about.html`.

---

## 6. Launch checklist

Everything marked with a dashed gold box on the site is a placeholder that must be
resolved before launch. They are deliberately visible so they cannot be forgotten.

**Blocking — the site should not go live without these**

- [ ] Web3Forms key added to both forms, and a test enquiry received
- [ ] `SITE_URL` in `_build/build.py` set to the real domain, site rebuilt
- [ ] `hello@eurohellenic.com` and `partners@eurohellenic.com` exist and are monitored
- [ ] Founder's real name, credentials and photograph added to `about.html`
- [ ] Phone number and WhatsApp link added to `contact.html` — in India, the
      Philippines and Nigeria, WhatsApp is the primary channel; its absence costs enquiries
- [ ] Testimonial placeholders on `index.html` either filled with **real, permissioned,
      attributable** quotes or the whole section deleted. Do not invent them.
- [ ] Every tuition figure re-verified against the institution's current published fees
- [ ] Confirm whether formal referral agreements exist with each listed institution,
      and adjust the wording on `institutions.html` accordingly

**Strongly recommended**

- [ ] Tutoring prices published on `support.html` — vague pricing costs more
      enquiries than high pricing does
- [ ] Privacy policy page (you are collecting personal data from EU and non-EU
      residents; GDPR applies to you the moment the form works)
- [ ] Google Analytics or Plausible added before the script tag in the footer
- [ ] Google Search Console verified, `sitemap.xml` submitted
- [ ] A real favicon `.ico` alongside the SVG for older browsers

---

## 7. Where the numbers came from

Every figure on the site is drawn from a published source and labelled as
indicative. This matters legally and commercially: quoting a fee that turns out to
be wrong is how an advisory service loses a family's trust permanently.

- **Tuition** — Mediterranean College published international fee schedule
  (€6,750/yr undergraduate; €8,350 one-year master's; €5,590 + €3,590 two-year
  master's; degrees awarded by the University of Derby). University of Nicosia
  non-EU fee schedule for 2026–27 (€10,320–€11,820 undergraduate; €24,000 medicine;
  €12,060–€14,490 master's; €15,480 doctoral over three years).
- **Awarding partners** — Metropolitan College (Queen Margaret, East London,
  Oxford Brookes, Solent, EHL, University of North Alabama); New York College
  (SUNY Empire State, Greenwich, University of Greater Manchester).
- **English requirements** — IELTS 6.0 with 5.5 minimum per component for
  undergraduate entry; 6.0–6.5 postgraduate; ~4.5 foundation.
- **Living costs** — current published Greek student cost-of-living data: shared
  room €300–€450 regional / €450–€700 Athens; groceries €180–€280; transport
  €15–€35 with student discount; utilities €60–€130; mobile and internet €20–€35;
  personal €60–€150. Monthly totals €700–€1,100 regional, €930–€1,480 Athens.
- **Visa and work rights** — Greek national D visa guidance: acceptance letter,
  proof of funds, health insurance, accommodation, apostilled and translated
  criminal record certificate; one to three months for a decision; residence permit
  applied for on arrival; 20 hours per week term-time work with AFM and AMKA.

**These change between intakes.** Re-verify before each academic year, and update
both the page content and this section.

---

## 8. What's built in

**Interaction**
- Scroll-triggered reveals with automatic sibling stagger (IntersectionObserver)
- Animated counters that run once on entry, easeOutCubic
- Programme filter with live result count on `programmes.html`
- Live cost calculator on `costs-and-visa.html` — city, housing, programme, lifestyle
- Accordion FAQ with correct ARIA state and animated height
- Sticky header that shrinks on scroll; reading progress bar
- Mobile drawer with staggered link entrance and Escape-to-close
- Subtle parallax hook (`data-parallax`) available on any element

**Accessibility**
- Skip link, visible focus rings, semantic landmarks and heading order
- `aria-expanded` / `aria-controls` on every disclosure widget
- `aria-current="page"` set automatically on the active nav item
- `prefers-reduced-motion` fully respected — all animation collapses to instant
- Every image has meaningful `alt` text; decorative SVG is `aria-hidden`

**SEO**
- Unique title and meta description per page
- Canonical URLs, Open Graph and Twitter card tags
- `EducationalOrganization` structured data sitewide; `FAQPage` structured data on `faq.html`
- Generated `sitemap.xml` and `robots.txt`

**Robustness**
- Works with JavaScript disabled — content is all in the HTML
- Self-hosted SVG artwork that cannot 404
- No `localStorage`, no cookies, no third-party scripts except Google Fonts
- Zero horizontal overflow at 390px, verified automatically

---

## 9. Testing

```bash
pip install playwright && playwright install chromium
python3 _build/verify.py
```

Loads every page at 1440px and 390px and checks for console errors, failed network
requests, broken images, horizontal overflow, dead internal links, and reveal
elements that never triggered. It then exercises the calculator, the programme
filter, the accordion and the mobile drawer, and saves screenshots to
`_build/shots/`. Exits non-zero if anything fails, so it drops straight into CI.

Last run: **all twelve pages clean, no errors, no warnings.**

---

## 10. Browser support

Modern evergreen browsers — Chrome, Edge, Firefox, Safari, and their mobile
versions. Uses `backdrop-filter`, `IntersectionObserver` and CSS custom properties,
all of which degrade gracefully rather than breaking. Internet Explorer is not
supported and should not be.
