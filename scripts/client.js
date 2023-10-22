const url = 'http://localhost:8001/TheRpgEngine';

export async function postChat(message) {
    var response = await fetch(`${url}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: message,
        mode: 'no-cors'
    })

    return JSON.parse(response.json);
}
