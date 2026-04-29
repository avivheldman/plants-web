# Plants Web — Demo Script

## Setup (before the demo)

Make sure both servers are running:

```bash
# Terminal 1 — server
cd /Users/aviv.h/Code/plants-web
npm run dev

# Terminal 2 — client
cd /Users/aviv.h/Code/plants-web/client
npm run dev
# Opens at http://localhost:5173
```

Demo account: **testuser@plants.com** / **Test1234!**

---

## Scene 1 — Registration & Login (30 s)

1. Open `http://localhost:5173`
2. **Not logged in** → landing page shows "Welcome to Plants Web" with Log in / Sign up.
3. Click **Log in**, enter the demo credentials.
4. After login → immediately lands on the **Feed** (no extra navigation needed).

> **Talking point:** Home page is auth-aware — logged-in users land directly on the feed.

---

## Scene 2 — The Feed with Infinite Scroll (30 s)

1. Browse the feed — 50+ posts load in pages of 10.
2. Scroll to the bottom — IntersectionObserver triggers the next page automatically.
3. Post cards show: author avatar, date, title, content excerpt, plant tag, tags, likes, comment count.

---

## Scene 3 — AI Smart Search (60 s) ★ Main AI Feature

1. Type **"low light plants"** in the search bar → press Enter.
2. Results show:
   - **Green badge** ("tier-high") on exact matches like "The Best Low Light Plants for Your Living Room"
   - **Amber badge** ("tier-medium") on partial matches
   - **Yellow highlight** on matched words inside titles
   - **✨ AI reason** line under top results (if Gemini quota available)
3. Click **Clear** → returns to paginated feed instantly.

4. Now search **"dark"**:
   - With Gemini working: expands to ["low light", "shade tolerant", "dim conditions"] → finds ZZ Plant, Cast Iron Plant posts
   - Without Gemini (quota): uses "dark" as keyword → still finds relevant posts with "dark" in title

5. Search **"watering succulents"** → first result is always the dedicated succulent watering guide.

> **Talking point:** The AI (Gemini 2.0 Flash) extracts multi-word phrases and synonyms from natural-language queries. Word-boundary matching ensures "low" only matches the whole word, not substrings like "flowed" or "below". Results are scored and tiered visually.

---

## Scene 4 — Post Detail & Comments (30 s)

1. Click any post card → `/posts/:id`.
2. Shows full post with image, all tags, full content.
3. Add a comment — live count updates.
4. Click the author's name → their profile page loads.

---

## Scene 5 — Create Post with AI Tag Suggestions (60 s) ★ Second AI Feature

1. Click **+ New Post**.
2. Fill in:
   - Title: "My Monstera Finally Got Fenestrations"
   - Content: "After 18 months of bright indirect light and monthly fertilizing, my Monstera Deliciosa finally started splitting its leaves. The secret was a moss pole for climbing support and consistent watering when the top 2 inches of soil dry out."
3. Click **✨ Suggest tags** — Gemini analyzes the content and returns tag chips.
4. Click each chip to add it to the tags input.
5. Submit → post appears in the feed.

> **Talking point:** The AI reads the post title and content and suggests relevant plant care tags. One click to add each suggestion.

---

## Scene 6 — Profile Page (20 s)

1. Visit `/profile` → "My Posts" with all posts you created.
2. Click any author name in the feed → `/profile/:userId` → their posts with "User's Posts" heading.
3. `/profile/edit` — change display name, upload/remove photo.

---

## Scene 7 — API Demo (for technical reviewers)

Open a new terminal and run these live:

```bash
# AI smart search
curl -s 'http://localhost:3000/api/search?q=low+light+indoor+plants&limit=3' | python3 -m json.tool | grep -E '"title"|"_matchScore"|"_aiReason"|"_matchedKeywords"'

# AI tag suggestion
curl -s -X POST http://localhost:3000/api/search/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Growing Spider Plants in Low Light","content":"Spider plants are incredibly forgiving. They thrive in indirect sunlight and low light conditions, tolerating a wide range of temperatures."}' | python3 -m json.tool

# Paginated feed
curl -s 'http://localhost:3000/api/posts?page=1&limit=5' | python3 -m json.tool | grep -E '"title"|"hasMore"|"total"'

# Filter by author
curl -s 'http://localhost:3000/api/posts?author=69ee9be6f846e42cbe73765e&limit=5' | python3 -m json.tool | grep '"title"'
```

---

## Swagger Docs

Full API documentation at: **http://localhost:3000/api-docs/**

All endpoints documented with request/response schemas and Bearer auth.

---

## Feature Checklist (for the grader)

| Feature | Where to see it |
|---------|----------------|
| Register | `/register` — email + password |
| Login | `/login` — email + password |
| Google OAuth | `/login` → "Continue with Google" |
| JWT tokens | Network tab: `Authorization: Bearer ...` |
| Persistent session | Reload page — stays logged in |
| User profile | `/profile` |
| View other profiles | Click author on any post |
| Edit profile (name + photo) | `/profile/edit` |
| Feed | `/feed` or `/` when logged in |
| Infinite scroll | Scroll to bottom of feed |
| Create post (text + image) | Click "+ New Post" |
| Edit / Delete own post | From post detail page |
| Like / Unlike | Heart button on post detail |
| Comments (separate screen) | Click any post → comment section below |
| AI Smart Search | Search bar in feed |
| AI Tag Suggestions | "✨ Suggest tags" on create/edit post |
| Swagger docs | `http://localhost:3000/api-docs/` |
| Jest tests | `npm test` in server root |
