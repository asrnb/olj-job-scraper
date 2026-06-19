// background.js - Service Worker (Manifest V3)
// Uses regex to parse HTML since DOMParser is NOT available in service workers.

// Open the side panel when the extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "scrape") {
    var keyword = request.keyword || "";
    var page = request.page || 1;
    var delayMs = request.delayMs || 0;

    // The real search URL uses an offset (0, 30, 60, 90...)
    // Page 1 = offset 0, Page 2 = offset 30, etc.
    var offset = (page - 1) * 30;
    var url =
      "https://www.onlinejobs.ph/jobseekers/search/c/" +
      encodeURIComponent(keyword) +
      "/" +
      offset;

    setTimeout(function () {
      fetch(url)
        .then(function (resp) {
          if (!resp.ok) {
            throw new Error("HTTP " + resp.status);
          }
          return resp.text();
        })
        .then(function (html) {
          var jobs = parseJobsFromHTML(html);
          sendResponse({ jobs: jobs });
        })
        .catch(function (err) {
          sendResponse({ error: err.message });
        });
    }, delayMs);

    // Keep message channel open for async sendResponse
    return true;
  }
});

// Parse job listings from the onlinejobs.ph HTML
function parseJobsFromHTML(html) {
  var jobs = [];

  // Each job card is wrapped like:
  //   <!-- Start -->
  //   <a href="/jobseekers/job/SLUG-ID" ...>
  //     <div class="jobpost-cat-box latest-job-post ...">
  //       ...
  //       <h4 class="fs-16 fw-700">JOB TITLE <span ...>Full Time</span></h4>
  //       ...
  //       <em>Posted on DATE</em>
  //       ...
  //       <dd class="col">SALARY</dd>
  //       ...
  //       <div class="desc ...">DESCRIPTION</div>
  //     </div>
  //   </a>
  //   <!-- End -->

  // Split by job card boundaries
  var cards = html.split("<!-- Start -->");

  for (var i = 1; i < cards.length; i++) {
    var card = cards[i];
    var endIdx = card.indexOf("<!-- End -->");
    if (endIdx !== -1) {
      card = card.substring(0, endIdx);
    }

    // Extract link: <a href="/jobseekers/job/SLUG">
    var linkMatch = card.match(/<a\s+href=["']([^"']*\/jobseekers\/job\/[^"']*)["']/i);
    var link = "";
    if (linkMatch) {
      link = linkMatch[1];
      if (link.indexOf("http") !== 0) {
        link = "https://www.onlinejobs.ph" + link;
      }
    }

    // Extract title: <h4 class="fs-16 fw-700">TITLE <span ...>TYPE</span></h4>
    var titleMatch = card.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    var title = "";
    var jobType = "";
    if (titleMatch) {
      // Get job type from <span> badge
      var typeMatch = titleMatch[1].match(/<span[^>]*>(.*?)<\/span>/i);
      if (typeMatch) {
        jobType = typeMatch[1].replace(/<[^>]*>/g, "").trim();
      }
      // Remove all HTML tags to get clean title
      title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
    }

    // Extract date: <em>Posted on DATE</em>
    var dateMatch = card.match(/<em>Posted on\s*(.*?)<\/em>/i);
    var date = "";
    if (dateMatch) {
      date = dateMatch[1].trim();
    }

    // Extract salary: <dd class="col">SALARY</dd>
    var salaryMatch = card.match(/<dd\s+class=["']col["']>([\s\S]*?)<\/dd>/i);
    var salary = "";
    if (salaryMatch) {
      salary = salaryMatch[1].replace(/<[^>]*>/g, "").trim();
    }

    // Extract description: <div class="desc ...">DESCRIPTION</div>
    var descMatch = card.match(/<div\s+class=["']desc[^"']*["']>([\s\S]*?)<\/div>/i);
    var description = "";
    if (descMatch) {
      // Remove HTML tags and "See More" link
      description = descMatch[1]
        .replace(/<a[^>]*>.*?<\/a>/g, "")
        .replace(/<br\s*\/?>/g, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#8230;/g, "...")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Extract employer logo alt text as company name
    var companyMatch = card.match(/<img[^>]+class=["']jobpost-cat-box-logo["'][^>]+alt=["']([^"']*)["']/i);
    var company = "";
    if (companyMatch) {
      company = companyMatch[1].trim();
    }

    if (title && link) {
      jobs.push({
        title: title,
        link: link,
        company: company,
        date: date,
        salary: salary,
        jobType: jobType,
        description: description
      });
    }
  }

  return jobs;
}
