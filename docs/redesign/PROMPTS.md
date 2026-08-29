# Our Frame Premium Redesign — Prompt Sequence

Source: page-by-page redesign brief provided 2026-08-28/29. Run one PR at a
time, in order. Do not skip review or verification. Each PR is delegated to
`our-frame-implementer`, then `our-frame-reviewer`, then `our-frame-verifier`,
tracked in `docs/redesign/STATE.md`.

Execution order (grouped from the original 13 page prompts into 10 PRs so
shared primitives land before the pages that depend on them):

| PR | Covers | Why this order |
|---|---|---|
| 1 | Global Design System + Navigation | Everything else reuses these tokens/components |
| 2 | Home / Landing | First page proving the new direction |
| 3 | Photos Overview | Chapter browser used by all category pages |
| 4 | Arjun / Album Detail (gallery primitives) | Establishes MasonryGallery/GalleryTabs reused by Travel/Milestones/Life |
| 5 | Photo Lightbox / Viewer | Reused by every gallery page |
| 6 | Travel, Milestones, Life | Reuse gallery + lightbox primitives from PR 4/5 |
| 7 | Videos | Reuses lightbox visual language for the player |
| 8 | Favorites | Reuses gallery/empty-state primitives |
| 9 | Memories / On This Day | Reuses gallery/empty-state/timeline primitives |
| 10 | Mobile polish pass | Cross-cutting, needs every page above to exist first |

Each PR is its own git branch off `main`, reviewed and verified before the
next PR starts, per the user's explicit request to avoid one giant rewrite.

---

## PR 1 — Global Design System + Navigation

```text
Create/refine the shared design system for Our Frame.

Do not redesign individual pages in this task unless necessary to extract reusable primitives.

The application is a private family photo archive.

The visual identity should be:

Premium
Intimate
Timeless
Cinematic
Editorial
Warm
Photo-first

It must NOT feel like:
- a SaaS dashboard
- a generic image gallery
- Instagram
- Google Photos clone
- Netflix
- a wedding website
- an orange/black theme template

COLOR SYSTEM

Create semantic design tokens instead of scattering hardcoded colors.

Suggested direction:

Background primary:
very deep charcoal / warm black

Background elevated:
slightly lighter warm charcoal

Text primary:
warm ivory / cream

Text secondary:
muted warm gray

Accent:
restrained antique bronze / warm amber

Border:
extremely low-opacity warm gray/bronze

Do not make bronze the dominant color.
It should represent approximately 5–10% of the visual experience.

TYPOGRAPHY

Use a sophisticated editorial serif for:
- page titles
- emotional headings
- album titles
- quotes

Use a modern clean sans-serif for:
- navigation
- metadata
- buttons
- controls
- body copy

Create clear reusable typography tokens.

Example hierarchy:

Display
64–80px desktop
42–52px mobile

H1
48–60px

H2
32–40px

H3
24–30px

Body
15–17px

Small metadata
12–13px

Avoid excessive uppercase typography.

Use uppercase mainly for small editorial eyebrow labels.

SPACING

Increase whitespace throughout the application.

Create reusable spacing tokens.

Interior pages should use a consistent max-width container.

Photography pages may exceed normal content width where visual impact benefits.

BORDERS

Minimize borders.

Where needed:
1px low-opacity border.

Never create bright card outlines.

RADIUS

Use consistent subtle corner radii:
approximately 12–20px depending on component size.

Do not make everything extremely rounded.

SHADOWS

Extremely restrained.

Most elevation should come from:
- contrast
- layering
- spacing
rather than visible drop shadows.

BUTTONS

Primary:
warm bronze background
dark text
restrained radius

Secondary:
transparent
subtle border
cream text

Tertiary:
plain text + arrow

Avoid excessive buttons.

ICONS

Use one consistent thin-line icon library.

Avoid emoji.

Avoid mixing multiple icon styles.

MOTION

Create shared motion tokens.

Fast:
150–180ms

Standard:
220–300ms

Slow editorial:
400–600ms

Use subtle easing.

Allowed:
- tiny scale
- opacity
- translate 2–6px
- slow image reveal

Avoid:
- bouncing
- springy controls
- exaggerated parallax
- glowing animation

PHOTO TREATMENT

Photography must always remain the star.

Do not globally apply strong filters.

Use overlays only when needed for text legibility.

Respect original aspect ratios whenever possible.

Create reusable components for:

- PageIntro
- EditorialEyebrow
- ChapterCard
- PhotoGrid
- MasonryGallery
- GalleryTabs
- PhotoLightbox
- EmptyState
- SectionHeading
- TextLink
- IconButton
- FeaturedStory
- TimelineEntry

Ensure accessibility:
- sufficient contrast
- keyboard navigation
- visible focus state
- descriptive image alt text where possible
- reduced-motion preference support

The final system must make every page unmistakably part of the same premium family archive.
```

