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
  menu item means editing 11 files. This script keeps the chrome in ONE place.

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
    ("why-greece",     "Why Greece",     "Why Study in Greece — English-Taught Degrees in the EU",
     "Why Greece works for international students: UK and US degrees taught in English, lower total cost than the UK, Schengen access and a safe Mediterranean student life."),
    ("programmes",     "Programmes",     "Study Areas & Programmes — Bachelor's and Master's in Greece",
     "Browse English-taught undergraduate, postgraduate and foundation programmes in Greece across business, computing, engineering, psychology, health and hospitality."),
    ("institutions",   "Institutions",   "Institutions We Introduce — Colleges & Universities in Greece",
     "The Greek and Cypriot institutions we introduce students to, the UK and US universities that award their degrees, and indicative annual tuition fees."),
    ("costs-and-visa", "Costs & Visa",   "Tuition, Living Costs & the Greek Student Visa Explained",
     "Real numbers: indicative tuition from €6,750/year, monthly student living costs in Athens, and a step-by-step guide to the Greek national D student visa and residence permit."),
    ("student-life",   "Student Life",   "Student Life in Greece — Cities, Housing and Working",
     "What life actually looks like: Athens, Thessaloniki and Crete compared, finding accommodation, the 20-hour student work allowance, healthcare and getting settled."),
    ("support",        "Our Support",    "How We Support You — From First Enquiry to Graduation",
     "Application guidance, document preparation, visa support, accommodation help, arrival preparation and academic tutoring in English, IELTS, IGCSE and A Levels."),
    ("about",          "About",          "About EuroHellenic — Personal Education Guidance",
     "EuroHellenic is a personal education advisory service led by an experienced Head of English Department and Academic & Careers Advisor."),
    ("partners",       "Partners",       "For Schools & Agents — Partner With EuroHellenic",
     "A transparent referral route to Greek higher education for international schools, counsellors and education agents in India, China, the Philippines and beyond."),
    ("faq",            "FAQ",            "Frequently Asked Questions — Studying in Greece",
     "Straight answers on recognition of degrees, English requirements, visa refusals, working while studying, staying in Europe after graduation and what our service costs."),
    ("contact",        "Contact",        "Contact an Advisor — Start Your Application",
     "Tell us what you want to study and an advisor will reply within two working days with the routes that realistically fit your profile and budget."),
    ("404",            "Not found",      "Page Not Found",
     "The page you were looking for does not exist. Try the homepage, the programme list, or contact an advisor directly."),
]

# Pages excluded from sitemap.xml
NO_INDEX = {"404"}

# Which pages appear in the primary nav (FAQ and Contact live elsewhere)
PRIMARY_NAV = ["why-greece", "programmes", "institutions", "costs-and-visa", "student-life", "about", "partners"]

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
<meta property="og:image" content="{url}/assets/img/crest.svg">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/crest.svg">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="assets/css/style.css">

<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "{site}",
  "alternateName": "EuroHellenic Education & Student Services",
  "url": "{url}",
  "logo": "{url}/assets/img/crest.svg",
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
      <img class="brand__mark" src="assets/img/crest.svg" alt="" width="42" height="42">
      <span class="brand__name">EUROHELLENIC<small>EDUCATION &amp; STUDENT SERVICES</small></span>
    </a>

    <ul class="nav__links">
{nav_items}
    </ul>

    <a class="btn btn--sm nav__cta" href="contact.html">
      Speak to an advisor <span class="arr" aria-hidden="true">&rarr;</span>
    </a>

    <button class="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">
      <span></span>
    </button>
  </nav>
</header>

<div class="drawer" id="drawer">
  <ul>
{drawer_items}
  </ul>
  <a class="btn btn--gold btn--block" href="contact.html">
    Speak to an advisor <span class="arr" aria-hidden="true">&rarr;</span>
  </a>
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
          <img class="brand__mark" src="assets/img/crest.svg" alt="" width="42" height="42">
          <span class="brand__name">EUROHELLENIC<small>EDUCATION &amp; STUDENT SERVICES</small></span>
        </a>
        <p style="margin-top:22px;max-width:32ch">
          Independent guidance for international students building a European future,
          starting in Greece.
        </p>
        <p style="margin-top:18px">
          <a href="mailto:{email}" class="tlink tlink--gold">{email}</a>
        </p>
      </div>

      <div>
        <h4>Study</h4>
        <ul>
          <li><a href="why-greece.html">Why Greece</a></li>
          <li><a href="programmes.html">Programmes</a></li>
          <li><a href="institutions.html">Institutions</a></li>
          <li><a href="costs-and-visa.html">Costs &amp; visa</a></li>
        </ul>
      </div>

      <div>
        <h4>Practical</h4>
        <ul>
          <li><a href="student-life.html">Student life</a></li>
          <li><a href="support.html">Our support</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>

      <div>
        <h4>Organisation</h4>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="partners.html">For schools &amp; agents</a></li>
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
    for slug in ["index"] + PRIMARY_NAV + ["support", "faq", "contact"]:
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
