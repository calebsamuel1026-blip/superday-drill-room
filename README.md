# Superday Drill Room

Practice investment banking interview questions out loud and get coached on every answer.

**Use it:** https://calebsamuel1026-blip.github.io/superday-drill-room/

## What it does
- **Records your answer** with your browser's speech recognition. You can also type it.
- **Grades it 0–10** across Content, Structure and Delivery, and catches factual mistakes and missed key points.
- **Coaches you:** fixes ranked by importance (rambling, tangents, filler words, hedging, leading with the answer, STAR for stories), with weak wording highlighted in your transcript and a tightened version of your own answer.
- **Mastery:** every question and concept is tracked as Mastered, Getting there, Needs work or Really needs work.
- **Accounts:** create a free account to keep your progress across devices. You can also use it without one; progress then stays in that browser.
- **Optional Claude review:** add your own Anthropic API key in Settings for an interviewer score, a rewritten answer and follow-up questions.

Works best in Chrome or Edge. If the mic button doesn't work, dictate with Win+H (Windows) or Dictation (Mac).

## How it's built
One static page (`index.html`) on GitHub Pages. Accounts and saved progress use Supabase (`supabase/schema.sql`), where row-level security means each person can only read and write their own progress. The key in `src/config.json` is Supabase's public anon key, which is meant to be in the browser.

Source lives in `src/`. Rebuild with `python -I src/build.py --public`, then copy `public/index.html` to `index.html`.
