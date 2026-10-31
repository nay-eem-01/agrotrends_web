# Backend requests for the mock-up screens (F22)

Written 2026-10-31 for the backend agent. The web pages are built already: each section below stays hidden (or shows
a fallback) until its endpoint answers, so nothing breaks while these are missing. Every response uses the usual
`{ status, message, payload, success }` envelope; lists are Spring `Page`s (`pageNo`, `pageSize`, `content`,
`totalElements`, `last`). The caller is always taken from the token, never from the URL or body.

Priority: **P1** the page looks empty without it · **P2** a visible part of the mock-up · **P3** nice to have.

## 1. Public user summary (P1) — profile page, "Experts to follow"

The author profile (`GET /api/authors/{authorId}`) already gives headline (designation, occupation, workplace), bio,
photo, specialities, followers and follow. What's missing is the way from a **user** (questions and answers carry
`userId`) to that author, plus a few profile facts:

`GET /api/users/{userId}/profile` (public)

```json
{
  "userId": 7, "name": "Dr. Nasrin Akter", "authorId": 3,
  "location": "Mymensingh", "coverUrl": null, "joinedAt": "2026-03-02T00:00:00Z",
  "answerCount": 184, "acceptedAnswerCount": 92, "questionCount": 5, "storyCount": 12,
  "credentials": [ { "title": "PhD, Aquaculture", "institution": "Bangladesh Agricultural University", "year": 2016 } ]
}
```

- Every user should have an author row (or `authorId` may be null and the web hides Follow and Stories).
- `credentials`: from approved expert applications (field + institution) plus any the user adds in settings.
- `PUT /api/user/profile` (signed in) — `{ location?, coverUrl? }` (≤ 80 characters; images from `POST /api/images`).
  Headline, bio and photo stay on `PUT /api/authors/me`.

## 2. Follow a person (P2) — Follow on profiles, bylines and "Experts to follow"

Nothing new if every user has an author row: the web follows through `/api/authors/{authorId}/follow` using the
`authorId` from §1 (and from §4's experts).

## 3. A user's answers (P1) — "Answers" tab and "Recent contributions"

`GET /api/answers/all/user/{userId}?pageNo&pageSize` (public) → `Page<AnswerResponse>` plus `questionTitle` on each
item, newest first. Hidden answers excluded unless the caller is the author.

## 4. Experts to follow (P2) — right rail on the home feed

`GET /api/experts?categoryId={optional}&pageNo&pageSize` (public) → `Page<{ userId, name, authorId, avatarUrl,
expertField, institution, topics: [{ id, categoryName }], followedByMe }>`, verified experts only, most
accepted answers first. With no `categoryId`, prefer the caller's followed topics.

## 5. Follow topics (P2) — "Your topics" in the home sidebar, "+ Follow topics"

`PUT /api/categories/{categoryId}/follow`, `DELETE` same, `GET /api/me/following/categories` → `CategoryResponse[]`.
(Tags already have this; the mock-up's topics are categories.)

## 6. One home feed (P2) — the mixed "For you" feed

`GET /api/feed/home?categoryId={optional}&pageNo&pageSize` → `Page<{ type: "story" | "question", story?:
BlogSummaryResponse, question?: QuestionResponse }>`, newest first; signed in: followed topics, tags and authors
first. Until it exists the web merges `/api/feed/latest` and `/api/questions/all` by date.

## 7. Question views (P3) — the question page's side panel

`viewCount` on `QuestionResponse`, counted once per signed-in user (or per session for visitors) per day.

## 8. AI advisor follow-ups and citations (P2)

On `AiAnswerResponse`: `followUps: string[]` (2–3 short next questions in the asker's language) and, in `answer`,
citation markers `[1]`, `[2]` … that refer to `sources` by position. The web turns markers into the numbered chips.

## 9. Story subtitle and AI opt-out (P3) — editor and story page

On blog create/update and `BlogResponse` / `BlogSummaryResponse`: `subtitle` (≤ 200) and `aiCitable` (boolean,
default true). When false the advisor never uses the story as a source.

## 10. Public numbers (P3) — the sign-in panel

`GET /api/stats/public` → `{ members, verifiedExperts, questions, answeredQuestions }`, cached for an hour.

## 11. This week's tasks (P3) — the phone home, Bengali first

`GET /api/tips/this-week?region={optional}` → `[{ id, topic: CategoryResponse, text, textBn }]`, two to four tips for
the current Bengali month (and region when given). Written by admins (`POST/PUT/DELETE /api/admin/tips`). Needs the
user's `region` (district) on the profile in section 1 to default it.

## 12. Questions reach experts first (P3) — the expert application page's third promise

When a question is posted in a topic, notify the verified experts of that topic (existing notifications, a new type
`NEW_QUESTION_IN_TOPIC`), at most a few a day per expert.
