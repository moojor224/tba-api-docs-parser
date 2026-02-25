import "./page.css";

async function getAPIJson() {
    try {
        return fetch(
            "https://raw.githubusercontent.com/the-blue-alliance/the-blue-alliance/refs/heads/main/src/backend/web/static/swagger/api_v3.json"
        )
            .then((r) => r.json())
            .catch((e) => null);
    } catch {
        return null;
    }
}

const api = await getAPIJson();
console.log(api);
