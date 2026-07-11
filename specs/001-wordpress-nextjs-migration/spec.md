# Feature Specification: WordPress to Next.js Migration (Omri Meron Studio)

**Feature Branch**: `001-wordpress-nextjs-migration`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Migrate the WordPress website (omrimeron) to Next.js and React. The site will later be connected to Vercel (hosting) and Sanity.io (CMS). Migrate all logic, tab names (navigation), and logos, but without migrating images. Source material: WordPress backup at /Users/noam.meron/Documents/personal/backup-7.11.2026_06-52-32_omrimero and database dump at /Users/noam.meron/Documents/personal/omrimero_omrimeron.sql"

## Source Site Inventory (extracted from the WordPress database dump)

- **Site identity**: "Omri Meron", tagline "Photographer" (source has the typo "Photograper"), a commercial photography studio in Tel Aviv.
- **Navigation menu** (12 tabs, in this exact order):
  1. Home
  2. About the studio
  3. Products & Pack-shots
  4. Jewlery (spelled this way in the source)
  5. People
  6. Architecture + Interior
  7. Wine & More
  8. Food
  9. Industry
  10. Life style
  11. Holiday Cards
  12. Contact
- **Page behavior**: Home and all portfolio category pages (tabs 3-11) use a fullscreen image-slider layout, each backed by an ordered list of gallery images. "About the studio" is a text page (studio bio). "Contact" shows studio address, phone, email, and an embedded map. An additional "Our Clients" page (not in the menu) shows a grid of ~28 client logos with client names.
- **Standalone galleries**: 15 named gallery collections exist (e.g., RONA, B&H, EMANUEL, CHEROKEE) with slider, fancybox-gallery, or image-grid display modes; some are reachable by direct URL.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor browses the portfolio by category (Priority: P1)

A prospective client lands on the site, sees the studio's name and navigation tabs, and clicks through the portfolio categories (Food, People, Jewlery, etc.). Each category page presents that category's image gallery in a fullscreen slider layout, exactly as the current site does, with placeholder images standing in until real media is connected later.

**Why this priority**: The portfolio pages are the entire commercial purpose of a photography site. Navigation plus per-category gallery display is the minimum viable replacement of the WordPress site.

**Independent Test**: Open the site root, verify all 12 tabs appear in the source order with the source names, click each portfolio tab, and confirm each renders a working slider with the correct number of gallery slots for that category.

**Acceptance Scenarios**:

1. **Given** the site is running, **When** a visitor opens any page, **Then** the header shows the studio name/logo (text-based) and all 12 navigation tabs in the source order with the exact source names.
2. **Given** a visitor is on any page, **When** they click a portfolio tab (e.g., "Food"), **Then** they land on that category's page showing a fullscreen slider with one slot per source gallery image, in the source order.
3. **Given** a visitor is on a portfolio page, **When** they advance the slider, **Then** images cycle in order and wrap around, matching the current site's slider behavior.

---

### User Story 2 - Visitor reads about the studio and gets in touch (Priority: P2)

A visitor opens "About the studio" and reads the studio bio, then opens "Contact" to find the address, phone number, email link, and an embedded map.

**Why this priority**: These are the conversion pages; without them the portfolio has no call to action, but they are simpler and independent of the gallery system.

**Independent Test**: Open the About and Contact pages directly by URL and verify their content against the source site.

**Acceptance Scenarios**:

