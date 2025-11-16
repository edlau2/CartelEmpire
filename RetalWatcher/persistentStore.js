const fs = require("fs");
const path = require("path");

const storePath = path.resolve(__dirname, "persistent.json");

function loadStore() {
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Could not load persistent.json — using defaults.", err);
    return {
        "lastMemberUpdate": null,
        "lastCreated": null,
        "cartelMembers": {},
        "cachedUsers": {},
        "cartelIds": {},
        };
    }
}

function saveStore(storeObj) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(storeObj, null, 2));
  } catch (err) {
    console.error("Could not save persistent.json:", err);
  }
}

module.exports = { loadStore, saveStore };
