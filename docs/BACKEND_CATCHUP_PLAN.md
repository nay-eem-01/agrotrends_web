# AgroTrends Web — Frontend Build Plan

Backend snapshot: 2026-10-14 · Live doc: https://claude.ai/code/artifact/52133120-e49b-4f95-b9b8-6030c8fc9545

## Purpose

The web app was built against the backend as it stood on 2026-10-09 (Medium-style reading and writing). Since then the backend became a **Q&A-first community** with one account type, e-mail confirmation, votes and reputation, verified experts who review AI answers, notifications and moderation. This plan brings `agrotrends-web` up to that backend in eight phases (F7–F14), one small PR per step.

Rules for the agent:

- The backend's OpenAPI document (`/v3/api-docs`, run `npm run gen:api`) is the source of truth for shapes. Where this doc and OpenAPI disagree, OpenAPI wins and the agent notes it in its dev log.
- Keep the repo's own conventions: `CLAUDE.md`, `docs/DESIGN.md`, the stacked-PR `git-workflow` (phase base off `development`, step branches stacked, PRs at most 20 files, no attribution lines).
- Add these phases to `docs/ROADMAP.md` before starting, and tick each step in the same PR.
- Never call Gemini or any AI from the browser. Never send `userId` in a body: the backend reads identity from the token.
- Backend paths below are exact; several are irregular (`/api/answers/update/` has a trailing slash, deletes differ per resource). Copy them, don't tidy them.

## Backend state

Phases 5, 6 and 7 are on the backend's `development`. Phase 8 (notifications and moderation) is finished on `feat/notifications-moderation-base` but not merged yet. Until it is, run the backend from that branch to build F12–F14.

| Item | Value |
| --- | --- |
| Local API | `http://localhost:8080`, the existing Vite dev proxy |
| Swagger | `/swagger-ui.html`; types from `/v3/api-docs` |
| Envelope | `{status, success, message, payload}`, as `src/api/client.ts` already reads it |
| Paging | `pageNo` (0-based) and `pageSize`; Spring `Page` in `payload` (`content`, `totalElements`, `last`) |
| Access token | 15 minutes, `Authorization: Bearer` |
| Refresh | `POST /api/auth/refresh-token {refreshToken}`, single use, store the new one each time |
| Dates | ISO-8601 UTC `Instant`s on every new response |
| Errors | No machine codes: branch on HTTP status, show `message` |

The Gemini chat key is still invalid on the backend. AI answers are never generated locally, so AI screens are built against seeded rows and the 404 "no AI answer yet" state.

## Breaking changes since F6

Twelve backend changes break or change screens that already exist. F7 fixes all of them before any new feature.

| Backend change | What breaks in the web app | Fix in |
| --- | --- | --- |
| One account type: sign-up and Google ignore `userType` and `professionalInfoRequest`; `UserResponse.userTypes` removed | The reader/author choice on sign-up; anything that reads `userTypes` | F7.1 |
| Writes need a confirmed e-mail: 403 "Confirm your e-mail address first…" | Every write fails for new accounts with no explanation | F7.2 |
| `UserResponse` gains `emailVerified`, `hasPassword`; `authorId` is null until first needed | Profile and settings checks | F7.1 |
| Blog lists return `excerpt`, no `content` | Story cards; the editor if it opens a draft from a list item | F7.3 |
| Questions require `categoryId` (topic); accept `tags` (max 5) and `imageUrls` (max 4, from `POST /api/images`) | Ask form submits fail with 400 | F8.1 |
| `GET /api/answers/question/{id}` returns direct answers only; replies come from `GET /api/answers/replies/{answerId}` | The client-side reply filter becomes dead code; replies must be fetched per answer | F8.3 |
| `POST /api/questions/id/{id}/ai-draft` removed | F4.4 AI draft button 404s | F10.1 |
| AI `sources[]` items are `{type, blogId, questionId, title}`; `type` is `blog` or `answer` | Advisor and history links for answer sources point nowhere | F10.3 |
| Drafts are visible to their author only, admins included | Staff views of others' drafts | F7.3 |
| Blog `status` can be `HIDDEN`; editing or republishing it is 409 | My stories and the editor | F13.3 |
| Comments on a draft or hidden blog, and replies under hidden parents, are 404 | Comment threads on a story that disappears | F13.3 |
| A banned account's token acts like no token: public reads work, everything else is 401; the next refresh or sign-in is 403 with the ban message | The refresh loop must not retry forever; the ban message must show | F7.2 |

