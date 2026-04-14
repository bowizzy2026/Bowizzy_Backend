const { Model } = require("objection");
const db = require("../db/knex");

Model.knex(db);


class BankDetails extends Model {
  static get tableName() {
    return "bank_details";
  }

  static get idColumn() {
    return "bank_id";
  }

  static get relationMappings() {
    const User = require("./user");
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "bank_details.user_id",
          to: "users.user_id"
        }
      }
    };
  }
}


module.exports = BankDetails;