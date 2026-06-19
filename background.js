// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    const { keyword, page, delayMs } = request;
    const url = `https://www.onlinejobs.ph/jobseekers?searchterm=${encodeURIComponent(keyword)}&page=${page}`;
    // Respect user‑controlled delay to avoid rate‑limiting / bot detection
    setTimeout(() => {
      fetch(url)
        .then((resp) => resp.text())
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const jobElements = doc.querySelectorAll(
            ".job-item, .job-card, .job-listing, .listing-item"
          );
          const jobs = [];
          jobElements.forEach((el) => {
            const titleEl = el.querySelector(".title a, .job-title a, h3 a");
            const companyEl = el.querySelector(".company, .employer");
            const dateEl = el.querySelector(".date, .posted");
            if (titleEl) {
              jobs.push({
                title: titleEl.textContent.trim(),
                link: titleEl.href,
                company: companyEl ? companyEl.textContent.trim() : "",
                date: dateEl ? dateEl.textContent.trim() : "",
              });
            }
          });
          sendResponse({ jobs });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
    }, delayMs || 0);
    // Keep the message channel open for async response
    return true;
  }
});