```text
Redesign only the global navigation system and apply it consistently across the app.

Do not redesign page content in this task.

Goal:
Create a navigation experience that feels quiet, premium, consistent, and almost invisible.

DESKTOP

Navigation structure:

Left:
The Kotcherlakota's

Center:
Home
Photos
Videos
Favorites
Memories

Right:
Profile avatar

Use a slim navigation height.

On the Home hero:
- navigation can float transparently over the photograph
- apply subtle backdrop blur only if required for readability

On interior pages:
- use a near-black surface
- extremely subtle bottom divider
- no large header block

ACTIVE ITEM

Do not use a thick glowing orange underline.

Instead use:
- subtle warm bronze underline
or
- slightly brighter cream text + tiny bronze indicator

Keep the effect understated.

PHOTOS / VIDEOS DROPDOWN

If dropdowns exist:
- use elegant dark floating menus
- generous padding
- no huge boxes
- subtle border
- no aggressive shadow

Photos menu could contain:
Arjun
Travel
Milestones
Life
All Photos

MOBILE

Replace desktop nav with:
- brand in center or left
- menu icon
- avatar/profile where appropriate

When opened, create a beautifully designed full-screen or large-sheet navigation.

Links should be large enough to feel intentional:

Home
Photos
Videos
Favorites
Memories

Under Photos optionally show:
Arjun
Travel
Milestones
Life

Use large serif typography selectively.

Avoid:
- standard Bootstrap nav
- chunky pills
- glowing nav elements
- cramped text
- excessive dropdown nesting

The navigation should support the experience rather than visually define it.
```

---

## PR 2 — Home / Landing Page

```text
Redesign only the Home/Landing page of my existing family photo archive app.

Do not redesign other pages in this task.

Goal:
Make the home page feel dramatically more premium, cinematic, intimate, and editorial — like a luxury family photo book rather than a generic gallery app.

Keep the existing dark visual direction, but elevate it substantially.

Design requirements:

- Use a full-bleed hero photograph as the dominant visual.
- Add a soft dark vignette and warm cinematic grading so text remains readable without making the photo feel muddy.
- Replace the current flat header feeling with a slim, elegant transparent/floating navigation.
- Keep the family brand name on the left.
- Keep navigation links such as Home, Photos, Videos, Favorites, Memories.
- Keep the profile/avatar on the right.
- Navigation should feel minimal and quiet.

Hero content:
- Replace the existing "Our Story" treatment with a stronger editorial hierarchy.
- Add a small bronze/gold eyebrow label such as:
  "WELCOME HOME"
- Main headline:
  "Every frame holds a story."
- Supporting copy:
  "A place for our favorite people, our biggest milestones, and the little moments in between."
- Add one premium primary CTA:
  "Explore Our Story"
- Use a serif display font for headlines and a clean sans-serif font for body/UI.
- Headline should feel elegant, large, and emotional rather than oversized for the sake of impact.

At the bottom of the hero, add a floating chapter rail with four destinations:
1. Arjun — Growing up
2. Travel — Places we love
3. Milestones — Big moments
4. Life — People & Moments

Each chapter card should:
- Use a subtle translucent dark surface / light glass effect
- Have one refined line icon
- Have title + short subtitle
- Feel clickable without looking like a dashboard widget
- Use very restrained bronze accents

Avoid:
- excessive gradients
- glowing neon
- large orange areas
- obvious glassmorphism
- excessive borders
- tiny UI text
- dashboard-like cards
- heavy shadows
- clutter

Interaction:
- subtle nav hover
- gentle hero image scale/parallax
- card lift of only a few pixels
- refined opacity transitions
- no flashy animations

Desktop first, but ensure the page remains elegant on mobile.

The result should feel:
timeless, cinematic, intimate, expensive, photo-first, and deeply personal.

Reuse the existing photos and content where possible.
Do not introduce fake stock imagery.
```

