// backend/models/User.js
// This model is a helper for queries, not an ORM

const bcrypt = require('bcrypt');

class User {
  constructor(pool) {
    this.pool = pool;
  }

  async create({ nickname, email, password, verification_token }) {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    const hashed = await bcrypt.hash(password, salt);

    const [result] = await this.pool.execute(
      `INSERT INTO user (nickname, email, password, salt, last_login, status, currency, spec_currency, description, verification_token, is_verified) 
       VALUES (?, ?, ?, ?, NOW(), 1, 0, 0, '', ?, 0)`,
      [nickname, email, hashed, salt, verification_token]
    );
    return { id: result.insertId, nickname, email };
  }

  async findByEmail(email) {
    const [rows] = await this.pool.execute(`SELECT * FROM user WHERE email = ?`, [email]);
    return rows[0];
  }

  async findById(id) {
    const [rows] = await this.pool.execute(`SELECT * FROM user WHERE id = ?`, [id]);
    return rows[0];
  }

  async checkPassword(user, password) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Update last_login
      await this.pool.execute(`UPDATE user SET last_login = NOW() WHERE id = ?`, [user.id]);
    }
    return match;
  }
  async setSpecieId(userId, specieId) {
    await this.pool.execute(`UPDATE user SET specie_id = ? WHERE id = ?`, [specieId, userId]);
  }
}

module.exports = User;