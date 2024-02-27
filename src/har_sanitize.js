import { createArrayChunks, createWorker } from "./utils.js";

const defaultMimeTypesList = ["application/javascript", "text/javascript"];
const TOTAL_WORKERS = 12;

const defaultWordList = [
  "Authorization",
  "SAMLRequest",
  "SAMLResponse",
  "access_token",
  "appID",
  "assertion",
  "auth",
  "authenticity_token",
  "challenge",
  "client_id",
  "client_secret",
  "code",
  "code_challenge",
  "code_verifier",
  "email",
  "facetID",
  "fcParams",
  "id_token",
  "password",
  "refresh_token",
  "serverData",
  "shdf",
  "state",
  "token",
  "usg",
  "vses2",
  "x-client-data",
];

export const defaultScrubItems = [...defaultMimeTypesList, ...defaultWordList];

function removeContentForMimeTypes(input, scrubList) {
  const harJSON = JSON.parse(input);

  const entries = harJSON.log.entries;
  if (!entries) {
    throw new Error("failed to find entries in HAR file");
  }

  for (const entry of entries) {
    const response = entry.response;
    if (response && scrubList.includes(response.content.mimeType)) {
      response.content.text = `[${response.content.mimeType} redacted]`;
    }
  }

  return JSON.stringify(harJSON, null, 2);
}

export function getHarInfo(input) {
  const output = {
    headers: new Set(),
    queryArgs: new Set(),
    cookies: new Set(),
    postParams: new Set(),
    mimeTypes: new Set(),
  };
  const harJSON = JSON.parse(input);

  const entries = harJSON.log.entries;
  if (!entries) {
    throw new Error("failed to find entries in HAR file");
  }

  for (const entry of entries) {
    const response = entry.response;

    response.headers.map((header) => output.headers.add(header.name));

    response.cookies.map((cookie) => output.cookies.add(cookie.name));
    output.mimeTypes.add(response.content.mimeType);

    const request = entry.request;
    request.headers.map((header) => output.headers.add(header.name));
    request.queryString.map((arg) => output.queryArgs.add(arg.name));
    request.cookies.map((cookie) => output.cookies.add(cookie.name));
    if (request.postData) {
      request.postData.params?.map((param) =>
        output.postParams.add(param.name)
      );
    }
  }

  return {
    headers: [...output.headers].sort(),
    queryArgs: [...output.queryArgs].sort(),
    cookies: [...output.cookies].sort(),
    postParams: [...output.postParams].sort(),
    mimeTypes: [...output.mimeTypes].sort(),
  };
}

function getScrubMimeTypes(options = {}, possibleScrubItems = {}) {
  if (options?.allMimeTypes && !!possibleScrubItems) {
    return possibleScrubItems.mimeTypes;
  }
  return options?.scrubMimetypes || defaultMimeTypesList;
}

function getScrubWords(options = {}, possibleScrubItems = {}) {
  let scrubWords = options?.scrubWords || [];
  if (options?.allCookies && !!possibleScrubItems) {
    scrubWords = scrubWords.concat(possibleScrubItems.cookies);
  }
  if (options?.allHeaders && !!possibleScrubItems) {
    scrubWords = scrubWords.concat(possibleScrubItems.headers);
  }
  if (options?.allQueryArgs && !!possibleScrubItems) {
    scrubWords = scrubWords.concat(possibleScrubItems.queryArgs);
  }
  if (options?.allPostParams && !!possibleScrubItems) {
    scrubWords = scrubWords.concat(possibleScrubItems.postParams);
  }

  return scrubWords || defaultScrubItems;
}

export async function sanitize(input, secondTry, options = {}) {
  let possibleScrubItems;

  // Remove specific mime responses first
  input = removeContentForMimeTypes(
    input,
    getScrubMimeTypes(options, possibleScrubItems)
  );

  // trim the list of words we are looking for down to the ones actually in the HAR file
  const wordList = getScrubWords(options, possibleScrubItems).filter((val) =>
    input.includes(val)
  );

  // parse the raw input into json
  let jsonObj = JSON.parse(input);

  // create chunks of entries array in logs(this is where all of the har data is present)
  let groups = createArrayChunks(jsonObj.log.entries, TOTAL_WORKERS);

  let workers = [];

  for (let i = 0; i < TOTAL_WORKERS; i++) {
    workers.push(createWorker());
  }

  // clear the entries array so we can add the sanitized entry objects
  jsonObj.log.entries = [];

  // wait for all of the workers to finish their sanitization process
  let promises = groups.map((currGroup, index) => {
    return new Promise((resolve, reject) => {
      const worker = workers[index];
      worker.postMessage({ data: { wordList, currGroup, type: "sanitize" } });

      worker.onmessage = function (event) {
        jsonObj.log.entries.push(...event.data);
        resolve(); // Resolve the promise when the worker has finished processing
        worker.terminate();
      };

      worker.onerror = function (error) {
        reject(error); // Reject the promise if there is an error
        worker.terminate();
      };
    });
  });

  // Wait for all promises to resolve before returning the JSON object
  return Promise.all(promises).then(() => {
    return jsonObj;
  });
}
