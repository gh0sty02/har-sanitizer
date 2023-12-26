import {
  generateCheckboxHtml,
  downloadFile,
  getScrubbableItems,
  getSanitizedHar,
  hideError,
  showError,
} from "./utils.js";

// selectors
const downloadFileButton = document.querySelector("#download");
const scrubChooserContainer = document.querySelector("#scrub-items_container");
const input = document.querySelector("#har-input");
const innerContainer = document.querySelector("#inner-container");

// global variables to store states
let file = {};
let defaultScrubState = {
  cookies: {},
  headers: {},
  queryArgs: {},
  postParams: {},
  mimeTypes: {},
};
let scrubItems = {
  cookies: {},
  headers: {},
  queryArgs: {},
  postParams: {},
  mimeTypes: {},
};

function convertToObjectArray(input) {
  const resultArray = [];

  for (const key in input) {
    if (input.hasOwnProperty(key)) {
      const entry = {};
      entry[key] = input[key];
      resultArray.push(entry);
    }
  }

  return resultArray;
}

// firstly the scrubs are divided into separate objects ie {cookies : {}, headers : {}} is converted into [{cookies : {}}, {headers : {}}]
// this is because when all of the scrubs are given at once for removal, the process fails due to unknown reasons,
// the a loop runs for each of these scrubs, if the loop is running for the first time, file.raw is passed as we want to parse the file.raw
// we try if the regex given by fn buildRegex1 works, if no we try buildRegex2, if it does work, we assign the raw sanitized input returned by
// getSanitizedHar to a global sanitizedHar variable. The loops iterates over all other groups and sanitizes the input iteratively, so each group data
// is removed from the raw input and then the data is sent to create a file, which gets downloaded
input.addEventListener("change", (e) => {
  // resetting previous file and scrub items data
  file = {};
  scrubItems = defaultScrubState;
  hideError();

  innerContainer.style["display"] = "flex";
  handleFileChange(e.target.files[0]);
});

downloadFileButton.addEventListener("click", (e) => {
  const newName = `redacted_${file.name}`;
  const groups = convertToObjectArray(scrubItems);
  let sanitizedHar;
  let firstIteration = true;

  groups.forEach((group) => {
    if (group.length == 0) return;
    try {
      sanitizedHar = getSanitizedHar(
        firstIteration ? file.raw : sanitizedHar,
        group,
        false
      );
      JSON.parse(sanitizedHar);
      hideError();
    } catch (e) {
      try {
        sanitizedHar = getSanitizedHar(
          firstIteration ? file.raw : sanitizedHar,
          group,
          true
        );
        JSON.parse(sanitizedHar);
        hideError();
      } catch (e) {
        showError(e);
      }
    }
    firstIteration = false;
  });

  JSON.parse(sanitizedHar);
  downloadFile(sanitizedHar, newName);
});

function handleFileChange(selectedFile) {
  if (selectedFile) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileContents = e?.target?.result;

        if (
          fileContents &&
          (typeof fileContents === "string" || fileContents instanceof String)
        ) {
          file = {
            raw: fileContents,
            name: selectedFile.name,
            parsed: JSON.parse(fileContents),
          };

          // get scrub items from har file
          scrubItems = getScrubbableItems(file?.raw, defaultScrubState);
          // generate html for check boxes
          let scrubCheckboxHtml = generateCheckboxHtml(scrubItems);
          scrubChooserContainer.innerHTML = scrubCheckboxHtml;

          // select and add listeners to checkboxes (these handle cascaded checkbox tree as well as the scrub data)
          const checkBoxContainers = document.querySelectorAll(".checkboxTree");

          checkBoxContainers.forEach((container) => {
            const type = container.getAttribute("data-type");
            addListenerToCheckBoxes(type);
          });

          return;
        }
        throw new Error("failed to upload file");
      } catch (e) {
        console.log("errr", e);
      }
    };

    reader.readAsText(selectedFile);
  }
}

function addListenerToCheckBoxes(type) {
  let parentCheckbox = document.getElementById(type);
  let childCheckboxes = document.querySelectorAll(`.${type}-childCheckbox`);

  parentCheckbox.addEventListener("change", function () {
    childCheckboxes.forEach(function (childCheckbox) {
      // Update the checked state of childCheckbox
      childCheckbox.checked = parentCheckbox.checked;

      // get the type of data and actual name of the key to be edited in scrubItems
      const type = childCheckbox.getAttribute("data-type");
      const name = childCheckbox.getAttribute("data-name");

      let newVal = parentCheckbox.checked;

      // create copy of the obj to be edited, edit it and then assign it to the respective type
      // we need to set the value of all child checkboxes (ie scrub items same as the parent as when parent is ticked, all of the children are ticked)
      const newScrubItems = { ...scrubItems };
      const newTypeItems = { ...newScrubItems[type] };
      newTypeItems[name] = newVal;
      newScrubItems[type] = newTypeItems;

      // set the edited scrub items to the global state
      scrubItems = newScrubItems;
    });
  });

  // Add event listener to child checkboxes to update parent checkbox
  childCheckboxes.forEach(function (childCheckbox) {
    childCheckbox.addEventListener("change", function (e) {
      const type = e.target.getAttribute("data-type");
      const name = e.target.getAttribute("data-name");

      let newVal = e.target.checked;

      const newScrubItems = { ...scrubItems };
      const newTypeItems = { ...newScrubItems[type] };
      newTypeItems[name] = newVal;
      newScrubItems[type] = newTypeItems;

      scrubItems = newScrubItems;

      // change "checked" property of parent to checked iff all of the children are checked and vice versa
      parentCheckbox.checked = Array.from(childCheckboxes).every(function (
        checkbox
      ) {
        return checkbox.checked;
      });
    });
  });
}
