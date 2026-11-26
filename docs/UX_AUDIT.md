# AgroTrends usability audit

November 25, 2026 · Frontend branch `fix/agrotrends-ui-experience` · Baseline `b16286a`

The mobile header regression is fixed in the working tree. The highest-priority open issues concern lost work, blocked submissions, and verification status. The findings below distinguish browser observations from code review.

## Findings

| ID | Priority | Screen | What happens and how to reproduce | Recommended outcome | Evidence |
| --- | --- | --- | --- | --- | --- |
| 01 | P1 · Fixed locally | Shared mobile header | At 390px, open Stories. The previous header deliberately hid the leaf below 420px when Back was present. The prior regression check only verified the wordmark. | Keep the leaf, wordmark, and Back control visible together. The updated header reduces spacing and size on the narrowest screens. | Baseline CSS and browser verification of the fix at 13 widths from 320px to 1440px, signed in and signed out. A Playwright regression passed at 320px. |
| 02 | P1 | Ask and edit question | Open `/questions/ask` directly and tap **Cancel**. On the browser run, it went back to `about:blank`. The shared header arrow on the same screen instead provides an in-app fallback. | Use the same history-aware return behavior for Cancel and the header. A direct visit to Ask should return to Questions. Editing should return to the question. | Chromium. [AskPage.tsx](../src/features/qa/AskPage.tsx) |
| 03 | P1 | Ask and edit question | Type an unsent title, tap the mobile back arrow, and reopen Ask. The title is gone. The form has no save-on-exit or discard confirmation. | Recover new-question drafts and warn before abandoning changed edits, including when leaving from the shared header. | Chromium for new questions. Shared form code for edits. |
| 04 | P1 | New story | Enter a title, body, topic, and subtitle. Wait for “Draft saved on this device” and reload. Title and body return. Topic and subtitle are blank. Tags and AI citation preference are also held outside the persisted draft. | Persist the full local draft or describe exactly what the save status covers. | Chromium for topic and subtitle. [EditorPage.tsx](../src/features/editor/EditorPage.tsx) |
| 05 | P1 | Ask and story publishing | Force the category request to fail, fill the rest of the question, and tap **Post question**. The summary says “Choose a topic,” but the picker has no options or retry action. Story settings use the same catalogue and also lack a failed-load state. | Explain the loading failure in the topic control, give it a Retry action, and preserve the draft. | Chromium on Ask. Code review of [StorySettings.tsx](../src/features/editor/StorySettings.tsx). |
| 06 | P1 | Expert verification and Settings | Force the application-status request to fail. The application page opens a fresh application form with no notice. The Settings status section also treats missing data as permission to apply. Someone with a pending application could prepare proof again. | Give application status its own recoverable error state before offering a new application. | Chromium on the application page. Code review of Settings. |
| 07 | P2 | Notification page and header bell | Force **Mark all read** to fail. The unread count stays the same and the action becomes available again without an explanation. The header panel also lacks a pending state for this action. | Show failure feedback next to the action and keep it available for retry after the request settles. | Chromium on Notifications. Code review of [NotificationBell.tsx](../src/layout/NotificationBell.tsx). |
| 08 | P2 | Header notifications | Open the bell with a full list at 320×420. The “See all notifications” link goes behind the fixed bottom bar. A hit test at the link center lands outside the link. | Reserve space for both fixed bars so the panel footer stays visible and operable. | Chromium geometry and hit test. |
| 09 | P2 | Story bookmark and Topics | Force a story bookmark or tag-follow request to fail. The state reverts silently, with no error in view. Category follows do surface an error, so feedback differs across closely related actions. | Put a short failure message beside the action and preserve a clear retry path. | Chromium for bookmark, tag follow, and category follow. |
| 10 | P2 | Mobile Back across section tabs | Open Stories, choose Trending, then tap the header arrow. It returns to the previous filter on the same screen. The arrow gives no clue whether it returns to a different page or changes a filter. | Define one policy for page-level Back and browser history. Keep filter changes in history only where that behavior is useful and predictable. | Chromium. |
| 11 | P2 | Reading a story from a filtered list | Open a story from a filtered Stories list and press the story’s **Back to stories** link. Its destination is fixed at `/stories`, dropping the originating tab and filters. The header arrow uses history instead. | Preserve the originating list and its reading position, with Stories as the direct-link fallback. | Link destination and route code in [StoryPage.tsx](../src/features/story/StoryPage.tsx). |
| 12 | P2 | Story images | Tap a cover or inline image in the story. Both remain static. This differs from the image viewer available for question photos and leaves detailed images hard to inspect on a phone. | Reuse an accessible in-page viewer for story images with sensible keyboard focus and close behavior. | Chromium on cover and inline image. |
| 13 | P2 | Publishing meaningful images | Add an inline image or cover in the story editor. There is no way to enter alternative text. The published cover has empty alt text, and the editor supplies empty alt text for new inline images. | Let authors describe meaningful images or explicitly mark them decorative. | Chromium and [StoryEditor.tsx](../src/features/editor/StoryEditor.tsx). [W3C non-text content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) |
| 14 | P2 | Bengali across author, account, and staff screens | Switch to Bengali and open the editor. **Publish** and **Story settings** remain English. Staff navigation and Roles are also English. Settings headings and several account actions are hard-coded English. | Complete translations for core actions and their error states, then verify Bengali in context at phone widths. | Chromium on editor and admin. Code review on Settings. |
| 15 | P2 | Story and question editors | Tap **Link** in the formatting toolbar. The editor opens a native browser prompt. The control has no visible design-system context, inline validation, or efficient way to edit an existing link. | Use an accessible in-app URL field with labeled Add, Edit, and Remove actions. | Chromium on story editor. [QuestionEditor.tsx](../src/features/qa/QuestionEditor.tsx) uses the same interaction. |
| 16 | P2 | Reading list and bookmark state | The bookmark indicator reads only the first 100 saved stories. A story saved beyond that first page can display as unsaved, so its button offers the wrong action. | Query saved state for stories on screen or otherwise resolve saved state beyond the initial page. | Code review of [reactions.ts](../src/api/reactions.ts). |
| 17 | P2 | Release verification | The guest landing smoke test expects a “Home sections” navigation that is absent from the current Discover page. The signed-in Ask test still tries to select a native Topic dropdown although Ask uses topic radio chips. | Update smoke tests to exercise current controls, and run guest and signed-in journeys before release. | Guest smoke failure reproduced. Signed-in selector confirmed by source and fixture UI. |
| 18 | P3 | Browser tab and history labels | Open sign-in, sign-up, password recovery, phone verification, Settings, or the missing-page screen. The browser title is only “AgroTrends.” Several tabs are indistinguishable and screen-reader users lose a page-level cue. | Use a descriptive, localized document title for every route. | Captured browser titles. [W3C page titles](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html) |
| 19 | P3 | Settings | On mobile, the screen presents Account, Profile, Profile page, E-mails, Verified expert, and Password in one long stack with no section navigation. Profile and Profile page have overlapping labels and different Save actions. | Add section navigation and use labels that distinguish public profile details from photo and location settings. | Browser route and controls inventory. |

