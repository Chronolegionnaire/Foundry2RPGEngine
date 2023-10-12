// When Foundry VTT is fully initialized, set up our module
Hooks.once("ready", () => {
    console.log("foundry2rpgengine | Initializing Foundry 2 Rpg Engine");
    Hooks.on("preCreateChatMessage", processRolls);
});

// When Foundry VTT is initializing, set up module settings
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

// Process rolls from the chat messages to check how to handle them
async function processRolls(msg) {
    let flavor;
    let formula;
    let isRoll;

    // Version check to handle different data structures
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
            isRoll = !!msg.roll;
        }
    }

    // Handle the roll based on module settings and whether it's a valid roll
    if (isRoll && game.settings.get("foundry2rpgengine", "rollFoundry") !== 1) {
        if (formula == "nodice") {
            console.log("Foundry2RPGEngine | No dice roll found.");
        } else {
            window.open("http://localhost:8001/TheRpgEngine/roll/" + flavor + ":" + formula);
            if (game.settings.get("foundry2rpgengine", "rollFoundry") == 0) {


                return false;
            }
        }
    } else {
        console.log("Foundry2RPGEngine | No dice roll found.");
    }
}

// Parse flavor text to ensure it's URL-friendly
function parseFlavorText(flavor) {
    if (flavor.indexOf("<") > -1) {
        flavor = flavor.match(/>(.+?)</)[1];
        flavor = flavor.replace(/:/g, "");
    }
    return encodeURI(flavor);
}

// Parse dice roll formula to make it compatible with our RPG engine
function parseRollFormula(formula) {
    // Handling for dice being subtracted
    let finalFormula = addMods(formula);
    finalFormula = finalFormula.replace(/(\+-)/g, "-");

    // Handle multiplication and division in the formula
    let multiDivi = handleMultiplicationAndDivision(formula, finalFormula);
    if (multiDivi) return multiDivi;

    if (!formula.match(/\d*d\d+/)) return "nodice";
    if (formula.indexOf("2d20k") > -1) {
        formula = formula.replace(/^2/, "1");
        formula = addMods(formula);
        return formula + "/" + formula;
    }
    return addMods(finalFormula);
}

// Helper function for parsing multiplication and division in formulas
function handleMultiplicationAndDivision(formula, finalFormula) {
    if (formula.indexOf("*") > -1 || formula.indexOf("/") > -1) {
        let multiDivi = formula;
        multiDivi = multiDivi.replace(/[{} ]/g, "");
        multiDivi = multiDivi.match(/([\*\/]\d+)(?!d)|(^\d*[\*\/])/g);
        multiDivi = multiDivi.toString().replace(/[\*\/]/g, "");
        let operator = formula.indexOf("*") > -1 ? "*" : "/";
        return "(" + addMods(finalFormula) + ")" + operator + multiDivi;
    }
    return null;
}

// Process modifiers in the dice formula
function addMods(formula) {
    formula = formula.replace(/[,]/g, "+");
    formula = formula.replace(/[{} ]/g, "");
    const dice = Array.from(formula.matchAll(/(\d*d\d+)|(-\d*d\d+)/g), i => i[0]);
    const mods = Array.from(formula.matchAll(/([+-]\d+)(?!d)/g), i => i[0]).reduce((a, b) => a + parseInt(b), 0);
    return dice.join("+") + (mods >= 0 ? "+" : "") + mods;
}