// backend/models/Character.js

class Character {
  constructor(pool) {
    this.pool = pool;
  }

  async create({ userId, specie_name, hair_style, beard_style, inventory_json, quest_1, quest_2, quest_3 }) {
    const [result] = await this.pool.execute(
      `INSERT INTO specie (user_id, specie_name, hair_style, beard_style, lvl, xp, inventory_json, quest_1, quest_2, quest_3, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, specie_name, hair_style, beard_style, inventory_json, quest_1, quest_2, quest_3]
    );
    return { id: result.insertId, userId, specie_name, hair_style, beard_style, lvl: 1, xp: 0 };
  }

  async findByUserId(userId) {
    const [rows] = await this.pool.execute(`SELECT * FROM specie WHERE user_id = ?`, [userId]);
    return rows;
  }
}

module.exports = Character;