---

## PR 3 — Photos Overview Page

```text
Redesign only the main Photos overview page.

Do not modify individual album pages yet.

The current page feels too much like a grid of category cards. Transform it into a premium editorial chapter browser for a family archive.

The page should feel like the table of contents of a luxury photo book.

Top section:
- Keep the global navigation consistent with the Home page.
- Add generous vertical spacing below the nav.
- Add a small bronze eyebrow:
  "OUR STORY IN FRAMES"
- Main serif heading:
  "Photos"
- Supporting copy:
  "Four chapters. Every frame we have captured together."
- Add one quiet secondary action on the right:
  "View all photos"

Main chapter layout:
Show these four categories:
- Arjun
- Travel
- Milestones
- Life

Do NOT use four identical cards in a rigid grid.

Instead:
- create an asymmetric editorial mosaic
- vary card sizes slightly
- allow one or two categories to be visually dominant
- use the category photography as the primary visual element
- maintain strong whitespace between chapters

Each chapter should contain:
- small uppercase chapter label
- large serif title
- photo count
- one short poetic description
- subtle arrow affordance

Example hierarchy:
"GROWING UP, FRAME BY FRAME"
Arjun
655 photos
"Every milestone, every laugh."

Use gentle image overlays for readability.
The photos should remain rich and visible.

Styling:
- near-black background
- soft cream typography
- restrained bronze/gold highlights
- minimal borders
- subtle 16–20px corner radius
- almost invisible shadows
- lots of breathing room

On hover:
- image can scale 1–2%
- overlay can slightly brighten
- arrow can shift a few pixels
- do not add large animated effects

Responsive:
On mobile, stack the chapter cards vertically while preserving the editorial hierarchy and generous spacing.

Do not make it look like Netflix, Pinterest, or a SaaS dashboard.
It should feel like browsing chapters in a private family book.
```

---

## PR 4 — Arjun / Album Detail Page (gallery primitives)

```text
Redesign only the Arjun album/detail page.

Keep all existing photos and album data.

Goal:
Turn this into a premium storytelling gallery rather than a standard photo grid.

Header:
- Add a minimal breadcrumb:
  "Photos / Arjun"
- Use a large serif title:
  "Arjun"
- Subtitle:
  "Growing up, frame by frame."
- Show the total photo count quietly.
- Include refined Filter and Sort controls.
- Do not let filters dominate the page.

Add lightweight gallery navigation:
- All
- By Age
- By Year
- Albums

Style these as elegant text tabs rather than chunky buttons.

Optional featured section:
At the top of the photo content, create a "Featured memories" strip containing 2–4 standout photographs.
This should feel editorial and optional, not like a carousel-heavy component.

Main gallery:
Replace the rigid equal-size grid with a curated masonry/editorial gallery.

Requirements:
- mix landscape, portrait, and square proportions
- retain the original image aspect ratio wherever practical
- use larger photography
- create a visual rhythm rather than an exact repeated grid
- maintain consistent but generous gutters

Captions such as:
- 1st month
- 2nd month
- 3rd month
- 6th month
- 1st year
should remain subtle and elegant.

Photo hover:
- reveal small favorite icon
- optional date
- subtle caption treatment
- no large overlays unless needed

Clicking a photo should open a premium lightbox (see PR 5):
- near-black full-screen background
- photo centered at maximum useful size
- previous/next arrows
- favorite action
- close
- optional small caption/date
- keyboard navigation
- swipe support on mobile

Avoid:
- thick borders
- uniform card tiles
- excessive rounded rectangles
- filter bars that resemble ecommerce
- too much metadata

The final result should feel like a beautifully curated family photo album rather than file storage.
```

---

## PR 5 — Photo Lightbox / Viewer

