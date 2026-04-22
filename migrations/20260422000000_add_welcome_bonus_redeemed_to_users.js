exports.up = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.boolean("welcomeBonusRedeemed").notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", function (table) {
    table.dropColumn("welcomeBonusRedeemed");
  });
};
