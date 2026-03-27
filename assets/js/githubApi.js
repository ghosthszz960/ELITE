async function getFile(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ENV.token}`
    }
  });

  const data = await res.json();
  const content = atob(data.content);
  return {
    sha: data.sha,
    data: JSON.parse(content)
  };
}

async function updateFile(url, newData, sha) {
  const content = btoa(JSON.stringify(newData, null, 2));

  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${ENV.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "update database",
      content: content,
      sha: sha
    })
  });
}
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}