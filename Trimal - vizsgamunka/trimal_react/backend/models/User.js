// ==========================================
// Fájl: Felhasználó Modell (User Model)
// Cél: A játékosok (felhasználók) fiókjainak sémája.
//
// Tartalmazza az emailt, jelszavakat és az azonosításhoz szükséges adatokat.
// ==========================================
// backend/models/User.js
// This model is a helper for queries, not an ORM

const bcrypt = require('bcrypt');

class User {
  constructor(pool) {
    this.pool = pool;
  }

  async create({ nickname, email, password, verification_token }) {
    // só generálása
    const salt = await bcrypt.genSalt(10);
    // jelszó hashelése sóval
    const hashed = await bcrypt.hash(password, salt);

    const [result] = await this.pool.execute(
      `INSERT INTO user (nickname, email, password, salt, last_login, status, currency, spec_currency, verification_token, is_verified) 
       VALUES (?, ?, ?, ?, NOW(), 1, 0, 0, ?, 0)`,
      [nickname, email, hashed, salt, verification_token]
    );
    return { id: result.insertId, nickname, email };
  }

  async findByEmail(identifier) {
    const [rows] = await this.pool.execute(`SELECT * FROM user WHERE email = ? OR nickname = ?`, [identifier, identifier]);
    return rows[0];
  }

  async findById(id) {
    const [rows] = await this.pool.execute(`SELECT * FROM user WHERE id = ?`, [id]);
    return rows[0];
  }

  async checkPassword(user, password) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Last_login updatelése
      await this.pool.execute(`UPDATE user SET last_login = NOW() WHERE id = ?`, [user.id]);
    }
    return match;
  }
  async setSpecieId(userId, specieId) {
    await this.pool.execute(`UPDATE user SET specie_id = ? WHERE id = ?`, [specieId, userId]);
  }

  async setResetToken(email, token, expires) {
    await this.pool.execute(
      `UPDATE user SET reset_token = ?, reset_token_expires = ? WHERE email = ?`,
      [token, expires, email]
    );
  }

  async findByResetToken(token) {
    const [rows] = await this.pool.execute(
      `SELECT * FROM user WHERE reset_token = ? AND reset_token_expires > NOW()`,
      [token]
    );
    return rows[0];
  }

  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await this.pool.execute(
      `UPDATE user SET password = ?, salt = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`,
      [hashed, salt, id]
    );
  }
}

module.exports = User;