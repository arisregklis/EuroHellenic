#!/usr/bin/env python3
"""
EuroHellenic — static site builder
----------------------------------
Assembles the shared chrome (head, header, nav, footer) around the page
fragments in _build/pages/*.html and writes plain static .html files to the
project root.

Why this exists:
  The site is plain HTML with no framework, which is exactly what you want for
  hosting (drop it on Netlify, Vercel, Hostinger, cPanel — anywhere). But that
  normally means the navigation is copy-pasted into every page, so changing one
  menu item means editing every file. This script keeps the chrome in ONE place.

Usage:
    python _build/build.py

Requires: Python 3.8+. No packages to install.

If you would rather not use it, just edit the generated .html files directly —
they are complete, self-contained, and need no build step to work.
"""

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES_DIR = Path(__file__).resolve().parent / "pages"

SITE_NAME = "EuroHellenic"
SITE_URL = "https://www.eurohellenic.com"   # <-- change to the live domain
EMAIL_STUDENTS = "hello@eurohellenic.com"
EMAIL_PARTNERS = "partners@eurohellenic.com"

# slug, nav label, <title>, meta description
PAGES = [
    ("index",          "Home",           "Study in Greece — Guidance for International Students",
     "Independent guidance for international students who want to study in Greece: English-taught degrees, real costs, visa steps and one-to-one support from enquiry to arrival."),
    ("programmes",     "Programmes",     "Study Areas & Programmes — Bachelor's and Master's in Greece",
     "Browse English-taught undergraduate, postgraduate and foundation programmes in Greece across business, computing, engineering, psychology, health and hospitality, and the institutions and awarding universities behind them."),
    ("costs-and-visa", "Costs & visa",   "Tuition, Living Costs & the Greek Student Visa Explained",
     "Real numbers: indicative tuition from €6,750 a year, monthly student living costs by city, city-by-city living costs, and a step-by-step guide to the Greek national D student visa and residence permit."),
    ("about",          "About",          "About EuroHellenic — Personal Education Guidance",
     "EuroHellenic is a personal education advisory service led by an experienced Head of English Department and Academic & Careers Advisor, offering application, visa and arrival support plus IELTS and A Level tutoring."),
    ("faq",            "FAQ",            "Frequently Asked Questions — Studying in Greece",
     "Straight answers on recognition of degrees, English requirements, visa refusals, working while studying, staying in Europe after graduation and what our service costs."),
    ("contact",        "Contact",        "Contact an Advisor — Start Your Application",
     "Tell us what you want to study and an advisor will reply within two working days with the routes that realistically fit your profile and budget."),
    ("404",            "Not found",      "Page Not Found",
     "The page you were looking for does not exist. Try the homepage or the programme list, or contact an advisor directly."),
]

# Pages excluded from sitemap.xml
NO_INDEX = {"404"}

# Which pages appear in the primary nav (FAQ and Contact live elsewhere)
PRIMARY_NAV = ["programmes", "costs-and-visa", "about"]

TITLES = {slug: (label, title, desc) for slug, label, title, desc in PAGES}


# ---------------------------------------------------------------- templates

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | {site}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}/{canonical}">

<!-- Open Graph / social -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="{site}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}/{canonical}">
<meta property="og:image" content="{url}/assets/img/photos/athens-acropolis-dusk.jpg">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/favicon.svg">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/css/style.css">

<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "{site}",
  "alternateName": "EuroHellenic Education & Student Services",
  "url": "{url}",
  "logo": "{url}/assets/img/favicon.svg",
  "description": "Independent education guidance for international students who want to study in Greece.",
  "email": "{email}",
  "areaServed": ["IN", "CN", "PH", "NG", "EG", "AE"],
  "knowsLanguage": ["en", "el"],
  "sameAs": []
}}
</script>
{extra_schema}
</head>
<body>
<div class="progress" aria-hidden="true"></div>
<a class="skip" href="#main">Skip to content</a>
"""

HEADER = """
<header class="header">
  <nav class="nav shell" aria-label="Primary">
    <a class="brand" href="index.html" aria-label="{site} — home">
      <span class="brand__name">EuroHellenic<small>Study in Greece</small></span>
    </a>

    <ul class="nav__links">
{nav_items}
    </ul>

    <a class="btn btn--sm nav__cta" href="contact.html">Speak to an advisor</a>

    <button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">
      <span></span>
    </button>
  </nav>
</header>

<div class="drawer" id="drawer">
  <ul>
{drawer_items}
  </ul>
  <a class="btn btn--gold btn--block" href="contact.html">Speak to an advisor</a>
