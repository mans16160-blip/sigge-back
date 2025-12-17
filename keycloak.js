const session = require("express-session");
const Keycloak = require("keycloak-connect");

const memoryStore = new session.MemoryStore();

const keycloak = new Keycloak({ store: memoryStore });

module.exports = { keycloak, memoryStore };
