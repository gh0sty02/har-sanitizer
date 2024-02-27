// Inside worker.js
let groups = ["headers", "queryArgs", "cookies", "postParams", "mimeTypes"];

// Listening for messages from the main thread
self.onmessage = function (event) {
  const { wordList, currGroup, type } = event.data.data;

  // Map over currGroup to create a new array with sanitized entries
  const sanitizedGroup = currGroup.map((group) => {
    let requestData = group.request;
    let responseData = group.response;

    if (type === "sanitize") {
      // Sanitize the data
      sanitizeChunk(requestData, wordList);
      sanitizeChunk(responseData, wordList);
    } else if (type === "parse") {
      console.log({ wordList, currGroup, type });
    }

    // Return the sanitized group
    return group;
  });

  // Post the new sanitized group back to the main thread
  self.postMessage(sanitizedGroup);
};

function sanitizeChunk(data, wordList = []) {
  Object.entries(data).forEach(([groupName, groupEntries]) => {
    if (groups.includes(groupName)) {
      groupEntries.forEach((entry) => {
        if (wordList.includes(entry.name)) {
          entry.value = `[${entry.name} redacted]`;
        }
      });
    }
  });
}

function parseChunk(data) {
  const output = {
    headers: new Set(),
    queryArgs: new Set(),
    cookies: new Set(),
    postParams: new Set(),
    mimeTypes: new Set(),
  };
  // console.log({ data, groupName, groupEntries });
  const response = data.response;
  response.headers.map((header) => output.headers.add(header.name));
  response.cookies.map((cookie) => output.cookies.add(cookie.name));
  output.mimeTypes.add(response.content.mimeType);

  const request = data.request;
  request.headers.map((header) => output.headers.add(header.name));
  request.queryString.map((arg) => output.queryArgs.add(arg.name));
  request.cookies.map((cookie) => output.cookies.add(cookie.name));
  if (request.postData) {
    request.postData.params?.map((param) => output.postParams.add(param.name));
  }

  return {
    headers: [...output.headers].sort(),
    queryArgs: [...output.queryArgs].sort(),
    cookies: [...output.cookies].sort(),
    postParams: [...output.postParams].sort(),
    mimeTypes: [...output.mimeTypes].sort(),
  };
}
