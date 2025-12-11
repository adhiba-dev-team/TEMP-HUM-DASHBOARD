// src/utils/dbQueue.js
let isWriting = false;
const queue = [];

export function queueWrite(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

function processQueue() {
  if (isWriting || queue.length === 0) return;

  isWriting = true;
  const { fn, resolve, reject } = queue.shift();

  try {
    const result = fn();
    resolve(result);
  } catch (err) {
    console.error('[DB ERROR]', err.message);
    reject(err);
  } finally {
    isWriting = false;
    process.nextTick(processQueue); // immediately move to next
  }
}
