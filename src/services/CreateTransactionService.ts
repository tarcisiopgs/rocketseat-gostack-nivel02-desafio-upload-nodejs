import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    let categoryInDatabase = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(`${type}: invalid type for transaction`);
    }

    if (type === 'outcome') {
      const balance: Balance = await transactionsRepository.getBalance();

      if (value > balance.total) {
        throw new AppError('balance not available');
      }
    }

    if (!categoryInDatabase) {
      categoryInDatabase = categoriesRepository.create({ title: category });

      await categoriesRepository.save(categoryInDatabase);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryInDatabase.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
