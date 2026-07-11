#!/usr/bin/env python3
"""Generate the typed content layer from the WordPress database dump.

Reads the MySQL dump of omrimeron.com and writes:
  content/types.ts                 shared content-layer interfaces
  content/site.ts                  SiteSettings singleton (identity, contact, nav)
  content/pages.ts                 13 in-scope Page documents
  content/galleries.ts             25 Gallery documents (10 page + 15 standalone)
  content/clients.ts               28 Client documents
  content/media-manifest.json      attachment id -> source file/dims/mime (future CMS re-attachment; not imported by the app)
  tests/fixtures/source-inventory.json  frozen expected values for the content integrity tests

Run once; output is committed. Hand edits to content/*.ts afterwards are
expected (that is the point of the content layer). Rerunning overwrites.

Usage: python3 scripts/extract_content.py [path-to-dump.sql]
"""
import json
import html
import re
import sys
import urllib.parse
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_DUMP = Path.home() / "Documents/personal/omrimero_omrimeron.sql"

# Owner decision 2026-07-11: single email everywhere (source page showed a
# different visible address than its mailto target; see specs research.md).
EMAIL = "meronok@gmail.com"
TAGLINE = "Photographer"  # source has the typo "Photograper"; corrected per spec assumption

HOME_ID = "228"
OUR_CLIENTS_ID = "355"
ABOUT_ID = "330"
CONTACT_ID = "332"
EXCLUDED_PAGE_IDS = {"612", "660", "721"}  # unused drafts, out of scope per spec

LAYOUTS = {ABOUT_ID: "text", CONTACT_ID: "contact", OUR_CLIENTS_ID: "clientGrid"}
DISPLAY_MODES = {"Slider": "slider", "FancyBox Gallery": "fancybox", "Image Gallery": "grid"}

ESCAPES = {"n": "\n", "r": "\r", "t": "\t", "0": "\0", "Z": "\x1a"}


def parse_insert(sql, table):
    """Tokenize INSERT tuples for `table`, honoring quotes and MySQL escapes."""
    rows = []
    for m in re.finditer(r"INSERT INTO `%s`[^(]*(?:\([^)]*\)\s*)?VALUES\s*" % table, sql):
        i, n = m.end(), len(sql)
        while i < n:
            if sql[i] == "(":
                row, cur, i, in_str = [], "", i + 1, False
                while i < n:
                    c = sql[i]
                    if in_str:
                        if c == "\\":
                            nxt = sql[i + 1]
                            cur += ESCAPES.get(nxt, nxt)
                            i += 2
                            continue
                        if c == "'":
                            in_str = False
                            i += 1
                            continue
                        cur += c
                        i += 1
                        continue
                    if c == "'":
                        in_str = True
                    elif c == ",":
                        row.append(cur.strip())
                        cur = ""
                    elif c == ")":
                        row.append(cur.strip())
                        rows.append(row)
                        i += 1
                        break
                    else:
                        cur += c if not c.isspace() else ""
                        i += 1
                        continue
                    i += 1
            elif sql[i] == ";":
                break
            else:
                i += 1
    return rows


def cols_of(sql, table):
    hdr = re.search(r"CREATE TABLE `%s` \((.*?)\n\)" % table, sql, re.S).group(1)
    return re.findall(r"^\s*`(\w+)`", hdr, re.M)


def strip_html(text):
    """HTML fragment -> plain text paragraphs joined by blank lines."""
    text = re.sub(r"</(h\d|p|div)>", "\n\n", text)  # block-tag ends are paragraph breaks
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\xa0", " ")
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\r?\n\s*\r?\n", text)]
    return "\n\n".join(p for p in paras if p)


def slot(position, source_ref, alt, attachments=None, att_id=None):
    s = {"position": position, "sourceRef": source_ref, "alt": alt}
    att = (attachments or {}).get(att_id)
    if att:
        if att.get("width"):
            s["width"] = att["width"]
        if att.get("height"):
            s["height"] = att["height"]
    return s


