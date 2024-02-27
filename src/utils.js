import { sanitize, defaultScrubItems, getHarInfo } from "./har_sanitize.js";

const errorContainer = document.querySelector("#error-container");

export function generateCheckboxHtml(scrubItems) {
  let html = "";

  Object.keys(scrubItems).forEach((type) => {
    if (Object.keys(scrubItems[type]).length > 0) {
      html += `<div class="checkboxTree" data-type=${type}>
      <ul>
      <li>
      <input type="checkbox" id="${type}" class="${type}-parentCheckbox parentCheckbox">
      <label for="${type}" class="parentLabel">${type}</label>
      <ul>`;

      html += `<ul class="${type}-select-all inner-ul" id="${type}-sub">`;
      Object.keys(scrubItems[type]).forEach((val) => {
        html += ` <li>
        <label class="childLabel" for="${val}">
        <input type="checkbox" id="${val}" data-type=${type} data-name=${val} class="${type}-childCheckbox childCheckbox">
        <code>${val}</code>
        </label>
        </li>`;
      });

      html += "</ul></li></ul></div>";
    }
  });

  return html;
}
export function downloadFile(harOutput, name) {
  const blob = new Blob([harOutput], { type: "application/json" });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create an anchor element to trigger the download
  const a = document.createElement("a");

  a.href = url;
  // Set file name
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Clean up by removing the anchor and revoking the URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export const getSanitizedHar = (input, scrubItems, secondTry = false) => {
  const words = new Set();

  if (scrubItems.cookies) {
    Object.entries(scrubItems.cookies).map(([key, val]) => {
      if (val) words.add(key);
    });
  }
  if (scrubItems.headers) {
    Object.entries(scrubItems.headers).map(([key, val]) => {
      if (val) words.add(key);
    });
  }

  if (scrubItems.queryArgs) {
    Object.entries(scrubItems.queryArgs).map(([key, val]) => {
      if (val) words.add(key);
    });
  }

  if (scrubItems.postParams) {
    Object.entries(scrubItems.postParams).map(([key, val]) => {
      if (val) words.add(key);
    });
  }

  const mimeTypes = new Set();
  if (scrubItems.mimeTypes) {
    Object.entries(scrubItems.mimeTypes).map(([key, val]) => {
      if (val) mimeTypes.add(key);
    });
  }

  return sanitize(input, secondTry, {
    scrubWords: [...words],
    scrubMimetypes: [...mimeTypes],
  });
};
export function getScrubbableItems(input, defaulScrubState) {
  const rawItems = getHarInfo(input);
  const output = { ...defaulScrubState };
  Object.entries(rawItems).map(([key, items]) => {
    output[key] = items.reduce((acc, curr) => {
      if (!curr) return acc;
      acc[curr] = defaultScrubItems.includes(curr);
      return acc;
    }, {});
  });
  return output;
}
export function showError(error) {
  errorContainer.classList.add("show");
  errorContainer.textContent = error;
}
export function hideError() {
  errorContainer.classList.remove("show");
  errorContainer.textContent = "";
}
export function createWorker() {
  return new Worker("./src/worker.js");
}
export function createArrayChunks(array, numChunks) {
  const chunkSize = Math.ceil(array.length / numChunks);
  const chunks = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
}