```text
Redesign only the full-screen photo viewing experience.

This is one of the most important experiences in the app.

Goal:
When a photo is opened, the interface should disappear and the memory should become the entire experience.

BACKGROUND

Use a near-black full-screen background.

Avoid pure black if it feels harsh.

PHOTO

Display the photograph at the largest practical size while maintaining its original aspect ratio.

Do not unnecessarily crop photographs.

Allow enough surrounding breathing room so the image feels framed.

CONTROLS

Controls should remain almost invisible until needed.

Include:
- Close
- Previous
- Next
- Favorite
- optional Download if already supported
- optional Details

Place previous/next controls near the left and right edges.

Use translucent minimal circular controls.

Hide or reduce control opacity after inactivity.

METADATA

Do not overlay lots of information on the photograph.

Place optional information underneath or inside a discreet details drawer:

- date
- location
- album
- caption
- people if supported

Example:

June 14, 2026
Princeton, New Jersey

"First summer at the park."

FAVORITE

Heart animation should be extremely restrained:
- quick soft fill
- no confetti
- no exaggerated bounce

NAVIGATION

Support:
- left/right keyboard arrows
- Escape
- swipe on mobile
- click/tap edges if desired

Mobile:
- image gets maximum screen area
- controls should be thumb-friendly
- metadata can be revealed by swiping upward or tapping an info icon

Optional premium interaction:
Very subtle background ambient blur derived from the current image.

Keep opacity extremely low so it never competes with the actual photograph.

Avoid:
- carousels visible underneath
- giant toolbars
- bright icons
- heavy captions over photographs
- social-media-style controls

The viewer should feel almost like sitting in a dark room looking at a projected family photograph.
```

---

## PR 6 — Travel, Milestones, Life

### Travel

```text
Redesign only the Travel photo collection page.

Goal:
Turn Travel into a visual family travel journal rather than simply another photo gallery.

This page should feel distinct from Arjun while remaining part of the same design system.

The experience should combine:
- destination photography
- place
- date
- family story
- albums

HEADER

Use a small bronze eyebrow:
"STORIES FROM EVERYWHERE"

Large serif title:
"Travel"

Supporting copy:
"Roads taken, cities explored, memories carried home."

Show total trips/photos quietly.

Do not use a generic dashboard header.

FEATURED JOURNEY

At the top, show the most recent or featured trip as a large cinematic story card.

Use a wide destination photograph.

Overlay or place beside it:
Destination
Country
Dates
Number of photos

Example:

ITALY
Summer 2026

Rome • Florence • Amalfi

124 photos

Add a subtle action:
"View journey →"

The image should dominate.

TRAVEL JOURNAL

Below the featured trip, show previous journeys in an editorial layout.

Do not use identical cards.

Mix:
- large landscape cards
- medium portrait cards
- occasional full-width destination sections

Each trip should show:
- destination
- date/year
- number of photos
- optional one-line memory

Example:

Santorini
Greece • May 2025

"Blue roofs, warm evenings, and nowhere to rush."

DESTINATION DETAIL

Clicking a trip should lead into its photos without breaking the visual style.

Inside a destination:
- destination hero photo
- trip title
- location
- dates
- optional short story
- photo gallery underneath

Consider adding a subtle location/map indicator, but do NOT let maps dominate the experience.

Visual direction:
- cinematic
- editorial
- slightly more adventurous than Arjun
- photography-led
- restrained bronze accents
- no travel-app UI
- no booking-site styling

Avoid:
- itinerary widgets
- huge map panels
- badges everywhere
- tourism-site layouts
- equal-size grids

The page should feel like opening a beautifully designed family travel journal.
```

### Milestones

```text
Redesign only the Milestones page.

Goal:
Create a sophisticated visual timeline of the moments that changed our family's story.

This page should feel more ceremonial and emotionally significant than a normal photo gallery.

HEADER

Small bronze eyebrow:
"ANCHOR MEMORIES"

Large serif title:
"Milestones"

Supporting copy:
"The days that changed everything. Held forever."

TIMELINE EXPERIENCE

Do not present milestones as a standard card grid.

Instead, create an editorial chronological timeline.

Each milestone should have:
- date or year
- milestone title
- hero photograph
- optional short description
- optional supporting photos

Examples:

December 25, 2025
Arjun Arrives

"The day our world became bigger."

[large image]


2024
Our Wedding

[image pair]


2023
A New Chapter

[large landscape image]

Alternate the composition as users scroll:
- text left / photo right
- photo left / text right
- occasional full-width image

Use a subtle timeline indicator along the side or center, but keep it extremely restrained.

Do not use a corporate vertical stepper.

Typography and photography should provide the hierarchy.

For milestones with many photos:
- show 1 hero photo
- 2–3 supporting photos
- CTA:
  "View the full story"

On mobile:
- convert naturally into one vertical narrative
- keep date → title → photo → story hierarchy

Interactions:
- subtle image reveal while scrolling
- minimal timeline progress
- gentle transitions only

Avoid:
- badges
- progress bars
- achievement UI
- repetitive cards
- rigid timelines
- excessive icons

This page should feel like the defining chapters of a family memoir.
```

