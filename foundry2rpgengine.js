Hooks.once("ready", () => {
    console.log("foundry2rpgengine | Initializing Foundry 2 Rpg Engine");

    // Register the setting
    game.settings.register("foundry2rpgengine", "disableRolls", {
        name: "Disable Rolls on Foundry",
        hint: "If enabled, rolls will not be processed on the Foundry side.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,    // The type of the setting
        default: false,   // Default value is false (checkbox not checked)
        onChange: value => {
            // Handle change in setting value if needed
            console.log("Disable Rolls setting changed to: " + value);
        }
    });

    system = game.system.id;
    Hooks.on("preCreateChatMessage", processRolls);
});

Hooks.on("renderChatMessage", (chatMessage, html, data) => {
    let isRollMessage = false;

    // Check if the message has a non-empty rolls array
    if (data.message.rolls && data.message.rolls.length > 0) {
        isRollMessage = true;
    }
    // Check for Pathfinder 1e roll message
    else if (system === "pf1" && data.message.flags.pf1 && data.message.flags.pf1.metadata && data.message.flags.pf1.metadata.rolls) {
        isRollMessage = true;
    }
    // Check for FateX roll message
    else if (system === "fatex" && data.message.flags.fatex && data.message.flags.fatex.chatCard && data.message.flags.fatex.chatCard.rolls) {
        isRollMessage = true;
    }

    // Check if the setting is enabled and the message is a roll message
    if (game.settings.get("foundry2rpgengine", "disableRolls") && isRollMessage) {
        // Hide the chat message
        html[0].style.display = 'none';

        // Continue to process and send the roll data
        processRolls(data.message);
    }
});


async function processRolls(msg) {
    console.log (msg);
    let formula;
    let rollerName = msg.speaker.alias;
    let rollType;

    if (msg.flavor && !msg.flavor.includes('<')) { // Check for absence of HTML tags
        rollType = msg.flavor;
    } else {
        // If msg.flavor is not plain text or not present, set default or parse as HTML
        rollType = "Generic Roll"; // Default roll type
    }

    if (msg.flavor) {
        const parser = new DOMParser();
        const flavorHtml = parser.parseFromString(msg.flavor, 'text/html');

        // Check for <strong> tag
        const strongText = flavorHtml.querySelector('strong');
        if (strongText) {
            rollType = strongText.textContent.trim();
        } else {
            // Check for <p><b>...</b>: ...</p> structure and get text after <b>
            const boldTextParagraph = flavorHtml.querySelector('p b');
            if (boldTextParagraph) {
                // Get the full paragraph text and extract the portion after <b> tag
                const fullParagraph = boldTextParagraph.parentNode.textContent.trim();
                const boldText = boldTextParagraph.textContent.trim();
                rollType = fullParagraph.includes(':')
                    ? fullParagraph.split(':')[1].trim()
                    : boldText;
            }
        }
    }

    // Pathfinder 1e specific processing
    if (system === "pf1" && msg.flags.pf1 && msg.flags.pf1.metadata && msg.flags.pf1.metadata.rolls) {
        const attacks = msg.flags.pf1.metadata.rolls.attacks;
        if (attacks && attacks.length && attacks[0].attack && attacks[0].attack.formula) {
            formula = attacks[0].attack.formula;
            rollType = attacks[0].attack.options.flavor || "Pathfinder Roll";
        }
    }
    // FateX specific processing
    else if (system === "fatex" && msg.flags.fatex && msg.flags.fatex.chatCard && msg.flags.fatex.chatCard.rolls) {
        const fatexRolls = msg.flags.fatex.chatCard.rolls;
        if (fatexRolls && fatexRolls.length) {
            const roll = fatexRolls[0];
            const numberOfDice = roll.faces.length;
            formula = `${numberOfDice}df`;
            if (roll.rank !== null && roll.rank !== undefined) {
                formula += ` + ${roll.rank}`;
            }
            if (roll.bonus !== null && roll.bonus !== undefined) {
                formula += ` + ${roll.bonus}`;
            }
            rollType = roll.name || "FateX Roll";
        }
    }
    // Default processing for other systems
    else if (msg.rolls && msg.rolls.length && msg.rolls[0]._formula) {
        // Extract and clean up the formula
        formula = msg.rolls[0]._formula.toString();
        formula = formula.replace(/[{}()]/g, ''); // Remove curly braces, parentheses
        formula = formula.replace(/\[.*?\]/g, ''); // Remove square brackets and any text inside
        formula = formula.replace(/[,]/g, '+'); // Replace commas with plus signs
    }


    if (formula) {
        // Send descriptive message as plain text
        let descriptiveMessage = `${rollerName} is rolling for ${rollType}`;
        await fetch('http://localhost:8001/TheRpgEngine/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: descriptiveMessage,
            mode: 'no-cors'
        });

        // Send the actual roll formula as plain text
        await fetch('http://localhost:8001/TheRpgEngine/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: formula,
            mode: 'no-cors'
        });
    } else {
        console.log("No roll formula found.");
    }
}
