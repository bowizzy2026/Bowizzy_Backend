exports.up = function (knex) {
  return knex.schema.alterTable("aisession", function (table) {
    table.boolean("started").defaultTo(false);
    table.json("infoJson").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("aisession", function (table) {
    table.dropColumn("started");
    table.dropColumn("infoJson");
  });
};
