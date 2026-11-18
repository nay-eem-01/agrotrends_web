# Backend requests from the product audit (2026-11-03)

Written 2026-11-03 for the backend agent. The product and UX audit
(https://claude.ai/artifact/MPuLZ9XMhPQop8JEqwzCQz) found gaps that the web can't close alone. This list is only
those: each item was checked against the backend code on `feat/answer-reply-notification` (`edc14e0`), and anything
the backend already does is listed under "Already there" at the end rather than requested.

Same rules as before: the usual `{ status, message, payload, success }` envelope; lists are Spring `Page`s; the caller
comes from the token, never from the URL or body; new fields are additive, so older web builds keep working. The web
ships each item behind the field or endpoint and hides it until it answers.

Ordered **small to large**, which is also the order the web will build them in. "Audit §" points to the doc's section.

| # | Request | Size | Priority | Audit § |
|---|---|---|---|---|
| B1 | Reply counts on answers and comments | S | P2 | 6 (question page), 10 |
| B2 | Today's AI allowance | S | P3 | 6 (AI advisor) |
| B3 | Relax the password rule | S | P3 | 6 (sign-up) |
| B4 | Questions in the topics I follow | S | P2 | 6 (home feed) |
| B5 | E-mail preferences and the user's language | S | P1 (needed by B8, B10) | 7, 8 |
| B6 | Launch-test metrics for admin | M | P1 | 5 (finding 3) |
| B7 | Link previews for shared questions and stories | M | **P0** | 5 (finding 1), 10 |
| B8 | E-mail the asker when their question gets an answer | M | P1 | 7 (step 7), 8 |
| B9 | "Cited in N answers" and an answerer's impact | M | P2 | 6 (stories), 7, 8 |
| B10 | Weekly digest for answerers and experts | M | P2 | 6 (review queue), 7, 8 |
| B11 | Follow a question | M | P2 (Later) | 8 |
| B12 | Refresh token in an HttpOnly cookie | M | P1 (before launch) | 10 |

---

## B1. Reply counts (S, P2)

Today every answer shows "Show replies" and the reader taps into "No replies yet" (the open item in the web
DEV_LOG).

- `AnswerResponse.replyCount` (long): replies filed under that top-level answer (threads are two levels, so this is
  every reply in its thread). Present on `GET /api/answers/question/{questionId}` and on the create/reply responses.
- `CommentResponse.replyCount`: the same for top-level story comments.
- Count in the list query (a grouped count or a subquery), not one query per answer.
- Deleted or moderation-hidden replies don't count, since the reader can't see them.

**Web:** hides "Show replies" at 0 and shows "3 replies" otherwise.

## B2. Today's AI allowance (S, P3)

The advisor says there's a daily limit but can't show how much is left. `AiService.assertDailyLimitNotReached`
already counts it.

- `GET /api/ai/allowance` (signed in) → `{ "limit": 10, "usedToday": 3, "resetsAt": "2026-11-04T00:00:00+06:00" }`.
- "Today" must be the same day the limit check uses. That check uses `LocalDate.now()` (the server's zone), so set
  the zone explicitly to `Asia/Dhaka` in both places, or users abroad and a UTC server will disagree on midnight.

**Web:** "7 of 10 left today" under the advisor input; refetched after each ask.

## B3. Relax the password rule (S, P3)

`CommonUtils.getInvalidPasswordMessage` requires 8–16 characters with a digit and a special character. The 16 cap is
unusual, and the composition rule is hard on phone keyboards (NIST SP 800-63B advises length over composition).

- Proposed: **8 to 64 characters**, no spaces at either end, no composition rule. (bcrypt reads only the first 72
  bytes, and 64 Bengali characters can exceed that, so either cap at 72 *bytes* or pre-hash. Your call.)
- Existing passwords keep working; this changes validation only.
- Same rule for sign-up, change password and both reset paths.
- **Needs Nayeem's OK**: it's a security-policy change. If it's rejected, keep the rule as is, and the web keeps its
  current hint.

**Web:** the sign-up hint becomes "At least 8 characters", with a strength meter that doesn't block.

## B4. Questions in the topics I follow (S, P2)

The home tab is called "For you" but shows all questions. `GET /api/questions/all` filters by one `tag` or
`categoryId` only.

- `GET /api/questions/all?following=true` (signed in): questions carrying any tag the caller follows (`/api/me/following/tags`).
  It combines with the existing `unanswered`, sort and paging. A signed-out caller with `following=true` gets 401.
- If the caller follows no tags, return an empty page. The web then shows "Follow topics to fill this tab" with a
  button.

**Web:** "For you" uses this. Until it exists the tab is renamed "All".

## B5. E-mail preferences and the user's language (S, P1)

B8 and B10 send e-mail, so users need a way to turn it off, and each mail has to be in the user's language. Users
have no stored language today. (`lang` is a request parameter only.)

- `User.preferredLang` (`en` | `bn`, default `bn`): set from the `lang` of sign-up, and changeable.
- `GET /api/user/settings` and `PUT /api/user/settings` (signed in), with partial updates:
  ```json
  { "preferredLang": "bn", "emailOnAnswer": true, "emailWeeklyDigest": true }
  ```
- Both e-mail flags default to true, but mail goes only to a **confirmed** e-mail address. Phone-only accounts get
  nothing until there's SMS or push (that cost decision is still open).
- Every mail from B8 and B10 carries a one-click unsubscribe link,
  `GET /api/user/unsubscribe?token=…&kind=answer|digest`. The token is signed, carries no password and doesn't expire.
  Send the `List-Unsubscribe` header too, because Gmail requires it for bulk senders.

**Web:** the language switch saves `preferredLang` when signed in, Settings gets two switches, and a small
`/unsubscribed` page confirms.

## B6. Launch-test metrics (M, P1)

PLAN.md's week-8 go / stop rests on numbers no screen shows. `AdminStatsResponse` gives totals only. No third-party
tracker is needed: everything comes from existing tables.

`GET /api/admin/launch-metrics?weeks=8` (admin and staff only) returns one row per week, newest first. Weeks are
Monday to Sunday in `Asia/Dhaka`.

```json
[{
  "weekStart": "2026-11-02",
  "activeAskers": 18, "activeAnswerers": 9, "activeMembers": 24,
  "questions": 31, "humanAnsweredWithin24h": 22,
  "aiAnswers": 29, "aiReviewedWithin48h": 17,
  "verifiedExperts": 6, "newMembers": 40
}]
```

The definitions matter, because these decide the go / stop:

- `activeAskers`: distinct users who posted a question that week. `activeAnswerers`: distinct users who posted an
  answer or reply. `activeMembers`: distinct users in either group (PLAN's "weekly active askers or answerers",
  target 30).
- `questions`: questions created that week, excluding deleted ones and those removed by moderation.
  `humanAnsweredWithin24h`: of those, how many got an answer from someone other than the asker within 24 hours. AI
  answers don't count (target 80%). The web works out the ratio.
- `aiAnswers`: AI answers created for public questions that week. `aiReviewedWithin48h`: of those, how many an expert
  confirmed or corrected within 48 hours of creation (target 70%). Private advisor answers are left out.
- `verifiedExperts`: the count at the end of the week (target 10). `newMembers`: sign-ups that week.
- Count staff and admin accounts with everyone else, but return `staffActivity` (the same row restricted to staff) so
  the team can see how much of the activity is their own.
- The current week is partial. Include it and mark it `"partial": true`.

**Web:** a "Launch test" panel at the top of the admin overview with the three ratios against the plan's targets,
eight weeks as a small table. Paying students stay in the spreadsheet.

## B7. Link previews for shared questions and stories (M, P0)

The launch channel is Facebook groups. Facebook's crawler doesn't run JavaScript, so every shared link shows the
static "AgroTrends" card from `index.html`. Fixing it on the backend works whichever host serves the web, and the
hosting choice is still open.

- `GET /share/questions/{id}` and `GET /share/stories/{slug}` are public, outside `/api`, and return `text/html`: a
  tiny page with
  - `og:type` (`article`), `og:title` (the question or story title), and `og:description`: the first ~200 characters
    of plain text. For a question with an expert-confirmed AI answer or an accepted answer, start it with
    "Answered by a verified expert · " in the content's language; otherwise use the question's text. Strip the HTML
    with Jsoup and never echo raw HTML.
  - `og:image`: the question's first photo or the story's cover, otherwise a default site image
    (`/og-default.png`, which the web will supply). `og:image:width` and `og:image:height` too when known.
  - `og:site_name` "AgroTrends", `og:locale` (`bn_BD` or `en_US`), `twitter:card` `summary_large_image`.
  - **`og:url` set to the `/share/...` URL itself**, not the app URL. Facebook re-scrapes whatever `og:url` names, and
    the app URL would give it the generic card again.
  - For people: `<link rel="canonical">` to the app URL (`{frontendUrl}/questions/5`), a
    `<meta http-equiv="refresh" content="0;url=…">` and a plain link as fallback.
- Escape every value for HTML attributes. Titles come from users.
- Private, hidden, removed or draft content returns 404 with a generic card ("AgroTrends") and no title, so nothing
  leaks.
- `Cache-Control: public, max-age=600`. Facebook caches its own copy anyway, so an edit shows up only after a
  re-scrape.
- The web host proxies `/share/*` to the backend, the same way it proxies `/api` and `/uploads`. Please add that rule
  to the Caddy config in `deploy/` if the web will be served there, and say which host in DEPLOY.md.
- Test: escaping (a title with `"><script>`), the 404 for a private item, and the image fallback order.

**Web:** the new Share button (Web Share API, with copy link as the fallback) shares the `/share/...` URL. Vite's dev
proxy gets the `/share` rule. A designed `og:image` card per question (the Hallmark proposal) would come later as
`GET /share/questions/{id}/image.png`, which isn't requested yet.

## B8. E-mail the asker when their question gets an answer (M, P1)

The audit's biggest journey gap: the answer arrives after the asker has left, and the bell is in-app only.
`SpringEventNotificationPublisher` stores rows, and `MailService` is used only for confirmation and password reset.

- When an `ANSWER_ON_YOUR_QUESTION` notification is created, and the asker has a confirmed e-mail and
  `emailOnAnswer` (B5), send one e-mail in their `preferredLang`. The subject is the question title; the body has the
  answerer's name, the first ~300 characters of the answer as plain text, a button to `{frontendUrl}/questions/{id}`,
  and the unsubscribe link.
- Batch: at most one mail per question per hour. Answers that arrive in the meantime fold into the next mail ("2 new
  answers"). A queued or outbox row keeps a burst of answers from becoming a burst of mails.
- Also send on `AI_ANSWER_REVIEWED`, when an expert confirms or corrects the AI answer, under the same rules and with
  the same cap. Askers care about that check most.
- Send after the transaction commits (`@TransactionalEventListener(AFTER_COMMIT)`) and asynchronously. A mail failure
  is logged and never fails the answer.
- Brevo's free tier is 300 mails a day (backend DEV_LOG). Log a warning at 250.
- Add both kinds to `LoggingMailService`, so dev and tests see them in the log.

**Web:** no change is needed to receive it, except the Settings switch from B5. The ask page's success state says
"We'll e-mail you when someone answers" when the asker has a confirmed e-mail.

## B9. "Cited in N answers" and an answerer's impact (M, P2)

Writers can't see what their work did. AI answers already store `sources` as JSON on `ai_answer`, each with
`type` "blog" (with `blogId`) or "answer" (with `questionId`).

- `BlogResponse.citedCount` and `BlogSummaryResponse.citedCount`: the number of AI answers whose sources include that
  blog, counted from public questions only.
- `GET /api/users/{userId}/impact` (public):
  ```json
  { "answers": 42, "acceptedAnswers": 12, "readersReached": 3400, "citedInAiAnswers": 7, "storyCitations": 19 }
  ```
  - `readersReached` is the sum of views on the questions they answered.
  - `citedInAiAnswers` counts AI answers that cite a question this user answered with a vetted answer.
  - `storyCitations` is the sum of `citedCount` over their stories.
- Use a JSONB containment query (`sources @> '[{"blogId": 3}]'`), with a GIN index on `sources` if it isn't there.
  Cache per user for an hour; it doesn't need to be live.

**Web:** "Cited in 12 AI answers" on the story page and in story cards, and an "Impact" line on profiles.

## B10. Weekly digest for answerers and experts (M, P2)

The 24-hour and 48-hour targets depend on answerers and experts coming back on a schedule, but nothing brings them
back. The audit suggests sending it by hand for 3 weeks first; building it is the second half of that.

- Scheduled for Monday at 08:00 `Asia/Dhaka` (`@EnableScheduling` isn't on yet). One mail per user who has
  `emailWeeklyDigest` (B5), a confirmed e-mail, and something to show:
  - up to 5 unanswered questions from the past 7 days in tags they follow, newest first;
  - for Verified Experts, the number of AI answers waiting in their review queue, and the oldest one's age.
- Skip users with nothing to show. Never send an empty digest.
- Same unsubscribe link and language rules as B8. Write a `digest_sent` row per user and week, so a restart doesn't
  send twice.
- `POST /api/admin/digest/preview` (admin) returns the caller's own digest as HTML without sending it, so the team
  can check the copy.

**Web:** only the B5 switch, plus an admin "Preview digest" button.

## B11. Follow a question (M, P2, Later)

Many people share one problem, but today only the asker hears about answers. The audit places this after week 8, so
it's listed for completeness. It can wait.

- `PUT /api/questions/id/{id}/follow` and `DELETE /api/questions/id/{id}/follow` (signed in). `QuestionResponse`
  gains `following` (for the caller) and `followerCount`.
- The asker follows their own question automatically and can't unfollow it.
- A new answer creates `ANSWER_ON_FOLLOWED_QUESTION` for each follower except the asker (who already gets
  `ANSWER_ON_YOUR_QUESTION`) and the answerer. Following never sends e-mail unless a later decision says so.

**Web:** "Notify me" beside Share on the question page, and the new notification type.

## B12. Refresh token in an HttpOnly cookie (M, P1 before launch)

The refresh token sits in `localStorage` (an open item on both sides). Any XSS would expose it.

- Sign-in (every method), refresh and confirm-and-sign-in set
  `Set-Cookie: agrotrends_refresh=…; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=<refresh TTL>`.
- `POST /api/auth/refresh-token` reads the cookie when there's no body token, so both work during the switch. Sign-out
  clears the cookie and revokes the token.
- For one release, keep returning `refreshToken` in the body, so the deployed web keeps working. Then drop it.
- The web calls with `credentials: 'include'` on `/api/auth/*`. It's same-origin through the proxy, so no CORS
  change is needed in production. In dev, Vite proxies it as well.

**Web:** stops storing the refresh token and moves the existing session to the cookie on the first refresh.

---

## Already there: no backend work

Checked in the code, so the web will just use these:

- **Questions take photos** (`imageUrls`, at most `MAX_PHOTOS_PER_QUESTION`). The web only needs a labelled
  "Add photos" button.
- **Location and season on questions** (`agri.region`, `season`, `crop`, `soil`), plus a list filter. The web will
  add an optional "Where are you?" field, prefilled from the profile's `location`.
- **Private advisor answer to a public question**: `POST /api/ai/history/{aiAnswerId}/ask-experts`, which the web
  already uses. The audit's "one Ask with a public / private choice" is web-only.
- **Honest hero numbers**: `GET /api/stats/public` has `verifiedExperts` and `answeredQuestions`.
- **The empty-database first start** was fixed in backend 4.24. The audit listed it from an older review.

## Not code: decisions and operations

- **Gemini.** The backend DEV_LOG says `gemini-3.5-flash` works since 2026-10-30. The audit's "key rejected since
  2026-10-06" came from older notes, so the open work is re-running the live checks listed there (3.6–3.8, 7.3a, 7.6b,
  7.7).
- **SMS** is on hold by decision (2026-10-30). Until it's resumed, phone-only sign-ups can't confirm, and B8 and B10
  can't reach those accounts.
- **Hosting for the web** decides where the `/share/*` proxy rule from B7 lives.
- **Seed content**: 30 to 50 real questions with expert answers before launch. This is content work, not code.
