const { Model } = require("objection");
const db = require("../db/knex");

Model.knex(db);

class AiChat extends Model {
  static get tableName() {
    return "aichat";
  }

  static get idColumn() {
    return "id";
  }

  static get relationMappings() {
    return {
      session: {
        relation: Model.BelongsToOneRelation,
        modelClass: require("./AiSession"),
        join: {
          from: "aichat.session_id",
          to: "aisession.id"
        }
      }
    };
  }
}

module.exports = AiChat;
