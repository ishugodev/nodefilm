const AppError = require("../utils/AppError");
const sqliteConnection = require("../database/sqlite");
const { hash, compare } = require("bcryptjs");

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body;

    const database = await sqliteConnection();

    const checkUserExistsByEmail = await database.get("SELECT * FROM users WHERE email = (?)", [email]);

    console.log(name, email, password);

    if(checkUserExistsByEmail) {
      throw new AppError("Email já existente!");
    }

    const hashedPassword = await hash(password, 8);

    await database.run("INSERT INTO users(name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return response.status(201).json({ message: "Success" });
  }

  async update(request, response) {
    const { name, email, password, old_password } = request.body;
    const { id } = request.params;

    const database = await sqliteConnection();
    const user = await database.get("SELECT * FROM users WHERE id = (?)", [id]);

    if(!user) {
      throw new AppError("Usuário não encontrado!");
    }

    const userWithUpdatedEmail = await database.get("SELECT * FROM users WHERE email = (?)", [email]);

    if(userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
      throw new AppError("E-mail está em uso.");
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;

    if(password && ! old_password) {
      throw new AppError("Você precisa informar a senha antiga para definir a nova senha.");
    }

    if(password && old_password) {
      const checkOldPassword = await compare(old_password, user.password);

      if(!checkOldPassword) {
        throw new AppError("Senha antiga inválida! Digite novamente.");
      }

      user.password = await hash(password, 8);
    }

    await database.run(`
      UPDATE users SET
      name = ?,
      email = ?,
      password = ?,
      edited_at = DATETIME('now')
      WHERE id = ?
      `, [user.name, user.email, user.password, id]
    );

    return response.json();
  }
}

module.exports = UsersController;