</div>

<main id="main">
"""

FOOTER = """
</main>

<footer class="footer">
  <div class="shell">
    <div class="footer__grid">
      <div>
        <a class="brand" href="index.html" aria-label="{site} — home">
          <span class="brand__name">EuroHellenic<small>Education &amp; student services</small></span>
        </a>
        <p style="margin-top:22px;max-width:32ch">
          Independent, one-to-one guidance for international students who want
          to study for an English-taught degree in Greece.
        </p>
        <p style="margin-top:18px">
          <a href="mailto:{email}">{email}</a>
        </p>
      </div>

      <div>
        <h4>Study</h4>
        <ul>
          <li><a href="programmes.html">Programmes</a></li>
          <li><a href="programmes.html#institutions">Institutions</a></li>
          <li><a href="costs-and-visa.html">Costs &amp; visa</a></li>
          <li><a href="costs-and-visa.html#living">Living in Greece</a></li>
        </ul>
      </div>

      <div>
        <h4>Help</h4>
        <ul>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>

      <div>
        <h4>Organisation</h4>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="about.html#support">Tutoring &amp; fees</a></li>
          <li><a href="mailto:{partners}">{partners}</a></li>
        </ul>
      </div>
    </div>

    <div class="footer__bar">
      <p style="margin:0">&copy; <span data-year>2026</span> {site}. All rights reserved.</p>
      <p style="margin:0;max-width:62ch">
        EuroHellenic is an independent advisory service. Tuition, living costs and visa
        information on this site are indicative, gathered from published sources, and may
        change — always confirm current figures with the institution and the Greek
        consulate in your country.
      </p>
    </div>
  </div>
</footer>

<script src="assets/js/main.js" defer></script>
</body>
</html>
"""


def build_nav(current):
    """Return (primary nav <li>s, drawer <li>s) with aria-current on the active page."""
    primary, drawer = [], []
    items = PRIMARY_NAV + ["faq"]
    for slug in items:
        label = TITLES[slug][0]
        cur = ' aria-current="page"' if slug == current else ""
        primary.append(f'      <li><a href="{slug}.html"{cur}>{label}</a></li>')
    for slug in ["index"] + PRIMARY_NAV + ["faq", "contact"]:
        label = "Home" if slug == "index" else TITLES[slug][0]
        cur = ' aria-current="page"' if slug == current else ""
        drawer.append(f'    <li><a href="{slug}.html"{cur}>{label}</a></li>')
    return "\n".join(primary), "\n".join(drawer)


def extra_schema(slug):
    """Page-specific structured data."""
    if slug == "faq":
        return ""  # injected inside the fragment itself
    if slug == "index":
        return """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "EuroHellenic",
  "url": "%s",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "%s/programmes.html?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>""" % (SITE_URL, SITE_URL)
    return ""


def main():
    if not PAGES_DIR.exists():
        raise SystemExit(f"Missing fragments directory: {PAGES_DIR}")

    built = 0
    for slug, label, title, desc in PAGES:
        frag = PAGES_DIR / f"{slug}.html"
        if not frag.exists():
            print(f"  ! skipped {slug}.html (no fragment found)")
            continue

        body = frag.read_text(encoding="utf-8")
        canonical = "" if slug == "index" else f"{slug}.html"
        primary, drawer = build_nav(slug)

        html = (
            HEAD.format(title=title, site=SITE_NAME, desc=desc, url=SITE_URL,
                        canonical=canonical, email=EMAIL_STUDENTS,
                        extra_schema=extra_schema(slug))
            + HEADER.format(site=SITE_NAME, nav_items=primary, drawer_items=drawer)
            + body.rstrip()
            + FOOTER.format(site=SITE_NAME, email=EMAIL_STUDENTS, partners=EMAIL_PARTNERS)
        )

        out = ROOT / f"{slug}.html"
        out.write_text(html, encoding="utf-8")
        print(f"  ✓ {out.name}")
        built += 1

    # sitemap
    urls = "\n".join(
        f"  <url><loc>{SITE_URL}/{'' if s == 'index' else s + '.html'}</loc>"
        f"<changefreq>monthly</changefreq>"
        f"<priority>{'1.0' if s == 'index' else '0.8'}</priority></url>"
        for s, _, _, _ in PAGES if s not in NO_INDEX
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n", encoding="utf-8")
    print("  ✓ sitemap.xml")

    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    print("  ✓ robots.txt")

    print(f"\nBuilt {built} pages into {ROOT}")


if __name__ == "__main__":
    main()
