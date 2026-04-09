exports.up = function (knex) {
  return knex.schema.createTable("aichat", function (table) {
    table.increments("id").primary();
    
    table
      .integer("session_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("aisession")
      .onDelete("CASCADE");
    
    table.text("text").notNullable();
    
    table.string("file_link").nullable();
    
    table.enum("type", ["assistant", "user"]).notNullable();
    
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("aichat");
};