## Accounts and sign-in

Everyone has the same account: anyone with a confirmed e-mail may ask, answer, vote, publish and use the AI.

- **Sign-up** `POST /api/auth/sign-up {name, email, countryCode, mobileNumber, password}` returns a `UserResponse`, not tokens. Show "check your inbox", then sign in. Remove the reader/author choice and the professional-info fields.
- **Confirm** `/verify-email?token=` page (the link the backend mails) calls `POST /api/auth/verify-email {token}`. On success, refetch `/api/user/me`. On 400, show "This link is invalid or has expired" with a resend button.
- **Resend** `POST /api/auth/resend-verification {email}` always answers 200; say "if the address is registered, a new link is on its way". It is rate-limited to 3 per hour per address.
- **Banner** when `me.emailVerified` is false: a sticky strip under the top bar with the resend button. Write buttons stay visible but open a dialog explaining the confirm step instead of sending.
- **Google** `POST /api/auth/google {idToken}` counts as confirmed. Sign-up body fields are ignored there too.
- **Profile** details (designation, specialities, bio, photo) move to `PUT /api/authors/me`, offered after first sign-in as an optional step, never a gate.
- **Ban**: sign-in, Google, refresh and sign-up can answer 403 "This account has been suspended by the moderators." Show it on the sign-in page. In the client, a 403 from `/api/auth/refresh-token` ends the session (clear tokens, go to sign-in with the message); it must not loop. A 401 on a write while signed in also ends the session after one failed refresh.
- **Must change password** (`me.mustChangePassword`) is unchanged; only `/api/user/change-password` works until done.

## Questions, answers and reputation

Questions are now the home of the product: the default landing tab is the question feed, and stories are the second tab.

**Questions**

| Action | Endpoint | Notes |
| --- | --- | --- |
| List | `GET /api/questions/all` | Filters `categoryId`, `tag`, `unanswered=true`, `crop`, `season`, `region`, `soil`; combinable |
| Search | `GET /api/questions/search?q=` | Quoted phrases and `-exclusions`; blank `q` is 400 |
| One | `GET /api/questions/id/{id}` | 404 when hidden |
| A user's questions | `GET /api/questions/all/user/{userId}` | For the profile page |
| Ask | `POST /api/questions/create` | `{title, content, categoryId, tags?, imageUrls?, agri?}`; `categoryId` required |
| Edit | `PUT /api/questions/update` | `{questionId, ...}`; omitted `tags` / `imageUrls` keep the old ones |
| Delete | `DELETE /api/questions/id/{id}/delete` | Owner or admin |

`QuestionResponse` now carries `category`, `tags`, `imageUrls`, `answerCount` (direct answers only), `score`, `acceptedAnswerId`, `authorReputation` and `authorBadges`.

**Answers**

| Action | Endpoint | Notes |
| --- | --- | --- |
| Answers | `GET /api/answers/question/{questionId}` | Direct answers only: accepted first, then score, then oldest |
| Replies | `GET /api/answers/replies/{answerId}` | Fetched when a thread is opened |
| Answer | `POST /api/answers/create` | `{questionId, content}` |
| Reply | `POST /api/answers/reply` | `{questionId, parentAnswerId, content}` |
| Edit | `PUT /api/answers/update/` | Trailing slash; `{answerId, content}` |
| Delete | `DELETE /api/answers/delete/id/{id}` | Owner or admin |
| Accept | `PUT /api/answers/id/{id}/accept` | Asker only (403 otherwise), replies 400; `DELETE` takes it back |

`AnswerResponse` carries `score`, `accepted`, `authorReputation`, `authorBadges`.

**Votes**