### Life

```text
Redesign only the Life collection.

Goal:
Celebrate ordinary family life and candid moments without making the page feel like an unorganized miscellaneous album.

The emotional idea:
"The little things were the big things."

HEADER

Small eyebrow:
"PEOPLE & MOMENTS"

Large serif heading:
"Life"

Supporting copy:
"Friends, family, ordinary days. Everything that makes us, us."

FEATURED STORY

Begin with one large candid photograph.

Pair it with a short editorial statement:

"The little things were the big things."

Optional supporting copy:
"Sunday mornings. Dinner tables. Small laughs. The moments we never planned to photograph."

EVERYDAY GALLERY

Build a relaxed masonry-style gallery.

Compared with Arjun:
- make this gallery feel less chronological
- more spontaneous
- more candid
- varied image sizes
- natural image aspect ratios

Occasionally interrupt the photo gallery with simple editorial text.

Example:

"Home looked like this."

Then continue the photography.

Or:

"Summer evenings, 2026"

These small storytelling moments will make the gallery feel curated rather than randomly uploaded.

Optional lightweight filters:
- Family
- Friends
- Home
- Celebrations
- Everyday

Keep filters extremely subtle.

Do not make them look like app tabs unless necessary.

Avoid:
- generic social-media feed UI
- Instagram-like layouts
- profile cards
- visible engagement metrics
- excessive chronological labeling

The page should feel warm, candid, imperfect, and beautifully human.
```

---

## PR 7 — Videos Page

```text
Redesign only the Videos page.

Goal:
Make family videos feel like a private cinematic film library rather than thumbnail storage.

Header:
- eyebrow:
  "STORIES IN MOTION"
- large serif heading:
  "Family Films"
- short supporting copy:
  "The moments that deserved more than a single frame."

Main content:
Show videos as large cinematic tiles.

Do not create a dense YouTube-style thumbnail grid.

Use a mix of:
- one large featured film
- medium-sized supporting films
- optional grouping by year or chapter

Each video tile should include:
- thumbnail
- subtle play control centered over image
- video title
- optional date
- duration
- optional chapter such as Arjun / Travel / Life

Use very subtle dark overlays.

Featured video:
- noticeably larger than the others
- display title and short description
- play button should be elegant and understated
- use a large centered circular play icon with a very subtle translucent surface
- avoid bright controls or YouTube-style UI

Suggested structure:

Featured Film
[large cinematic video thumbnail]

Title
Short description
Date • Duration

Then:

"More Family Films"

Use a looser editorial layout rather than a strict equal-card grid.

Group videos naturally where useful:
- Arjun
- Travel
- Celebrations
- Everyday Life

Or organize chronologically:
- 2026
- 2025
- 2024

On hover:
- subtly brighten the thumbnail
- scale the image by approximately 1–2%
- reveal the play icon slightly more strongly
- keep movement restrained

VIDEO PLAYER

When a video is opened:
- use a near-black immersive viewer
- center the video
- minimize surrounding controls
- show title/date beneath the video rather than covering the content
- provide previous/next navigation where applicable
- allow favorite/save if supported
- maintain the same visual language as the photo lightbox

Mobile:
- featured video becomes edge-to-edge within comfortable page margins
- remaining videos stack vertically
- preserve large thumbnails
- do not shrink everything into tiny cards

Avoid:
- YouTube-style dense grids
- multiple bright play icons everywhere
- excessive metadata
- large borders
- dashboard sections
- autoplay
- distracting animation

The final page should feel like a private collection of beautifully preserved family films.
```

---

## PR 8 — Favorites Page