def ts_file(name, imports, decls):
    header = (
        "// Generated from the WordPress dump by scripts/extract_content.py (2026-07-11).\n"
        "// Hand edits after generation are expected; rerunning the script overwrites.\n"
    )
    return header + imports + "\n" + decls


def emit(value):
    return json.dumps(value, indent=2, ensure_ascii=False)


def main():
    dump = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DUMP
    sql = dump.read_text(encoding="utf-8", errors="replace")

    pc = cols_of(sql, "wp_posts")
    pix = {c: i for i, c in enumerate(pc)}
    posts = {r[pix["ID"]]: r for r in parse_insert(sql, "wp_posts") if len(r) == len(pc)}
    mc = cols_of(sql, "wp_postmeta")
    mix = {c: i for i, c in enumerate(mc)}
    pmeta = {}
    for r in parse_insert(sql, "wp_postmeta"):
        pmeta.setdefault(r[mix["post_id"]], {})[r[mix["meta_key"]]] = r[mix["meta_value"]]

    def post(pid, col):
        return posts[pid][pix[col]]

    # --- attachments (for dimensions + media manifest) -----------------------
    attachments = {}
    for pid, r in posts.items():
        if post(pid, "post_type") != "attachment":
            continue
        meta = pmeta.get(pid, {})
        wp_meta = meta.get("_wp_attachment_metadata", "")
        w = re.search(r's:5:"width";i:(\d+)', wp_meta)
        h = re.search(r's:6:"height";i:(\d+)', wp_meta)
        attachments[pid] = {
            "title": post(pid, "post_title"),
            "file": meta.get("_wp_attached_file", ""),
            "mime": post(pid, "post_mime_type"),
            "url": post(pid, "guid"),
            "width": int(w.group(1)) if w else None,
            "height": int(h.group(1)) if h else None,
        }

    # --- pages ----------------------------------------------------------------
    pages, page_galleries = [], []
    for pid, r in sorted(posts.items(), key=lambda x: int(x[0])):
        if post(pid, "post_type") != "page" or post(pid, "post_status") != "publish":
            continue
        if pid in EXCLUDED_PAGE_IDS:
            continue
        slug = urllib.parse.unquote(post(pid, "post_name"))
        title = post(pid, "post_title")
        layout = LAYOUTS.get(pid, "slider")
        page = {
            "_type": "page",
            "_id": f"page-{pid}",
            "title": title,
            "slug": slug,
            "layout": layout,
            "inNavigation": pid != OUR_CLIENTS_ID,
        }
        if layout == "slider":
            gallery_id = f"gallery-page-{pid}"
            att_ids = [a for a in pmeta[pid].get("_page_image_gallery", "").split(",") if a]
            n = len(att_ids)
            page_galleries.append(
                {
                    "_type": "gallery",
                    "_id": gallery_id,
                    "name": title,
                    "displayMode": "slider",
                    "standalone": False,
                    "slots": [
                        slot(i, f"wp-attachment-{a}", f"{title} placeholder {i + 1} of {n}", attachments, a)
                        for i, a in enumerate(att_ids)
                    ],
                }
            )
            page["galleryId"] = gallery_id
        if pid == ABOUT_ID:
            page["body"] = strip_html(post(pid, "post_content"))
        pages.append(page)

    # --- standalone galleries ---------------------------------------------------
    standalone = []
    for pid, r in sorted(posts.items(), key=lambda x: int(x[0])):
        if post(pid, "post_type") != "gallery" or post(pid, "post_status") != "publish":
            continue
        name = post(pid, "post_title")
        att_ids = [a for a in pmeta[pid].get("_gallery_post_type_image_gallery", "").split(",") if a]
        n = len(att_ids)
        standalone.append(
            {
                "_type": "gallery",
                "_id": f"gallery-{pid}",
                "name": name,
                "displayMode": DISPLAY_MODES[pmeta[pid]["mega_gallery_type"]],
                "standalone": True,
                "slots": [
                    slot(i, f"wp-attachment-{a}", f"{name} placeholder {i + 1} of {n}", attachments, a)
                    for i, a in enumerate(att_ids)
                ],
            }
        )
    galleries = page_galleries + standalone

    # --- navigation ---------------------------------------------------------------
    nav_items = []
    for pid, r in posts.items():
        if post(pid, "post_type") == "nav_menu_item":
            target = pmeta[pid]["_menu_item_object_id"]
            nav_items.append((int(post(pid, "menu_order")), post(target, "post_title"), f"page-{target}"))
    navigation = [{"label": label, "pageId": page_id} for _, label, page_id in sorted(nav_items)]

    # --- contact page fields ----------------------------------------------------
    contact_html = post(CONTACT_ID, "post_content")
    map_url = re.search(r'src="(https://www\.google\.com/maps/embed[^"]+)"', contact_html).group(1)
    contact_text = strip_html(re.sub(r"<iframe.*?</iframe>", "", contact_html, flags=re.S))
    address = re.search(r"Studio Omri Meron\s+(.+?)\s+Mobile:", contact_text, re.S).group(1).strip()
    phone = re.search(r"Mobile:\s*([\d\s-]+)", contact_text).group(1).strip()

    site = {
        "_type": "siteSettings",
        "title": post_title_site(sql),
        "tagline": TAGLINE,
        "contact": {"address": address, "phone": phone, "email": EMAIL, "mapEmbedUrl": map_url},
        "navigation": navigation,
    }

    # --- clients (hard-coded HTML table on the Our Clients page) ------------------
    clients = []
    for cell in re.findall(r"<td.*?</td>", post(OUR_CLIENTS_ID, "post_content"), re.S):
        titles = [t.strip() for t in re.findall(r'<div class="client-title">(.*?)</div>', cell, re.S)]
        names = [t for t in titles if t and "<" not in t]
        img = re.search(r'<img[^>]*src="([^"]+)"', cell)
        if not names:
            continue
        name = html.unescape(names[-1])
        clients.append(
            {
                "_type": "client",
                "_id": "client-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
                "name": name,
                "order": len(clients),
                "logoSlot": {
                    "position": 0,
                    "sourceRef": img.group(1) if img else "",
                    "alt": f"{name} logo",
                },
            }
        )

    # --- invariants (source-verified) ---------------------------------------------
    page_slots = sum(len(g["slots"]) for g in page_galleries)
    standalone_slots = sum(len(g["slots"]) for g in standalone)
    assert len(navigation) == 12, f"nav items: {len(navigation)}"
    assert len(pages) == 13, f"pages: {len(pages)}"
    assert len(page_galleries) == 10 and page_slots == 174, f"page galleries {len(page_galleries)}, slots {page_slots}"
    assert len(standalone) == 15 and standalone_slots == 182, f"standalone {len(standalone)}, slots {standalone_slots}"
    assert len(clients) == 28, f"clients: {len(clients)}"
    assert len({p["slug"] for p in pages}) == 13, "duplicate slugs"
    gallery_ids = {g["_id"] for g in galleries}
    assert all(p.get("galleryId") in gallery_ids for p in pages if p["layout"] == "slider"), "dangling galleryId"
    page_ids = {p["_id"] for p in pages}
    assert all(n["pageId"] in page_ids for n in navigation), "nav points at missing page"

    # --- write outputs ---------------------------------------------------------------
    content_dir = REPO / "content"
    content_dir.mkdir(exist_ok=True)
    fixtures_dir = REPO / "tests" / "fixtures"
    fixtures_dir.mkdir(parents=True, exist_ok=True)

    (content_dir / "types.ts").write_text(TYPES_TS, encoding="utf-8")
    (content_dir / "site.ts").write_text(
        ts_file("site", "import type { SiteSettings } from './types'\n", f"export const siteSettings: SiteSettings = {emit(site)}\n"),
        encoding="utf-8",
    )
    (content_dir / "pages.ts").write_text(
        ts_file("pages", "import type { Page } from './types'\n", f"export const pages: Page[] = {emit(pages)}\n"),
        encoding="utf-8",
    )
    (content_dir / "galleries.ts").write_text(
        ts_file("galleries", "import type { Gallery } from './types'\n", f"export const galleries: Gallery[] = {emit(galleries)}\n"),
        encoding="utf-8",
    )
    (content_dir / "clients.ts").write_text(
        ts_file("clients", "import type { Client } from './types'\n", f"export const clients: Client[] = {emit(clients)}\n"),
        encoding="utf-8",
    )
    referenced = {s["sourceRef"].removeprefix("wp-attachment-") for g in galleries for s in g["slots"]}
    manifest = {
        aid: {**att, "referenced": aid in referenced}
        for aid, att in sorted(attachments.items(), key=lambda x: int(x[0]))
    }
    (content_dir / "media-manifest.json").write_text(emit(manifest) + "\n", encoding="utf-8")

    fixture = {
        "navLabels": [n["label"] for n in navigation],
        "pageSlugs": sorted(p["slug"] for p in pages),
        "pageSlotCounts": {p["slug"]: len(next(g for g in galleries if g["_id"] == p["galleryId"])["slots"]) for p in pages if p["layout"] == "slider"},
        "standaloneSlotCounts": {g["name"]: len(g["slots"]) for g in standalone},
        "clientNames": [c["name"] for c in clients],
    }
    (fixtures_dir / "source-inventory.json").write_text(emit(fixture) + "\n", encoding="utf-8")

    missing = [a for a in referenced if a not in attachments]
    print(f"pages: {len(pages)}, nav: {len(navigation)}, galleries: {len(galleries)} "
          f"(page slots {page_slots}, standalone slots {standalone_slots}), clients: {len(clients)}")
    print(f"attachments in manifest: {len(manifest)}; slot refs without attachment row: {len(missing)}"
          + (f" -> {sorted(missing, key=int)}" if missing else ""))
    print("wrote content/{types,site,pages,galleries,clients}.ts, content/media-manifest.json, tests/fixtures/source-inventory.json")


