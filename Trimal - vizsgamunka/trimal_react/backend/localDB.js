const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const CHAR_FILE = path.join(__dirname, 'characters.json');

const readJson = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
};

const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = {
    getUsers: () => readJson(USERS_FILE),
    saveUsers: (data) => writeJson(USERS_FILE, data),

    getCharacters: () => readJson(CHAR_FILE),
    saveCharacters: (data) => writeJson(CHAR_FILE, data)
};