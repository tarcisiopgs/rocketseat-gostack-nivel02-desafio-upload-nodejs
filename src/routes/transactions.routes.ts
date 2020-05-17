import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import uploadConfig from '../config/upload';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find({
    select: ['id', 'title', 'value', 'type', 'created_at', 'updated_at'],
    relations: ['category'],
  });
  const balance = await transactionsRepository.getBalance();
  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const {
    body: { title, value, type, category },
  } = request;

  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const {
    params: { id },
  } = request;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute({ id });

  return response.json({ message: 'transaction deleted successfully' });
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { file } = request;

    const importTransactionsService = new ImportTransactionsService();

    const transactions = await importTransactionsService.execute({ file });

    return response.json(transactions);
  },
);

export default transactionsRouter;
