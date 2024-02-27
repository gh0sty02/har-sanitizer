// Inside worker.js
let groups = ["headers", "queryArgs", "cookies", "postParams", "mimeTypes"];
// Listening for messages from the main thread
self.onmessage = function (event) {
  let {
    chunk: { type, data },
    wordList,
  } = event.data;

  sanitizeChunk(data, wordList);

  self.postMessage({ type, data });
};

function sanitizeChunk(data, wordList) {
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
