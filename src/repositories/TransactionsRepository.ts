import { EntityRepository, getRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const result: Balance = {
      total: 0,
      income: 0,
      outcome: 0,
    };

    const transactionsRepository = getRepository(Transaction);
    const transactions = await transactionsRepository.find();

    for (const { value, type } of transactions) {
      result[type] += value;
    }

    result.total = result.income - result.outcome;

    return result;
  }
}

export default TransactionsRepository;
