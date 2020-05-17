import { join } from 'path';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import AppError from '../errors/AppError';
import uploadConfig from '../config/upload';

interface Request {
  file: Express.Multer.File;
}

class ImportTransactionsService {
  private lines: string[] = [];

  async execute({ file }: Request): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();

    return new Promise<Transaction[]>(resolve => {
      if (file.mimetype !== 'text/csv') {
        throw new AppError('The uploaded file must be a CSV');
      }

      createReadStream(join(uploadConfig.directory, file.filename))
        .pipe(csvParser())
        .on('data', data => {
          this.lines.push(Object.values(data)[0] as string);
        })
        .on('end', async () => {
          const results: Transaction[] = [];
          for (const line of this.lines) {
            // @ts-ignore
            const [title, type, value, category]: [
              string,
              'income' | 'outcome',
              number,
              string,
            ] = line.split(';');

            const transaction: Transaction = await createTransactionService.execute(
              {
                title,
                type,
                value,
                category,
              },
            );

            results.push(transaction);
          }

          resolve(results);
        });
    });
  }
}

export default ImportTransactionsService;
