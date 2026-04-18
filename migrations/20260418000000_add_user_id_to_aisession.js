exports.up = function (knex) {
  return knex.schema.alterTable("aisession", function (table) {
    table.integer("user_id").unsigned().nullable().references("user_id").inTable("users").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("aisession", function (table) {
    table.dropColumn("user_id");
  });
};
