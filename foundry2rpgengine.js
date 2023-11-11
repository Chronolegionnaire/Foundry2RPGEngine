import { process as preCreateChatMessage } from "./preCreateChatMessage";

Hooks.once("ready", () => {
    console.log("foundry2rpgengine | Initializing Foundry 2 Rpg Engine");
    system = game.system.id;
    loadHooks();
});

function loadHooks() {
    Hooks.on("preCreateChatMessage", preCreateChatMessage);
}
