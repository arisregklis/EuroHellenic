#!/usr/bin/env python3
"""Verification pass: load every page, catch console errors, broken assets,
broken internal links, and horizontal overflow. Saves screenshots."""
import json, os, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "_build" / "shots"
SHOTS.mkdir(parents=True, exist_ok=True)

PAGES = ["index", "why-greece", "programmes", "institutions", "costs-and-visa",
         "student-life", "support", "about", "partners", "faq", "contact"]

report = {"errors": [], "warnings": [], "ok": []}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/opt/pw-browsers/chromium"
                                if os.path.exists("/opt/pw-browsers/chromium") else None)
    for slug in PAGES:
        f = ROOT / f"{slug}.html"
        if not f.exists():
            report["errors"].append(f"{slug}.html missing"); continue

        for label, vw, vh in (("desktop", 1440, 1000), ("mobile", 390, 844)):
            page = browser.new_page(viewport={"width": vw, "height": vh})
            msgs, failed = [], []
            page.on("console", lambda m: msgs.append((m.type, m.text)))
            page.on("requestfailed", lambda r: failed.append(r.url))

            page.goto(f.as_uri(), wait_until="networkidle")
            page.wait_for_timeout(500)
            # trigger scroll animations
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(900)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(400)

            # console errors
            for t, txt in msgs:
                # Google Fonts is unreachable from this sandbox only; requestfailed
                # below still catches every real broken asset, with its URL.
                if "Failed to load resource" in txt or "ERR_TUNNEL" in txt:
                    continue
                if t == "error":
                    report["errors"].append(f"{slug} [{label}] console: {txt}")

            # failed requests (ignore Google Fonts — blocked by this sandbox's egress only)
            for url in failed:
                if "fonts.g" in url:
                    continue
                report["errors"].append(f"{slug} [{label}] failed request: {url}")

            # broken <img>
            broken = page.evaluate("""() => [...document.images]
                .filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)""")
            for b in broken:
                report["errors"].append(f"{slug} [{label}] broken image: {b}")

            # horizontal overflow
            ovf = page.evaluate("""() => {
                const d = document.documentElement;
                return {scroll: d.scrollWidth, client: d.clientWidth};
            }""")
            if ovf["scroll"] > ovf["client"] + 1:
                report["errors"].append(
                    f"{slug} [{label}] horizontal overflow: {ovf['scroll']}px > {ovf['client']}px")

            # internal links resolve
            if label == "desktop":
                hrefs = page.evaluate("""() => [...document.querySelectorAll('a[href]')]
                    .map(a => a.getAttribute('href'))""")
                for h in set(hrefs):
                    if h.endswith(".html"):
                        if not (ROOT / h).exists():
                            report["errors"].append(f"{slug} dead link -> {h}")

                # reveal elements actually became visible
                hidden = page.evaluate("""() => [...document.querySelectorAll('[data-reveal]')]
                    .filter(e => !e.classList.contains('is-in')).length""")
                if hidden:
                    report["warnings"].append(f"{slug}: {hidden} reveal elements never triggered")

            page.screenshot(path=str(SHOTS / f"{slug}-{label}.png"),
                            full_page=(label == "desktop"))
            page.close()

        report["ok"].append(slug)

    # --- interaction checks on the calculator + accordion + filters
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto((ROOT / "costs-and-visa.html").as_uri(), wait_until="networkidle")
    before = page.inner_text("#o-total")
    page.click('[data-calc-seg="city"] button[data-val="crete"]')
    page.click('[data-calc-seg="tuition"] button[data-val="10320"]')
    page.wait_for_timeout(200)
    after = page.inner_text("#o-total")
    if before == after:
        report["errors"].append("calculator did not update on input")
    else:
        report["ok"].append(f"calculator: {before} -> {after}")
    page.close()

    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto((ROOT / "programmes.html").as_uri(), wait_until="networkidle")
    page.click('.filter[data-target="computing"]')
    page.wait_for_timeout(300)
    shown = page.evaluate("""() => [...document.querySelectorAll('#prog-grid [data-cat]')]
        .filter(e => !e.classList.contains('is-hidden')).length""")
    count = page.inner_text("#prog-count")
    if shown == 0 or str(shown) != count:
        report["errors"].append(f"filter mismatch: {shown} shown, counter says {count}")
    else:
        report["ok"].append(f"filter: computing -> {shown} cards")
    page.close()

    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto((ROOT / "faq.html").as_uri(), wait_until="networkidle")
    page.click(".acc__btn")
    page.wait_for_timeout(650)
    h = page.evaluate("""() => document.querySelector('.acc__panel').getBoundingClientRect().height""")
    if h < 20:
        report["errors"].append(f"accordion did not open (height {h})")
    else:
        report["ok"].append(f"accordion opens ({round(h)}px)")
    page.close()

    # mobile nav drawer
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto((ROOT / "index.html").as_uri(), wait_until="networkidle")
    page.click(".burger")
    page.wait_for_timeout(600)
    open_ = page.evaluate("""() => document.querySelector('.drawer').classList.contains('is-open')""")
    if not open_:
        report["errors"].append("mobile drawer did not open")
    else:
        report["ok"].append("mobile drawer opens")
        page.screenshot(path=str(SHOTS / "drawer-mobile.png"))
    page.close()

    browser.close()

print(json.dumps(report, indent=2))
sys.exit(1 if report["errors"] else 0)
