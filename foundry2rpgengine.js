Hooks.once("ready", () => {
    console.log("foundry2rpgengine | Initializing Foundry 2 Rpg Engine");
    Hooks.on("preCreateChatMessage", processRolls);
});
async function processRolls(msg) {
    let isRoll;
    let rawformula = msg.rolls[0]._formula;
    let formula = rawformula.toString().replace(/[{}]/g, "");
    formula = formula.toString().replace(/\[.*?\]/g, "");
    if (msg.isRoll) {
        fetch('http://localhost:8001/TheRpgEngine/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: formula,
            mode: 'no-cors'
        })
    }
}
