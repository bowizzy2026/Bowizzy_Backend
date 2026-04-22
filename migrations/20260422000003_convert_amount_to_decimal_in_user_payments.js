exports.up = function (knex) {
  return knex.schema.alterTable('user_payments', function (table) {
    table.decimal('amount', 10, 2).alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('user_payments', function (table) {
    table.integer('amount').alter();
  });
};