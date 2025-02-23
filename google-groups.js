// copy paste to google groups console page to get groups with members, role and email
(async () => {
  console.clear();

  const parser = new DOMParser();

  const fromUrlToDocument = async (url) => {
    const res = await fetch(url);
    const text = await res.text();

    return parser.parseFromString(text, "text/html");
  };

  const readGroups = async () => {
    console.log("groups scraping: start");

    let groups = {};

    let mainNextPageBtn = document.querySelector(
      'div[aria-label="Vai alla pagina successiva"]',
    );
    let outerCounter = 0;

    // only first 3 pages of groups are enough for me
    while (outerCounter < 4 || outerCounter == 0) {
      let rows = document.querySelectorAll("[data-group-email]");

      for (const row of rows) {
        let groupName = row.dataset.groupName;
        console.log("handling group " + groupName);
        groups[groupName] = {};

        let groupEmail = row.dataset.groupEmail;
        groups[groupName]["email"] = groupEmail;
        groups[groupName]["members"] = [];

        let link = row.querySelector("a").href;
        const doc = await fromUrlToDocument(`${link}/members`);

        let nextPageBtn = doc.querySelector(
          'div[aria-label="Vai alla pagina successiva"]',
        );
        let counter = 0;
        while (counter < 4 || counter == 0) {
          let membersRows = doc.querySelectorAll("[data-member-name]");

          for (member of membersRows) {
            let name = member.dataset.memberName;
            let email = member.dataset.memberEmail;
            let tdRole = Array.from(member.querySelectorAll("td"))[3];
            let roleDiv = tdRole.querySelector("div[aria-selected=true]");
            if (roleDiv === null) {
              continue;
            }
            let role = roleDiv.dataset.value;

            groups[groupName]["members"].push({
              name: name,
              email: email,
              role: role,
            });
          }
          if (nextPageBtn.ariaDisabled == "false") {
            nextPageBtn.click();
            console.log("handling new members page...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            nextPageBtn = doc.querySelector(
              'div[aria-label="Vai alla pagina successiva"]',
            );
          } else {
            break;
          }
          counter += 1;
        }
      }
      if (mainNextPageBtn.ariaDisabled == "true") {
        break;
      }
      mainNextPageBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 5000));
      mainNextPageBtn = document.querySelector(
        'div[aria-label="Vai alla pagina successiva"]',
      );
      outerCounter += 1;
    }
    // console log json file
    console.log(groups);
  };

  readGroups().await;
})();
