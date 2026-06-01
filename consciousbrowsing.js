// edit domains and messages here
const DEFAULT_CONFIG = {
  domains: [
    "youtube.com",
    "twitter.com",
    "reddit.com",
    "instagram.com"
  ],
  messages: [
    {
      title: "Hey. Stop.",
      body: "You opened this out of habit, not intention. What were you actually supposed to be doing right now? Close this and go do that."
    },
    {
      title: "Future you is watching.",
      body: "Every hour here is an hour you're borrowing from the version of yourself you want to become. Is this scroll worth it?"
    },
    {
      title: "You have 3 hours of deep work left today.",
      body: "This is a distraction. You know it. You've been here before and regretted it. The work is waiting. You'll feel better after."
    }
  ]
};


// initialize storage with defaults
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get("config");
  if (!existing.config) {
    await chrome.storage.local.set({ config: DEFAULT_CONFIG });
  }
  await updateRules();
});

// listen for config changes from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "CONFIG_UPDATED") updateRules();
});


async function updateRules() {
  const { config } = await chrome.storage.local.get("config");
  const domains = config?.domains ?? [];

  // remove all existing rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);

  const intermediateUrl = chrome.runtime.getURL("intermediate.html");

  const newRules = domains.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        transform: {
          scheme: "chrome-extension",
          host: chrome.runtime.id,
          pathname: "/intermediate.html",
          // encode original URL as query param
        }
      }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame"]
    }
  }));

  // Use tabs API instead (declarativeNetRequest can't easily pass original URL)
  // We'll intercept via webNavigation alternative: content script approach
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: []
  });

  // Store domains for the tabs-based approach
  await chrome.storage.local.set({ activeDomains: domains });
}

// Tab-based interception — fires before page loads
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" || !tab.url) return;

  // Skip the interstitial itself to avoid redirect loops
  if (tab.url.startsWith(chrome.runtime.getURL(""))) return;
  // Skip chrome:// and extension pages
  if (!tab.url.startsWith("http")) return;

  const { activeDomains, config, bypassed } = await chrome.storage.local.get([
    "activeDomains", "config", "bypassed"
  ]);

  const domains = activeDomains ?? config?.domains ?? [];
  if (!domains.length) return;

  let hostname;
  try {
    hostname = new URL(tab.url).hostname.replace(/^www\./, "");
  } catch { return; }

  const matched = domains.find(d => hostname === d || hostname.endsWith("." + d));
  if (!matched) return;

  // Check bypass token — user clicked "Continue" for this tab session
  const bypassKey = `${tabId}:${matched}`;
  if (bypassed?.[bypassKey]) return;

  // Pick a random message
  const messages = config?.messages ?? DEFAULT_CONFIG.messages;
  const msg = messages[Math.floor(Math.random() * messages.length)];

  const encoded = encodeURIComponent(JSON.stringify({
    title: msg.title,
    body: msg.body,
    destination: tab.url,
    domain: matched,
    tabId
  }));

  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`intermediate.html?data=${encoded}`)
  });
});

// listen for bypass from intermediate [continue button pressed]
// saves that on this tab it bypasses the domain
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "BYPASS") {
    const { bypassed = {} } = await chrome.storage.local.get("bypassed");
    bypassed[`${msg.tabId}:${msg.domain}`] = true;
    await chrome.storage.local.set({ bypassed });
    chrome.tabs.update(msg.tabId, { url: msg.destination });
  }

  if (msg.type === "CONFIG_UPDATED") updateRules();
});