- `PUT /api/questions/id/{id}/vote?direction=UP|DOWN` and `PUT /api/answers/id/{id}/vote?direction=...` cast or change; `DELETE` on the same path withdraws. Both return `{score, myVote}`.
- `GET /api/questions/id/{id}/my-votes` returns `{question, answers: {answerId: direction}}` in one call; load it on the question page when signed in.
- Voting on your own post is 403: hide the arrows on your own posts. Downvoting needs 50 points (403 "You need 50 reputation points to downvote."): keep the arrow and show the message as a tooltip on refusal.

**Reputation and badges**

- `GET /api/users/{userId}/reputation` returns `{total, topics: [{categoryId, categoryName, points, acceptedAnswers, badges, expertField}]}`, highest topic first.
- `authorBadges` on a question or answer holds the author's badges in that question's topic: `VERIFIED_EXPERT` (show with `expertField` where known, e.g. "Veterinarian") and `TOP_CONTRIBUTOR`. Show them next to the author name, with the reputation total.
- Points (for help text): question upvoted +5, answer upvoted +10, downvoted −2, answer accepted +15 to the answerer and +2 to the asker.

## Stories (blogs) and comments

Stories work as in F2–F3, with five changes.

- **Excerpts:** every list (`/api/blogs/all*`, `/api/blogs/search`, `/api/blogs/me/drafts`, `/api/feed/*`, `/api/bookmarks`) returns `excerpt` (plain text, up to 200 characters) and no `content`. Cards show `excerpt`. The editor always loads a story through `GET /api/blogs/id/{id}`.
- **Anyone can publish:** `POST /api/blogs/create`, drafts, `POST /api/images` and `POST /api/ai/blog-assist` no longer need an author account, only a confirmed e-mail. Show "Write" to every signed-in user.
- **Drafts are private:** visible to their author only, admins included. Someone else's draft is 404.
- **`HIDDEN` status:** a story with enough reports is hidden from everyone, its author too, until a moderator decides. It leaves every list, My stories included; the author learns of it only through the `CONTENT_HIDDEN` notification (F12). An open editor tab that saves or republishes it gets 409 "This post is hidden while the moderators review reports about it." Never offer `HIDDEN` in the publish sheet (create refuses it with 400).
- **Comments:** `GET /api/comments/blog/{blogId}`, `POST /api/comments/create`, `POST /api/comments/reply`, `PUT /api/comments/update`, `DELETE /api/comments/id/{id}`. They are 404 on a draft that is not yours, on a hidden story, and under a hidden parent comment. A 404 on a thread the reader had open means "this conversation is no longer available", not an error toast.

Unchanged and still missing on the backend: a reply count per comment (one request per thread), `bookmarkedByMe`, and a typed `CommentResponse` in OpenAPI.

## AI answers and expert review

Every new question gets one AI answer, generated in the background after it is posted; verified experts in that topic then confirm, correct or flag it.

**The AI answer on a question**

- `GET /api/questions/id/{id}/ai-answer` (public) returns `{id, questionId, answer, sources, status, disclaimer, reviewerName, reviewedAt, correctionAnswerId, createdAt}`.
- 404 means none to show: not generated yet, generation failed, flagged, or the question is hidden. After posting a question, poll every 3 s for up to 60 s, then stop and show nothing. A question page opened later reads it once.
- Show it as its own card above the human answers, never mixed with them, and always show `disclaimer` beside it.
- `status` decides the label:

| `status` | Label | Extra |
| --- | --- | --- |
| `UNCHECKED` | AI answer, not yet checked by an expert | — |
| `CONFIRMED` | Confirmed by `reviewerName` | `reviewedAt` |
| `CORRECTED` | Corrected by `reviewerName` | Link to the expert's answer `correctionAnswerId` on the same page |
| `FLAGGED` | Never returned (404) | — |

**Sources** (here, in the advisor and in history)

- `sources[]` items are `{type, blogId, questionId, title}`. `type: "blog"` links to the story (`/api/blogs/id/{blogId}`, then its slug route). `type: "answer"` links to the question `questionId` ("Community answer to: title").

**Advisor** (F5, private asks)

