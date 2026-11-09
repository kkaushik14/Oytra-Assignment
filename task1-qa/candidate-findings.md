# Candidate findings — not yet finalized

## C01: Feed favorite buttons do not announce their action

Status: observed in the live page DOM and accessibility tree; candidate pending reproduction and review.
Proposed severity: Medium (accessibility).

Steps: open the Global Feed while logged out; inspect or navigate the favorite buttons using assistive technology. Compare their names with the explicit “Favorite Article” buttons on an article detail page.

Expected: each button has an accessible name describing the action, such as “Favorite Introduction to Machine Learning for Developers, 1 favorite.”
Actual: the four feed buttons expose only an icon-font character and the counts 1, 1, 2, 2. Their DOM has no aria-label, aria-labelledby or title. The action and article context are absent from the name.

Impact: a person using a screen reader cannot identify the favorite action from the button name. Visual appearance alone does not establish an accessible action name.

Evidence: evidence/home-accessibility.txt and evidence/home-desktop.jpg. Attribute inspection returned null for all three naming attributes on each favorite button.

Suspected cause: icon plus numeric count rendered without an explicit accessible action label. Source-level confirmation pending. No claim of a screen-reader session having been executed.

## C02: Feed descriptions have insufficient text contrast

Status: measured from live computed styles; candidate pending final review.
Proposed severity: Medium (accessibility).

Steps: load the Global Feed; inspect the description below the first article title. The 16px, weight-300 text uses rgb(153,153,153) on a white body background; every intermediate ancestor has a transparent background and opacity 1.

Expected: normal-size text meets a 4.5:1 minimum contrast ratio under WCAG 2.2 SC 1.4.3.
Actual: #999999 on #ffffff computes to 2.849:1, below that threshold.

Impact: article summaries are difficult to read for users with reduced contrast sensitivity. Treat other occurrences of the same weak text-color styling as part of this finding, not separate bugs.

Evidence: evidence/contrast-observation.json and evidence/home-desktop.jpg. Formula: convert sRGB channels to linear luminance; calculate (lighter luminance + 0.05)/(darker luminance + 0.05).

Reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

## Observations excluded from defects

- Old demo.realworld.io URL returns HTTP 404/NoSuchBucket: outdated assignment reference, not a defect in the selected application.
- Empty auth forms disable submission and malformed email produces “email is invalid”: passing checks.
- /settings and /editor redirect logged-out visitors to /login: passing checks.
- Tag “ai” returns one matching seeded article: passing check.
- Mobile screenshot showed a black/clipped region, but page measurements showed no horizontal document overflow. Treat as inconclusive capture/tool behavior; do not report as an app defect.
