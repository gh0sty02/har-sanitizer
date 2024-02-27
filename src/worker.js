// Inside worker.js
let groups = ["headers", "queryArgs", "cookies", "postParams", "mimeTypes"];

// Listening for messages from the main thread
self.onmessage = function (event) {
  const { wordList, currGroup } = event.data.data;

  // Map over currGroup to create a new array with sanitized entries
  const sanitizedGroup = currGroup.map((group) => {
    let requestData = group.request;
    let responseData = group.response;

    // Sanitize the data
    sanitizeChunk(requestData, wordList);
    sanitizeChunk(responseData, wordList);

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
