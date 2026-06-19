// popup.js
let currentPage = 1;
let currentKeyword = '';
let delayMs = 500;

const keywordInput = document.getElementById('keyword');
const delayInput = document.getElementById('delay');
const searchBtn = document.getElementById('searchBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const resultsDiv = document.getElementById('results');

function renderJob(job) {
  const card = document.createElement('div');
  card.className = 'job-card';
  const title = document.createElement('a');
  title.className = 'job-title';
  title.href = job.link;
  title.target = '_blank';
  title.textContent = job.title;
  const company = document.createElement('div');
  company.className = 'job-company';
  company.textContent = job.company;
  const date = document.createElement('div');
  date.className = 'job-date';
  date.textContent = job.date;
  // Optional description if present
  if (job.description) {
    const desc = document.createElement('div');
    desc.className = 'job-description';
    desc.textContent = job.description;
    desc.style.fontSize = '0.8rem';
    desc.style.color = '#c0c0c0';
    card.appendChild(desc);
  }
  card.appendChild(title);
  card.appendChild(company);
  card.appendChild(date);
  resultsDiv.appendChild(card);
}

function clearResults() {
  resultsDiv.innerHTML = '';
  loadMoreBtn.classList.add('hidden');
}

function storeResults(jobs) {
  // Cache results locally using chrome.storage (merge with existing)
  chrome.storage.local.get({ cachedJobs: [] }, (data) => {
    const updated = data.cachedJobs.concat(jobs);
    chrome.storage.local.set({ cachedJobs: updated });
  });
}

function fetchJobs(page) {
  chrome.runtime.sendMessage(
    {
      action: 'scrape',
      keyword: currentKeyword,
      page: page,
      delayMs: delayMs,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError.message);
        return;
      }
      if (response.error) {
        console.error('Scrape error:', response.error);
        return;
      }
      const jobs = response.jobs || [];
      if (jobs.length === 0) {
        // No more jobs
        loadMoreBtn.classList.add('hidden');
        return;
      }
      jobs.forEach(renderJob);
      storeResults(jobs);
      // Show Load More button for next page
      loadMoreBtn.classList.remove('hidden');
    }
  );
}

searchBtn.addEventListener('click', () => {
  const kw = keywordInput.value.trim();
  if (!kw) return;
  currentKeyword = kw;
  const d = parseInt(delayInput.value, 10);
  delayMs = isNaN(d) ? 0 : d;
  currentPage = 1;
  clearResults();
  fetchJobs(currentPage);
});

loadMoreBtn.addEventListener('click', () => {
  currentPage += 1;
  fetchJobs(currentPage);
});

// Load cached results on popup open (optional)
chrome.storage.local.get({ cachedJobs: [] }, (data) => {
  const cached = data.cachedJobs;
  if (cached.length > 0) {
    cached.forEach(renderJob);
    loadMoreBtn.classList.remove('hidden');
  }
});