```text
Redesign only the Favorites page.

The current empty state feels too large, flat, and unfinished.

Goal:
Make Favorites feel like a treasured personal collection, whether it contains zero photos or hundreds.

Keep the page name:
"The Ones We Love"

Header:
- small heart icon
- large serif heading:
  "The Ones We Love"
- below it show:
  "[X] saved photos"
- add one short emotional line such as:
  "A place for the moments that matter most."

EMPTY STATE

If there are no saved photos:
Do not show one giant empty rectangular panel.

Instead, create a centered editorial empty state with:
- refined heart icon
- title:
  "Your favorites will live here"
- body:
  "Tap the heart on any photo to save it. The moments you love most deserve a special place."
- subtle CTA:
  "Start saving moments"

Below the empty state, add a secondary discovery section:
"Recently captured"

Show 4–6 recent photos in a compact premium row so the page still feels alive.

Optionally include a subtle line:
"Keep saving the little moments. They become everything."

WITH FAVORITES

When favorites exist:
- replace the empty state with a curated editorial/masonry gallery
- use varied photo sizes
- avoid a uniform grid
- prioritize large imagery
- show a small filled heart on hover
- include a Select action for bulk management, but keep it quiet

Do not make the page feel like a photo-management utility.

Visual direction:
- near-black background
- cream serif typography
- subtle bronze heart accent
- generous whitespace
- minimal chrome
- almost no visible borders

The page should feel emotional, calm, personal, and luxurious.
```

---

## PR 9 — Memories / On This Day Page

```text
Redesign only the Memories page.

Transform it from a basic empty-state page into a premium "On this day" time-capsule experience.

Page heading:
- small eyebrow:
  "MEMORIES"
- large serif title:
  "Moments That Stay"
- supporting copy:
  "Photos from this day in past years."

The page should feel nostalgic and designed for rediscovery.

TODAY'S MEMORIES

If memories exist for today's date:
- group them by year
- show the year prominently but elegantly
- use large editorial photo cards
- optionally include location/date metadata in very small type
- use a vertical narrative flow instead of a generic grid

Example:

2025
[large photo]
[2 smaller photos]

2024
[photo pair]

The page should feel like moving backward through time.

EMPTY STATE

If there are no throwbacks today:
Do not leave the majority of the page empty.

Create an elegant empty-state section:
- refined time/spark icon
- heading:
  "No throwbacks today"
- supporting copy:
  "As your library grows, memories from this day in past years will surface here."

Then continue the page with useful secondary sections.

Add:
1. "This month in past years"
   - show memories from the same month across previous years

2. "Recently revisited"
   - photos the user recently opened or favorited

Optional:
3. "Our timeline"
   - a subtle horizontal or vertical timeline with years and major family chapters

Use photo-first presentation with generous whitespace.

Avoid:
- a giant empty box
- dashboard widgets
- gamification
- clutter
- excessive badges

The final experience should feel like opening a thoughtful personal time capsule.
```

---

## PR 10 — Mobile Experience Polish

```text
Redesign the mobile experience across the app without changing the desktop visual direction.

Do not simply shrink the desktop layouts.

Goal:
Make Our Frame feel intentionally designed for the phone, especially for casually revisiting family memories.

HOME

Use the hero photo across most of the initial screen.

Navigation should be minimal.

Hero copy:
"Every frame holds a story."

Keep text shorter on mobile.

CTA:
"Explore Our Story"

Below the hero create four compact chapter destinations:
Arjun
Travel
Milestones
Life

Consider a horizontal chapter rail if appropriate, but do not make it feel like generic mobile cards.

PHOTOS

Stack chapter cards vertically.

Use large edge-to-edge imagery within approximately 16–20px page margins.

ARJUN / GALLERY

Prefer:
- 2-column gallery for smaller images
- occasional full-width hero image
- masonry rhythm

Do not force every image into a square.

PHOTO VIEWER

Allow full-screen swipe navigation.

Tap once:
show controls.

Tap again:
hide controls.

Swipe up or use Info:
show date/location/caption.

FAVORITES

Empty state should fit naturally without giant unused areas.

Show Recently Captured directly beneath it.

MEMORIES

Build a vertical chronological experience particularly optimized for mobile scrolling.

NAVIGATION

Use either:
A. refined hamburger/full-screen menu
or
B. a very minimal bottom navigation if the architecture strongly benefits from it.

Prefer option A unless bottom navigation substantially improves usability.

Do not use both.

TOUCH INTERACTION

Minimum target size should remain accessible without making icons visually large.

Use:
- swipe
- tap
- subtle haptic-friendly interactions where the platform supports them

Avoid:
- tiny controls
- horizontal overflow
- desktop navigation squeezed onto mobile
- excessive bottom sheets
- mobile dashboard patterns

Mobile should feel like opening a beautiful personal photo journal in your hand.
```
