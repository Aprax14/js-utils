(async () => {
  // ======================= UPDATE THE FOLLOWING VARIABLES ======================== //

  const dateLimit = new Date("2025-01-01 00:00:00");
  const username = "Damiano";
  const urlEnding =
    "/-/merge_requests/?sort=created_date&state=merged&first_page_size=20";
  let mailInitialContent = `...`;

  // ================================= SCRIPT ====================================== //

  // go to next page of the merge requests
  const nextPage = async (repoPage) => {
    const nextBtn = repoPage.querySelector('button[data-testid="nextButton"]');
    if (nextBtn) {
      nextBtn.click();
    } else {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return false;
  };

  // convert merge request stored to email body text
  const makeMail = (mergeRequests, repoName) => {
    let mailContent = `${repoName}: \n`;

    mergeRequests.forEach((merge) => {
      // gmail doesn't like \t so i use 4xspace
      mailContent +=
        "    • " + merge.text + " (" + merge.date + ") " + merge.link + "\n";
    });

    return mailContent;
  };

  // save all the merged merge requests from the page
  const getMergeRequests = async (repoUrl) => {
    let pageNumber = 0;
    let mergeRequests = [];
    let shouldStop = false;

    const iframe = document.createElement("iframe");
    iframe.src = repoUrl;
    iframe.style.width = "100%";
    iframe.style.height = "800px";
    document.body.appendChild(iframe);

    // using iframes becacause the DOMParser does not have the content loaded by javascript
    const repoPage = await new Promise((resolve) => {
      iframe.onload = () => resolve(iframe.contentDocument);
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    while (pageNumber < 10 && !shouldStop) {
      const list = repoPage.querySelector(
        ".content-list.issuable-list.issues-list",
      );
      if (list === null) {
        return mergeRequests;
      }

      const listElements = Array.from(
        list.querySelectorAll("li.merge-request"),
      ).filter((el) => {
        const author = el.querySelector("a.author-link");
        return author.dataset.username.includes(username);
      });

      for (const el of listElements) {
        const link = el.querySelector(".issue-title-text");
        const createdAt = el.querySelector(
          'span[data-testid="issuable-created-at"]',
        ).title;
        const date = new Date(createdAt.replace(" at", ""));

        if (date < dateLimit) {
          shouldStop = true;
          break;
        }
        let [dateText, _] = date.toLocaleString("it").split(", ");
        mergeRequests.push({
          link: link.href,
          text: link.innerHTML.replace("<!---->", "").trim(),
          date: dateText,
        });
      }

      pageNumber += 1;
      shouldStop |= await nextPage(repoPage);

      if (shouldStop) break;
    }

    return mergeRequests;
  };
  
  // select all the available Repos and run the functions above
  const reposNodes = document.querySelectorAll("a.js-prefetch-document");
  const mailbodyPieces = await Promise.all(
    Array.from(reposNodes).map(async (repoLink) => {
      console.log(repoLink.href);
      const repoName = repoLink.href.split("/")[4];

      const url = repoLink.href + urlEnding;
      const mergeRequests = await getMergeRequests(url);
      if (mergeRequests.length >= 1) {
        return makeMail(mergeRequests, repoName);
      } else {
        return "";
      }
    }),
  );

  mailInitialContent += mailbodyPieces.join("");

  console.log(mailInitialContent);
})();
