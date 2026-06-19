// sidepanel.js
var currentPage = 1;
var currentKeyword = "";
var delayMs = 500;

var keywordInput = document.getElementById("keyword");
var delayInput = document.getElementById("delay");
var searchBtn = document.getElementById("searchBtn");
var loadMoreBtn = document.getElementById("loadMoreBtn");
var clearCacheBtn = document.getElementById("clearCacheBtn");
var resultsDiv = document.getElementById("results");
var resultCount = document.getElementById("resultCount");
var jobCount = 0;

function renderJob(job) {
  var card = document.createElement("div");
  card.className = "job-card";

  // Title link
  var title = document.createElement("a");
  title.className = "job-title";
  title.href = job.link;
  title.target = "_blank";
  title.textContent = job.title;
  card.appendChild(title);

  // Meta row: badge + company
  var meta = document.createElement("div");
  meta.className = "job-meta";

  if (job.jobType) {
    var badge = document.createElement("span");
    badge.className = "job-badge";
    var typeLC = job.jobType.toLowerCase();
    if (typeLC.indexOf("full") !== -1) {
      badge.classList.add("full-time");
    } else if (typeLC.indexOf("part") !== -1) {
      badge.classList.add("part-time");
    } else {
      badge.classList.add("gig");
    }
    badge.textContent = job.jobType;
    meta.appendChild(badge);
  }

  if (job.company) {
    var company = document.createElement("span");
    company.className = "job-company";
    company.textContent = job.company;
    meta.appendChild(company);
  }

  card.appendChild(meta);

  // Salary
  if (job.salary) {
    var salary = document.createElement("div");
    salary.className = "job-salary";
    salary.textContent = job.salary;
    card.appendChild(salary);
  }

  // Date
  if (job.date) {
    var date = document.createElement("div");
    date.className = "job-date";
    date.textContent = "Posted: " + job.date;
    card.appendChild(date);
  }

  // Description
  if (job.description) {
    var desc = document.createElement("div");
    desc.className = "job-description";
    desc.textContent = job.description;
    card.appendChild(desc);
  }

  resultsDiv.appendChild(card);
}

function clearResults() {
  resultsDiv.innerHTML = "";
  loadMoreBtn.classList.add("hidden");
  resultCount.classList.add("hidden");
  jobCount = 0;
}

function updateCount(added) {
  jobCount = jobCount + added;
  resultCount.textContent = jobCount + " jobs loaded";
  resultCount.classList.remove("hidden");
}

function showStatus(msg, loading) {
  var html = '<div class="status-msg">';
  if (loading) {
    html += '<div class="spinner"></div><br>';
  }
  html += msg + "</div>";
  resultsDiv.innerHTML = html;
}

function storeResults(jobs) {
  chrome.storage.local.get({ cachedJobs: [] }, function (data) {
    var updated = data.cachedJobs.concat(jobs);
    chrome.storage.local.set({ cachedJobs: updated });
  });
}

function fetchJobs(page) {
  if (page === 1) {
    showStatus("Searching for jobs...", true);
  } else {
    loadMoreBtn.textContent = "Loading...";
    loadMoreBtn.disabled = true;
  }

  chrome.runtime.sendMessage(
    {
      action: "scrape",
      keyword: currentKeyword,
      page: page,
      delayMs: delayMs
    },
    function (response) {
      // Reset button state
      loadMoreBtn.textContent = "Load More Jobs";
      loadMoreBtn.disabled = false;

      if (chrome.runtime.lastError) {
        showStatus("Error: " + chrome.runtime.lastError.message, false);
        return;
      }
      if (!response) {
        showStatus(
          "No response from background script.<br>Try reloading the extension.",
          false
        );
        return;
      }
      if (response.error) {
        showStatus("Scrape error: " + response.error, false);
        return;
      }

      var jobs = response.jobs || [];
      if (jobs.length === 0) {
        if (page === 1) {
          showStatus("No jobs found for &ldquo;" + currentKeyword + "&rdquo;", false);
        } else {
          loadMoreBtn.classList.add("hidden");
        }
        return;
      }

      // Clear status on first page
      if (page === 1) {
        resultsDiv.innerHTML = "";
      }

      for (var i = 0; i < jobs.length; i++) {
        renderJob(jobs[i]);
      }
      updateCount(jobs.length);
      storeResults(jobs);
      loadMoreBtn.classList.remove("hidden");
    }
  );
}

// Search button
searchBtn.addEventListener("click", function () {
  var kw = keywordInput.value.trim();
  if (!kw) return;
  currentKeyword = kw;
  var d = parseInt(delayInput.value, 10);
  delayMs = isNaN(d) ? 0 : d;
  currentPage = 1;
  chrome.storage.local.set({ cachedJobs: [] });
  clearResults();
  fetchJobs(currentPage);
});

// Enter key triggers search
keywordInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

// Load More
loadMoreBtn.addEventListener("click", function () {
  currentPage = currentPage + 1;
  fetchJobs(currentPage);
});

// Clear Cache
clearCacheBtn.addEventListener("click", function () {
  chrome.storage.local.set({ cachedJobs: [] });
  clearResults();
  resultsDiv.innerHTML =
    '<div class="status-msg">Cache cleared. Enter a keyword to search.</div>';
});

// Load cached results on side panel open
chrome.storage.local.get({ cachedJobs: [] }, function (data) {
  var cached = data.cachedJobs;
  if (cached.length > 0) {
    for (var i = 0; i < cached.length; i++) {
      renderJob(cached[i]);
    }
    updateCount(cached.length);
    loadMoreBtn.classList.remove("hidden");
  } else {
    resultsDiv.innerHTML =
      '<div class="status-msg">Enter a keyword to search OnlineJobs.ph</div>';
  }
});
