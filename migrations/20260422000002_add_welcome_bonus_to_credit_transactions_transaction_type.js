exports.up = function (knex) {
  return knex.raw(`ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check`)
    .then(() => {
      return knex.raw(`ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_transaction_type_check CHECK (transaction_type IN ('interview_slot_booking', 'interview_slot_cancellation', 'subscription_purchase', 'manual_credit_addition', 'manual_credit_deduction', 'welcome_bonus'))`);
    });
};

exports.down = function (knex) {
  return knex.raw(`ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check`)
    .then(() => {
      return knex.raw(`ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_transaction_type_check CHECK (transaction_type IN ('interview_slot_booking', 'interview_slot_cancellation', 'subscription_purchase', 'manual_credit_addition', 'manual_credit_deduction'))`);
    });
};