| 20 | P3 | Admin on tablet | At 768px, open Roles. The sidebar and a separate strip both display the same admin destinations and current section. | Switch between the strip and sidebar at the same breakpoint. | Chromium. |

P1 means the issue can block a core task, lose entered work, or mislead someone about application status. P2 means it materially affects control, feedback, or accessibility. P3 means it adds navigation or recognition friction.

## Coverage and evidence

- Opened a production build locally and exercised all 42 declared route patterns, including the fallback route and the legacy story redirect. The route matrix covered 225 viewport, role, and route combinations at 320, 390, 768, and 1440px. It included guest, member, and super-admin fixtures, plus selected Bengali and dark-mode runs. This was a render and control inventory. Interaction verification focused on high-risk journeys and the reported findings.
- **Discover, feeds, and reading.** Covered guest and member Discover, Questions and Stories feeds, search with both result tabs, topic directory, tags, question and story detail, the story redirect, author and user profiles. Exercised filtered Stories navigation, following, bookmarking, image behavior, and the story contents control. The contents control correctly focused and highlighted the selected heading on mobile.
- **Writing, replies, and advisor.** Covered new and existing stories, Ask and edit question, public and private audience controls, AI advisor, and history. Exercised device draft reload, direct-entry exit, image and link controls, and a failed topic dependency. Existing automated tests covered posting, uploads, replies, and error summaries with fixtures.
- **Account and signed-in tools.** Covered sign-in, sign-up, e-mail and phone password recovery entry, reset, confirmation, welcome, Settings, expert application and review, notifications, drafts, published stories, and the Library’s reading and following tabs. Exercised verification status failure, notification failure and panel clearance, and selected Bengali controls.
- **Staff, help, and recovery.** Covered admin sign-in gating, overview, user list and detail, roles, categories, verification, reports, About, Terms, Privacy, e-mail unsubscribe confirmation, and missing-page recovery. Existing tests cover moderation decisions and permission responses with fixtures.
- All 397 Vitest tests passed in the audit run. All 31 layout and Discover tests passed on the final header change. Lint and the production build passed. The new mobile header browser smoke passed. The existing guest landing smoke failed on the obsolete locator documented in finding 17.
- The workspace could not reach the deployed site through either the command-line network proxy or the web connector. Browser and unit checks used representative API fixtures and simulated failures. Production credentials, actual SMS and e-mail delivery, Google OAuth, live publishing and moderation, physical iOS and Android devices, Safari, and screen-reader sessions remain unverified. The audit is therefore a prioritized findings list, with production release checks still outstanding.

