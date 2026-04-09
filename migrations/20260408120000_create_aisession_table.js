exports.up = function (knex) {
  return knex.schema.createTable("aisession", function (table) {
    table.increments("id").primary();
    
    table.string("session_name").notNullable();
    
    table.enum("mode", ["jd", "non-jd"]).notNullable();
    
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("aisession");
};