def post_title_site(sql):
    m = re.search(r"'blogname',\s*'([^']*)'", sql)
    return m.group(1) if m else "Omri Meron"


TYPES_TS = """// Content-layer types. Shapes mirror the future Sanity schemas:
// documents carry _type and a stable _id; cross-references are by _id.
export interface ImageSlot {
  position: number
  sourceRef: string // wp-attachment-<id> or source logo URL; the durable link for attaching real media later
  alt: string
  width?: number // source image dimensions where known (aspect-ratio-correct placeholders)
  height?: number
}

export interface NavigationItem {
  label: string
  pageId: string
}

export interface SiteSettings {
  _type: 'siteSettings'
  title: string
  tagline: string
  contact: {
    address: string
    phone: string
    email: string
    mapEmbedUrl: string
  }
  navigation: NavigationItem[]
}

export type PageLayout = 'slider' | 'text' | 'contact' | 'clientGrid'

export interface Page {
  _type: 'page'
  _id: string
  title: string
  slug: string
  layout: PageLayout
  galleryId?: string
  body?: string
  inNavigation: boolean
}

export type GalleryDisplayMode = 'slider' | 'fancybox' | 'grid'

export interface Gallery {
  _type: 'gallery'
  _id: string
  name: string
  displayMode: GalleryDisplayMode
  standalone: boolean
  slots: ImageSlot[]
}

export interface Client {
  _type: 'client'
  _id: string
  name: string
  order: number
  logoSlot: ImageSlot
}
"""

if __name__ == "__main__":
    main()
