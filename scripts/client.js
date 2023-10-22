const baseUrl = 'http://localhost:8001/TheRpgEngine';
const headers = {
    'Content-Type': 'application/json'
};

async function post(url, message) {
    return await fetch(url, {
        method: "POST",
        headers: headers,
        body: message,
        mode: 'no-cors'
    });
}

async function get(url) {
    return await fetch(url, {
        method: "GET",
        headers: headers,
        mode: 'no-cors'
    });
}

export async function postChat(message) {
    let response = await get(`${baseUrl}/chat`, message);

    return JSON.parse(response.json);
}

export async function getFx() {
    let response = await get(`${baseUrl}/fx`);

    return JSON.parse(response.json);
}

export async function postFx(name, position) {
    await post(`${baseUrl}/fx`, {
        name: name,
        position: position
    });
}