- `POST /api/ai/ask` and `GET /api/ai/history` are unchanged except for the new `sources` shape. History items gain `sources` and `publishedQuestionId`.
- New: **Ask the experts** on a history item: `POST /api/ai/history/{aiAnswerId}/ask-experts {categoryId, title?}` turns a private ask into a public question with that AI answer, for experts to review. 409 if already published; then link to `publishedQuestionId`. Title defaults to the first 120 characters. The question text keeps line breaks, so render it with `white-space: pre-line`.
- The daily quota is still not exposed by the backend; keep the F5.1 handling (show the message on the refusal).

**Review actions** (Verified Experts in the question's topic)

| Action | Endpoint | Who |
| --- | --- | --- |
| Review queue | `GET /api/review-queue` (paged) | Verified Expert; 403 for anyone else, so hide the entry on 403 |
| Confirm | `POST /api/questions/id/{id}/ai-answer/confirm` | Verified Expert in the topic |
| Correct | `POST /api/questions/id/{id}/ai-answer/correct {content}` (max 5000) | Verified Expert in the topic; posts the expert's answer on the question |
| Flag | `POST /api/questions/id/{id}/ai-answer/flag` | Verified Expert or Top Contributor in the topic; hides it |
| Reopen | `POST /api/admin/questions/{id}/ai-answer/reopen` | Admin with `EXPERT_REVIEW` |

Only `UNCHECKED` answers can be reviewed. A second reviewer gets 409 "This AI answer has already been reviewed.": refetch and show the new state.

Queue items are `{questionId, questionTitle, questionContent, topic, aiAnswer}`, oldest first. Show the review buttons on the question page too, when the signed-in user has the matching badge in that topic (`GET /api/users/{me}/reputation`).

## Verified experts

Any confirmed user can apply to be a Verified Expert in 1 to 3 topics. An admin approves all or some of the topics, or rejects the application with a reason.

**Applicant** (`/experts/apply` and a status card in Settings)

- `POST /api/experts/applications {categoryIds, fieldTitle, credentialType, institution, proofImageUrls, links}`.
- `credentialType` is one of `DEGREE`, `STAFF_ID`, `FACULTY_PAGE`, `LICENCE`, `OTHER`. `fieldTitle` and `institution` are each up to 150 characters.
- Proofs: 1 to 4 images uploaded first through `POST /api/images`, plus up to 3 `http(s)` links. At least one proof is required.
- 409 while an earlier application is still pending: show its status instead of the form. After a decision the user may apply again.
- `GET /api/experts/applications/me` (paged, newest first) returns `{id, topics, fieldTitle, credentialType, institution, proofImageUrls, links, status, reviewNote, createdAt, updatedAt}`. Status is `PENDING`, `APPROVED` or `REJECTED`, and `reviewNote` is the admin's note. **The applicant never sees which admin decided**; don't show any reviewer name.
- Proof images are stored under public `/uploads/` with unguessable names; tell applicants not to upload anything they wouldn't want leaked.

**Admin** (`/admin/experts`, staff only)

- `GET /api/admin/expert-applications?status=PENDING` (paged, oldest first), showing proofs as thumbnails and links opening in a new tab.
- Approve: `POST /api/admin/expert-applications/{id}/approve {categoryIds?, note?}`. Omit `categoryIds` to approve every requested topic, or send a subset.
- Reject: `POST /api/admin/expert-applications/{id}/reject {note}`, where the reason is required (up to 500 characters).
- A second decision is 409: refetch the list.
- Revoke a badge: `DELETE /api/admin/users/{userId}/expert-badges/{categoryId}`. This also reopens the AI answers that expert confirmed in that topic; say so in the confirm dialog.
- These need the `EXPERT_REVIEW` privilege. `UserResponse.roles` carries role names, not privileges, so show the page to staff and show the backend's 403 when a privilege is missing (as F6.6 does).

## Notifications

The API is ready, so F6.7 (the bell) is unblocked. There is no push: poll the unread count.

| Action | Endpoint |
| --- | --- |
| List | `GET /api/notifications?unreadOnly=&pageNo=&pageSize=` (newest first) |
| Unread count | `GET /api/notifications/unread-count` returns `{count}` |
| Mark one read | `POST /api/notifications/{id}/read` |
| Mark all read | `POST /api/notifications/read-all` returns `{updated}` |

Items are `{id, type, targetType, targetId, actorId, actorName, read, createdAt}`. Poll the count every 60 s while the tab is visible, and on window focus. Opening a notification marks it read, then navigates.

| `type` | Text (actor = `actorName`) | Goes to |
| --- | --- | --- |
| `ANSWER_ON_YOUR_QUESTION` | actor answered your question | Question `targetId` |
| `ANSWER_ACCEPTED` | actor accepted your answer | Question `targetId` |
| `AI_ANSWER_REVIEWED` | An expert reviewed the AI answer on your question | Question `targetId` |
| `NEW_REVIEW_ITEM` | New AI answer to review in your topic | Question `targetId` |
| `COMMENT_REPLY` | actor replied to your comment | Story by id `targetId` |
| `APPLICATION_DECIDED` | Your expert application was decided | `/experts/apply` (status card) |
| `CONTENT_HIDDEN` | One of your posts is hidden while moderators review reports | No link: the page is 404 for you too |
| `CONTENT_RESTORED` | Your post is visible again | Question or story `targetId` |
| `CONTENT_REMOVED` | Moderators removed one of your posts | No link: it may be gone |

`actorName` is null for the moderation types and for `APPLICATION_DECIDED`: never show "someone" or an admin's name there. `targetType` is `QUESTION`, `BLOG` or `EXPERT_APPLICATION`. A hidden or removed answer or comment points at its question or story. Unknown future `type` values show a generic "You have a new notification" line and link by `targetType`.

## Reports and moderation

One report hides nothing. When 3 different users have open reports on a post, it is hidden from everyone until a moderator confirms (deleted for good) or dismisses (restored). The threshold is a backend setting, so never hard-code 3 in the UI.

**Report button** (signed-in, confirmed users; on stories, questions, answers, comments, the AI answer and user profiles)

- `POST /api/reports {targetType, targetId, reason, details?}`. `targetType` is `BLOG`, `QUESTION`, `ANSWER`, `AI_ANSWER`, `COMMENT` or `USER`; for `AI_ANSWER`, `targetId` is the question's id.
- `reason` is `HARMFUL_ADVICE`, `SPAM`, `ABUSE`, `FALSE_CREDENTIALS` or `OTHER`, and `details` is up to 500 characters.
- 409 "You have already reported this.": show "Reported" and disable. 400 on your own post: hide the button there. 404: the post is gone.
- Disable the submit button while sending: a double tap still gives a 500 on the backend.
- After sending, say "Thanks, moderators will look at it." Never tell the reporter whether the post got hidden.

**Moderation queue** (`/admin/reports`, staff; needs `CONTENT_MODERATE`)

- `GET /api/admin/reports?status=OPEN|ACTIONED|DISMISSED` (paged, oldest first). Items are `{id, reporterId, reporterName, targetType, targetId, reason, details, status, snapshot, createdAt}`.
- An open report with a `snapshot` is on a post that is hidden now: badge it "Hidden" and show the snapshot text, because the live page is 404 even for staff. Without a snapshot, link to the live post.
- Group open reports by `targetType` + `targetId` in the UI: one decision covers every open report on that post.
- **Remove** `POST /api/admin/reports/{id}/remove-content`: deletes the post for good, its reputation and AI index included, and closes all its open reports as `ACTIONED`. For an `AI_ANSWER`, it hides it instead. A `USER` report answers 400 "A user cannot be removed; ban the account instead."
- **Dismiss** `POST /api/admin/reports/{id}/dismiss`: closes every open report on that post and restores it if hidden.
- 409 "This report has already been handled." means another moderator acted first: refetch and drop the row.
- **Ban** `POST /api/admin/users/{userId}/ban {reason}` (reason required, up to 500 characters) signs them out everywhere and closes the open reports about them. **Unban** is `DELETE` on the same path. Admin accounts cannot be banned. A ban does not remove the user's posts; moderators remove those through their reports.
- Confirm dialogs for remove and ban say they cannot be undone (unban exists, but sessions are gone).

The flow below shows how a post moves between these states.

Report flow: Visible → (3 different users report) → Hidden for review → admin confirms → Deleted for good; from Hidden, admin dismisses → Visible again (author told).

Below the threshold an admin can still remove or dismiss straight from the queue; a dismissed post that was never hidden simply stays.

## Errors the UI must handle

The backend sends no machine-readable error codes, only a status and a human `message`. Branch on the status plus the endpoint, show `message` as written, and never match on message text except where this table says so.

| Status | Where | Meaning | UI |
| --- | --- | --- | --- |
| 401 | Any call with a token | Expired, signed out, or banned (a banned token acts like none) | One refresh, then sign-in |
| 403 | Refresh, sign-in, Google, sign-up | Banned, or must change password | Show `message` on the sign-in page; end the session |
| 403 | Any write | E-mail not confirmed | Confirm dialog with resend. The one place to match text: message starts "Confirm your e-mail" |
| 403 | Votes | Own post, or under 50 points to downvote | Tooltip with `message` |
| 403 | Expert, admin and review endpoints | Missing badge or privilege | Hide the entry, or show `message` |
| 404 | Single reads | Gone, hidden, someone else's draft, or no AI answer yet | "Not available" page; for an AI answer, show nothing |
| 409 | Hidden story edit or publish; second report; second review or decision; already-published ask; report already closed | Conflict | Show `message`, then refetch |
| 429 | AI and Google sign-in | Daily per-network cap | Show `message`; no retry |
| 503 | AI | Model unavailable | "The AI is unavailable, try later"; the question itself is saved |
| 500 | Double-tapped report or vote | Unique constraint race | Prevent with a disabled button while sending |

The `lang=bn` parameter is still accepted, but backend messages are English only.

## Build plan

The plan is 22 steps in 8 phases. Build them in order: F7 makes the existing app work again, and every later phase depends on it. Each step is one PR into its phase base (`feat/<phase>-base` off `development`) and ships with Vitest tests for its new logic. F12–F14 need the backend's Phase 8 branch running locally until it is merged.

### F7 — Catch up with the backend (`feat/backend-catchup-base`)

| # | Step | Done when |
| --- | --- | --- |
| F7.1 | Regenerate OpenAPI types. One account type: sign-up without reader/author or professional info; drop `userTypes`; "Write" for every signed-in user; profile details as an optional step after first sign-in | Sign-up, sign-in and Google work; no `userTypes` left in `src/` |
| F7.2 | E-mail confirmation: `/verify-email?token=` page, resend, unconfirmed banner, a dialog on write attempts. Client: a 403 from refresh ends the session with its message; no refresh loop | New account confirms through the dev mail-log link; a banned account sees the ban message once |
| F7.3 | Story cards read `excerpt`; the editor always loads by id; staff no longer expect others' drafts | Feed, search, library and My stories render; editing a draft opened from a list keeps its body |

### F8 — Questions first (`feat/questions-first-base`)

| # | Step | Done when |
| --- | --- | --- |
| F8.1 | Ask form: topic (required), up to 5 tags, up to 4 photos through `POST /api/images`, agri details. Edit keeps tags and photos when not touched | A question with topic, tags and photos posts and edits |
| F8.2 | Questions list: topic and tag filters, an Unanswered tab, `answerCount` and `score` on cards; question search (`/api/questions/search`) in the search page; home lands on questions (see open items) | Filters combine; search finds by phrase |
| F8.3 | Question page: direct answers in backend order, replies loaded per answer on open, reply form; the client-side reply filter removed | Replies appear only under their answer |

### F9 — Votes and reputation (`feat/reputation-base`)

| # | Step | Done when |
| --- | --- | --- |
| F9.1 | Vote arrows on questions and answers with `my-votes`; optimistic update rolled back on error; no arrows on your own posts; the 50-point downvote message | Score and state survive a reload |
| F9.2 | Accept and un-accept (asker only), accepted mark and position | Accepted answer moves to the top |
| F9.3 | Author line: reputation total and `authorBadges`. Profile page: reputation by topic with badges and expert field, the user's questions | A Top Contributor and a Verified Expert show their badge in their topic only |

### F10 — AI answers (`feat/ai-answers-base`)

| # | Step | Done when |
| --- | --- | --- |
| F10.1 | Remove the F4.4 AI-draft button. AI answer card on the question page: polling after asking, disclaimer, status labels, "Corrected by" link | Seeded rows of each status render; 404 shows nothing |
| F10.2 | One `Sources` component for both `type`s, used by the AI card, advisor and history | Answer sources link to their question |
| F10.3 | Advisor history: "Ask the experts" (topic, optional title), then a link to the new question; 409 handled | A private ask becomes a public question |

### F11 — Verified experts (`feat/experts-base`)

| # | Step | Done when |
| --- | --- | --- |
| F11.1 | Apply page and status card: topics, field, credential type, institution, proof uploads and links; pending, approved and rejected states with the note; no reviewer name | Second application while pending shows the status |
| F11.2 | Review queue page and confirm / correct / flag on the question page for badge holders; 409 refetches | Confirm on a seeded `UNCHECKED` answer changes its label |
| F11.3 | Admin: applications list, approve all or some topics, reject with a note, revoke a badge | Approved user shows the expert badge on their answers |

### F12 — Notifications (`feat/notifications-base`, replaces F6.7)

| # | Step | Done when |
| --- | --- | --- |
| F12.1 | Bell with the unread count (60 s poll while visible, and on focus), a dropdown of the latest 10, mark read on open, mark all read | Answering another user's question raises their count |
| F12.2 | Notifications page with an unread filter and paging; text and links for all 9 types; no actor for moderation and decisions | Each type opens the right place, or shows no link |

### F13 — Reports and moderation (`feat/moderation-base`)

| # | Step | Done when |
| --- | --- | --- |
| F13.1 | Report dialog on stories, questions, answers, comments, the AI answer and profiles; 409 shows "Reported" | Three users reporting a post hides it from all of them |
| F13.2 | Admin reports page: status tabs, open reports grouped by post, snapshot for hidden posts, remove and dismiss with confirm dialogs, 409 refetch | Dismiss restores the post; remove deletes it |
| F13.3 | Ban and unban (from a `USER` report and from the profile, staff only). Hidden and removed states: a story editor that gets 409, a comment or answer thread that turns 404 | A banned user is signed out and sees the message |

### F14 — Launch polish (`feat/launch-polish-base`)

| # | Step | Done when |
| --- | --- | --- |
| F14.1 | Bengali strings for every new screen; a keyboard and screen-reader pass on them | `bengali.test.tsx` covers the new keys |
| F14.2 | Playwright smoke against a running backend: sign up, confirm, ask, answer, vote, accept, three reports hide, admin dismisses, notifications arrive | The run passes against the local database |

## Open items

**Decisions for Nayeem** (the agent asks before building these steps)

- [ ] F8.2: should the home page land on questions (the plan says Q&A-first) with stories as the second tab, or keep the stories feed first?
- [ ] F11.3 and F13.2: who on the team gets `EXPERT_REVIEW` and `CONTENT_MODERATE`? Today only the super-admin role holds them.

**Still missing on the backend** (carry these in the web roadmap's "Needs from the backend")

| Item | Needed for |
| --- | --- |
| Machine-readable error codes in the error envelope | Branching without matching message text (F7.2, F9.1) |
| "Am I an expert in this topic" without reading the full reputation | Showing review buttons (F11.2) |
| A way for an author to see their own hidden post | The author can't read what was reported (F13.3) |
| Reply count per comment, `bookmarkedByMe`, advisor quota, refresh token as an HttpOnly cookie | Carried over from F2–F5 |
| A working Gemini chat key | Any live check of AI answers (F10) |
| CORS origins from a property (backend 4.1) | A deployed split origin |

**Backend timing**

- Backend Phase 8 is not merged into `development` yet; F12–F14 build against `feat/notifications-moderation-base` until it is.
- Backend Phase 4 (profiles, Flyway, Docker, CI) comes next on the backend. After that, deploy both and live-test before launch.
