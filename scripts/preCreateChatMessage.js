import { postChat } from "./client";

export async function process(msg) {
    if (msg.isRoll) {
        for (let i = 0; i < msg.rolls.length; i++) {
            let formula = cleanFormula(msg.rolls[i]._formula);
            postChat(formula);
        }
    }
}

function cleanFormula(rawFormula) {
    return rawFormula
        .toString()
        .replace(/[{}]/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/[,]/g, "+");
}