1. **Given** the site is running, **When** a visitor opens "About the studio", **Then** the full studio bio text from the source site is shown ("Studio Omri Meron... Living six years in New York City...").
2. **Given** the site is running, **When** a visitor opens "Contact", **Then** the studio address (Rabenu Khanan'el St 29, Tel Aviv-Yafo), phone (972 54 2999-663), a clickable email link, and an embedded map are shown.

---

### User Story 3 - Visitor views the client list (Priority: P3)

A visitor opens the "Our Clients" page and sees the studio's client roster (Osem, Strauss, Elite, Max Brenner, etc.) presented as a grid of client entries by name, with logo image slots left as placeholders.

**Why this priority**: Social proof page; valuable but not on the main menu in the source site and not required for a viable launch.

**Independent Test**: Open the "Our Clients" page URL directly and compare the client names against the source page content.

**Acceptance Scenarios**:

1. **Given** the site is running, **When** a visitor opens the "Our Clients" page URL, **Then** all client names from the source page appear as a grid, each with a placeholder logo slot.

---

### User Story 4 - Content is structured for a future CMS (Priority: P2)

The site owner (or developer) can later swap the migrated content source for a hosted CMS and the site's pages continue to work, because all migrated content (navigation, page text, gallery definitions, client list) lives in a single structured content layer rather than being hard-coded into page markup.

**Why this priority**: The stated follow-up goal is connecting a hosted CMS and cloud hosting; the migration must not create rework.

**Independent Test**: Rename one navigation tab in the content layer and verify the site reflects it without changes to presentation components.

**Acceptance Scenarios**:

1. **Given** the migrated site, **When** a developer inspects the code, **Then** navigation items, page copy, gallery definitions, and the client list are defined as structured data separate from presentation components.
2. **Given** the structured content layer, **When** a content entry is edited (e.g., a tab renamed), **Then** the change propagates to the site without touching presentation components.

### Edge Cases

- Direct visits to old WordPress URLs (e.g., `/food/`, `/contact/`, the URL-encoded Hebrew slug for "Industry") should resolve to the corresponding new pages so existing links and search results keep working.
- A gallery with zero images (possible once real media is stripped) must render an empty-state placeholder, not a broken slider.
- The source contains unused/draft-like pages ("Home page with Video", "New home page", "Photography of art works"): these are out of scope and must not appear in navigation.
- Non-Latin characters and special characters in content (e.g., "Müller", the "&" in "Products & Pack-shots" and "Wine & More") must display correctly.
- Visitors on mobile must be able to open the navigation and use the sliders (the source theme was responsive).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST display a header on every page with the studio's text-based logo/name ("Omri Meron") and the 12 navigation tabs listed in the Source Site Inventory, in the same order and with identical wording (including the source spelling "Jewlery").
- **FR-002**: Each portfolio category page (Home, Products & Pack-shots, Jewlery, People, Architecture + Interior, Wine & More, Food, Industry, Life style, Holiday Cards) MUST render a fullscreen image slider with one slide slot per image in the corresponding source gallery, preserving the source ordering.
- **FR-003**: Image slots MUST use neutral placeholders; no image files from the WordPress site are copied or served. Each placeholder MUST retain the slot's identity (source attachment reference) so real media can be attached later.
- **FR-004**: The "About the studio" page MUST present the complete studio bio text from the source page.
- **FR-005**: The "Contact" page MUST present the studio address, phone number, a clickable email link, and an embedded map for the studio location.
- **FR-006**: The "Our Clients" page MUST list every client name from the source page in a grid layout with placeholder logo slots, and MUST be reachable by URL without appearing in the main navigation (matching the source).
- **FR-007**: All migrated content (navigation items, page copy, gallery definitions with image slot lists, client list, site identity) MUST live in a structured content layer separate from presentation components, shaped so it can later be served from a hosted CMS without changing page structure.
- **FR-008**: Old site URL paths for the pages in navigation (e.g., `/food/`, `/people/`, `/contact/`, `/about-the-studio/`) MUST resolve to the corresponding new pages, including the URL-encoded Hebrew slug used by the "Industry" page.
- **FR-009**: The site MUST be fully navigable on mobile and desktop viewports, including menu access and slider interaction.
- **FR-010**: Pages excluded from scope (unused drafts, standalone gallery collections not linked from navigation) MUST NOT appear in navigation; standalone gallery collections' definitions MUST still be captured in the structured content layer for future use.
- **FR-011**: The site MUST be deployable as a standard modern web application to a cloud hosting platform without further code changes.

### Key Entities

- **Site Identity**: studio name, tagline, contact details (address, phone, email), map location.
- **Navigation Item**: label (exact source wording), order position, target page.
- **Page**: title, URL slug (source slug preserved), layout type (slider, text, contact, client-grid), body text where applicable.
- **Gallery**: name, display mode (slider, fancybox, grid), ordered list of Image Slots; associated with a Page or standalone.
- **Image Slot**: position in gallery, source attachment reference, placeholder state (no binary image data migrated).
- **Client**: display name, order position, placeholder logo slot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 12 navigation tab names and their order match the source site exactly (verified by side-by-side comparison against the database dump).
- **SC-002**: Every portfolio category page renders a slider whose slot count equals the source gallery's image count (10 category pages verified).
- **SC-003**: 100% of the About bio text, contact details, and client names from the source appear in the migrated site with correct spelling and special characters.
- **SC-004**: All in-scope source URL paths resolve successfully (no dead ends) when entered directly.
- **SC-005**: A visitor can reach any portfolio category from the home page in one click, on both mobile and desktop viewports.
- **SC-006**: Zero image binaries from the source site are present in the migrated project.
- **SC-007**: Renaming one navigation tab in the content layer changes the site's navigation without any presentation component being edited.

## Assumptions

- "Logos without images" is interpreted as: the site logo is rendered as text ("Omri Meron"), and client logos are represented by client names with placeholder logo slots; no image files are migrated. Gallery images likewise become placeholders that preserve structure and count.
- The "Home" tab (source page "Home", slug `home`) is the site's landing page in the new site. The source database sets the WordPress front page to "About the studio" (page 330), but the menu's first tab is "Home"; the menu is treated as authoritative. This should be confirmed with the owner before launch.
- Unpublished/experimental source pages ("Home page with Video", "New home page", "Photography of art works") are out of scope.
- The 15 standalone gallery collections (RONA, B&H, etc.) are captured as structured content but only surfaced where a navigation page references them; no new pages are created for them.
- Cloud hosting (Vercel) deployment and hosted CMS (Sanity.io) integration are explicitly follow-up work: this feature only requires the content layer to be CMS-ready and the app to be deployable, not the actual accounts, project setup, or content sync.
- The source tagline typo "Photograper" is corrected to "Photographer" in the migrated site.
- The embedded map may use the same public map embed as the source site.
- No contact form exists on the source site (contact is via email link and phone), so none is added.
