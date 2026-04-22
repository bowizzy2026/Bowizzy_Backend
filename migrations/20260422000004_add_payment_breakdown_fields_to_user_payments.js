exports.up = function (knex) {
  return knex.schema.alterTable('user_payments', function (table) {
    table.decimal('credits_applied', 10, 2);
    table.decimal('base_price', 10, 2);
    table.decimal('credit_discount', 10, 2);
    table.decimal('cgst', 10, 2);
    table.decimal('sgst', 10, 2);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('user_payments', function (table) {
    table.dropColumn('credits_applied');
    table.dropColumn('base_price');
    table.dropColumn('credit_discount');
    table.dropColumn('cgst');
    table.dropColumn('sgst');
  });
};