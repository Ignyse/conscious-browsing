async function getConfig() {
  const { config } = await chrome.storage.local.get("config");
  return config;
}

async function saveConfig(config) {
  await chrome.storage.local.set({ config });
  chrome.runtime.sendMessage({ type: "CONFIG_UPDATED" });
}

async function render() {
  const config = await getConfig();
  const list = document.getElementById("domain-list");
  list.innerHTML = "";

  (config.domains || []).forEach((domain, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${domain}</span><button data-i="${i}" title="Remove">✕</button>`;
    list.appendChild(li);
  });

  list.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const i = parseInt(btn.dataset.i);
      config.domains.splice(i, 1);
      await saveConfig(config);
      render();
    });
  });

  const count = (config.messages || []).length;
  document.getElementById("msg-count").textContent =
    `${count} message${count !== 1 ? "s" : ""} configured`;
}

document.getElementById("add-btn").addEventListener("click", async () => {
  const input = document.getElementById("new-domain");
  const raw = input.value.trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
  if (!raw) return;

  const config = await getConfig();
  if (!config.domains.includes(raw)) {
    config.domains.push(raw);
    await saveConfig(config);
    document.getElementById("status").textContent = `Added ${raw}`;
    setTimeout(() => document.getElementById("status").textContent = "", 1500);
  }
  input.value = "";
  render();
});

document.getElementById("new-domain").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("add-btn").click();
});

render();
