const { Model } = require("objection");
const db = require("../db/knex");

Model.knex(db);

class AiSession extends Model {
  static get tableName() {
    return "aisession";
  }

  static get idColumn() {
    return "id";
  }

  static get relationMappings() {
    return {
      chats: {
        relation: Model.HasManyRelation,
        modelClass: require("./AiChat"),
        join: {
          from: "aisession.id",
          to: "aichat.session_id"
        }
      }
    };
  }
}

module.exports = AiSession;
