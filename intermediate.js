const params = new URLSearchParams(location.search);
let data = {};
try {
    data = JSON.parse(decodeURIComponent(params.get("data") || "{}"));
} catch (e) {}

document.getElementById("msg-title").textContent = data.title || "Hey. Stop.";
document.getElementById("msg-body").textContent = data.body || "You opened this out of habit. Is this intentional?";
document.getElementById("domain-pill").textContent = data.domain || "";

document.getElementById("btn-close").addEventListener("click", () => {
    history.back();
});

document.getElementById("btn-continue").addEventListener("click", () => {
    console.log(data)
    if (!data.destination) return;
    chrome.runtime.sendMessage({
    type: "BYPASS",
    tabId: data.tabId,
    domain: data.domain,
    destination: data.destination
    });
});