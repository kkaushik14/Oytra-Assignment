# QA test matrix

Target: https://demo.realworld.show (live Angular demo; page states session-isolated backend).
Status: investigation in progress. This is a working record, not the final QA report.

| Area | Checks | Status |
|---|---|---|
| Availability | Home, seeded feed, tags, registration, login | Home/feed/tags/registration/login observed |
| Authentication | Valid registration/login; invalid email; duplicates; required fields; logout; refresh | Account A creation, correct login, incorrect-password rejection, logout and refresh passed. Duplicate registration interacts with session isolation; not classified as a bug. |
| Article lifecycle | Create/read/edit/delete controlled article; required fields; long text; persistence | Create, edit, refresh persistence, Unicode and Markdown passed. Empty title/description/body produce explicit errors. Delete pending. |
| Authorization | Logged-out protected routes; second controlled account ownership | Direct /settings and /editor both redirect logged-out visitor to /login; ownership tests pending |
| UX/accessibility | Labels, keyboard, navigation, loading/errors, mobile layout | Pending |
| API/network | Request failures, validation status, response data, console errors | Pending |

Candidate findings are recorded separately; none finalized without user review.
