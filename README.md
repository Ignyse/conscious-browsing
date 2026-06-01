# conscious-browsing
## Idea
A lightweight browser extension that reduces habitual website usage by inserting customizable interruption screens (text → images → video later) before allowing access to selected domains.

Instead of blocking sites, it adds intentional friction to encourage mindful browsing.

## Description
Users define domains (e.g. youtube.com). When visiting them, the extension redirects to an intemediate page showing a message or media prompt.

User must either:
- Press **Continue** to proceed to the site
- Or exit the tab, breaking the habit loop

Supported interruption types:
- Text messages (MVP)
- Images (Phase 2)
- Video (Phase 3)
  
## Tech Stack
- Browser Extension API (Chrome MV3 / Firefox WebExtensions [Future?])
- JavaScript / TypeScript
- HTML + CSS (intermediate UI)
- browser.storage.local (settings persistence)
- Future: React (settings UI), Vite (bundling)
  



