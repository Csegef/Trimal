// backend/models/Character.js

class Character {
    constructor(pool) {
      this.pool = pool;
    }
  
    async create({ userId, specie_name, hair_style, beard_style }) {
      const [result] = await this.pool.execute(
        `INSERT INTO specie (user_id, specie_name, hair_style, beard_style, lvl, xp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())`,
        [userId, specie_name, hair_style, beard_style]
      );
      return { id: result.insertId, userId, specie_name, hair_style, beard_style, lvl: 1, xp: 0 };
    }
  
    async findByUserId(userId) {
      const [rows] = await this.pool.execute(`SELECT * FROM specie WHERE user_id = ?`, [userId]);
      return rows;
    }
  }
  
  module.exports = Character;  