## Benchmarks

- For responsive layout, keyboard focus, browser titles, and system feedback, the audit used [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [W3C form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/).
- For navigation and failed submissions, it used the production GOV.UK patterns for a predictable [Back link](https://design-system.service.gov.uk/components/back-link/) and a focused, linked [Error summary](https://design-system.service.gov.uk/components/error-summary/).
- For publishing expectations, it reviewed how users can return to drafts and continue editing in the [Medium Help Center](https://help.medium.com/hc/en-us/articles/214874698-Create-edit-or-delete-a-story).

## Follow-up fixes

The findings above describe the audit baseline. The changes below are in the frontend and backend working trees.

| Finding | Change |
| --- | --- |
| 01 | The mobile header keeps the leaf and wordmark visible beside Back. |
| 02 | Ask Cancel and the header share in-app Back behavior and direct-entry fallbacks. |
| 03 | Unsent questions and edited questions are saved on the device, scoped to the signed-in account and question. A successful submission clears the draft. |
| 04 | The local story draft includes its topic, subtitle, tags, AI citation preference, and cover description. Incomplete drafts can be saved explicitly on the device. |
| 05 | The browser keeps the last complete topic catalogue, refreshes it when stale, and exposes Retry when a fetch fails. Publishing still checks the selected topic. A device with no valid topic can keep the draft and retry. |
| 06 | Application status failures show a recoverable error on the application and Settings screens. |
| 07 | Notification mark-all actions show pending and failure states. |
| 08 | The notification popover list scrolls inside the available space, keeping its footer above the bottom bar. |
| 09 | Bookmark and follow failures appear beside the affected control. |
| 10 | The page Back arrow skips same-page filter entries. Browser history still includes them. |
| 11 | Back to stories uses the previous Stories list when available, preserving its filter URL. |
| 12 | Story covers and inline images open in the same-page viewer with keyboard controls. |
| 13 | Authors can supply alternative text for story covers and inline images. Persisting cover descriptions requires the corresponding backend change. |
| 14 | Bengali text is wired into key publishing, profile, settings, and staff actions. The translation coverage test checks new literal translation keys. |
| 15 | Story and question editors use an in-app link form for adding, editing, and removing links. |
| 16 | The saved-story indicator reads bookmark IDs from all pages. |
| 17 | Browser smoke selectors use the current Discover navigation, topic controls, and question action menu. |
| 18 | Auth, Settings, and missing-page screens have descriptive document titles. |
| 19 | Settings has section links and distinct labels for author profile details and cover/location. |
| 20 | Admin tabs hand off to the sidebar at the same breakpoint. |

Follow-up verification passed 402 frontend tests, 448 backend unit tests, four guest smoke tests, and eight Chromium interaction checks with API fixtures. Signed-in smoke tests and the three backend integration tests still require the corresponding test services.
