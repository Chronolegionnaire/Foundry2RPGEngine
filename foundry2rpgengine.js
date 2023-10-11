Hooks.once("ready", () => {
    console.log("foundry2rpgengine | Initializing Foundry 2 Rpg Engine");
    {
        Hooks.on("preCreateChatMessage", (msg) => {
            processRolls(msg);
        });
    }
});



    Hooks.once("init", () => {
        game.settings.register("foundry2rpgengine", "rollFoundry", {
            name: "Where to roll dice:",
            scope: "client",
            config: true,
            default: 1,
            type: Number,
            choices: {
                0: "RPG Engine",
                1: "Foundry",
                2: "Both"
            }
        });
    });

    function parseFlavorText(flavor) {
        if (flavor.indexOf("<") > -1) {
            flavor = flavor.match(/>(.+?)</)[1];
            flavor = flavor.replace(/:/g, "");
        }
        return encodeURI(flavor);
    }

    function parseRollFormula(formula) {
        if (formula.indexOf("*") > -1) {
            return "(" + addMods(formula) + ")*";
        }
        if (formula.indexOf("/") > -1) {
            return "(" + addMods(formula) + ")/";
        }
        if (!formula.match(/\d*d\d+/)) {
            return "nodice";
        }
        if (formula.indexOf("2d20k") > -1) {
            formula = formula.replace(/^2/, "1");
            formula = addMods(formula);
            return formula + "/" + formula;
        }
        return addMods(formula);
    }

    function addMods(formula) {
        formula = formula.replace(/[,]/g, "+");
        formula = formula.replace(/[{} ]/g, "");
        const dice = Array.from(formula.matchAll(/(\d*d\d+)/g), i => i[0]);
        const mods = Array.from(formula.matchAll(/([+-]\d+)(?!d)/g), i => i[0]).reduce((a, b) => a + parseInt(b), 0);
        return dice.join("+") + (mods >= 0 ? "+" : "") + mods;
    }

    async function processRolls(msg) {
        let flavor;
        let formula;
        let isRoll;

        if (parseFloat(game.version) >= 9 || parseFloat(game.data.version) >= 0.8) {
            if (msg.isRoll) {
                flavor = msg.roll.options.flavor ? parseFlavorText(msg.roll.options.flavor) : "dice";
                formula = parseRollFormula(msg.roll.formula);
                isRoll = msg.isRoll;
            }
        } else {
            if (msg.roll) {
                flavor = msg.flavor ? parseFlavorText(msg.flavor) : "dice";
                formula = parseRollFormula(JSON.parse(msg.roll).formula);
                isRoll = msg.roll ? true : false;
            }
        }

        if (isRoll && game.settings.get("foundry2rpgengine", "rollFoundry") !== 1) {
            if (formula == "nodice") {
                console.log("Foundry2RPGEngine | No dice roll found.");
            } else {
                window.open("localhost:8001/TheRpgEngine/roll/" + flavor + ":" + formula);
                if (game.settings.get("RPG Engine", "rollFoundry") == 0) {
                    return false;
                }
            }
        } else {
            console.log("Foundry2RPGEngine | No dice roll found.");
        }
    }
