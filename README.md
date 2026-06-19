# OnlineJobs.ph Chrome Extension Scraper

![Extension Icon](icon128.png)

## Overview
A **premium‑styled** Google Chrome extension that lets you search for the latest job postings on [OnlineJobs.ph](https://www.onlinejobs.ph/jobseekers) directly from the Chrome toolbar.  
Enter a keyword (e.g., "AI Engineer"), set an optional request delay, and the extension will fetch the most recent listings, display them in a glass‑morphism popup, and cache results locally.

## Features
- **Keyword‑based search** – fetch jobs matching any term.
- **Pagination with “Load More”** – retrieve additional result pages on demand.
- **User‑controlled delay** – avoid rate‑limiting or bot detection.
- **Local caching** via `chrome.storage` for quick repeat access.
- **Premium UI** – dark glass‑morphism, gradient buttons, subtle micro‑animations, and the Inter font.
- **Cross‑origin support** – uses manifest host permissions for `https://www.onlinejobs.ph/*`.

## Installation
1. Clone or download the repository.
2. In Chrome, open **Extensions** → **Developer mode** → **Load unpacked**.
3. Select the folder `onlinejobs_ph_scraper`.
4. The extension icon will appear next to the address bar.

## Usage
1. Click the extension icon to open the popup.
2. Type a job keyword (e.g., `AI Engineer`).
3. (Optional) Set a **Delay (ms)** – the number of milliseconds the extension waits before sending the request. A small delay (e.g., `500`) helps avoid being flagged as a bot.
4. Press **Search** – results appear as cards with title, company, and posting date.
5. Click **Load More** to fetch the next page of results.
6. Click a job title to open the original posting in a new tab.

## Development
```bash
# Clone the repo (if you haven't already)
git clone https://github.com/asrnb/olj-job-scraper.git
cd olj-job-scraper

# Install dependencies (none required – pure JavaScript/CSS)
# Run linting or build steps if you add tooling.
```
- Modify `manifest.json` to adjust permissions or add content scripts.
- Update UI in `popup.html`, `popup.css`, or `popup.js`.
- After changes, run:
```bash
git add .
git commit -m "Your message"
git push
```

## License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---
*Created by Antigravity – your AI‑powered coding assistant.*
