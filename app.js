const API_BASE = 'https://tt1m9g7vrf.execute-api.ap-south-1.amazonaws.com/prod';
const output = document.getElementById('output');

function logOutput(data) {
  output.innerHTML = "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
}

async function getPresignedUrl(fileName) {
  const res = await fetch(`${API_BASE}/get-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: fileName, action: 'put' })
  });
  const data = await res.json();
  return data.url;
}

async function uploadToS3(url, file) {
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
}

async function handleUpload() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert('Choose a file!');

  const url = await getPresignedUrl(file.name);
  const uploadRes = await uploadToS3(url, file);

  if (uploadRes.ok) {
    const dbRes = await fetch(`${API_BASE}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name })
    });
    const result = await dbRes.json();
    logOutput({ message: 'Uploaded and unlocked', result });
  } else {
    const errorText = await uploadRes.text();
    logOutput({ error: 'Upload failed', detail: errorText });
  }
}

async function lockFile() {
  const fileId = document.getElementById('lockFileId').value;
  const res = await fetch(`${API_BASE}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: fileId, user: "web-user" })
  });
  const data = await res.json();
  logOutput(data);
}

async function unlockFile() {
  const fileId = document.getElementById('unlockFileId').value;
  const res = await fetch(`${API_BASE}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: fileId })
  });
  const data = await res.json();
  logOutput(data);
}

async function listItems() {
  const res = await fetch(`${API_BASE}/list`);
  const data = await res.json();
  if (Array.isArray(data)) {
    let html = '<h3>Files:</h3><ul>';
    for (const item of data) {
      html += `<li><strong>${item.filename}</strong> - ${item.status === 'locked' ? '🔒 Locked' : '🔓 Unlocked'}</li>`;
    }
    html += '</ul>';
    output.innerHTML = html;
  } else {
    logOutput(data);
  }
}

async function getLockStatus() {
  const res = await fetch(`${API_BASE}/status`);
  const data = await res.json();
  logOutput(data);
}
