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

interface Line {
  title: string;
  type: string;
  value: string;
  category: string;
}

interface LineRequest {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  private lines: Line[] = [];

  async execute({ file }: Request): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();

    if (file.mimetype !== 'text/csv') {
      throw new AppError('The uploaded file must be a CSV');
    }

    return new Promise<Transaction[]>(resolve => {
      createReadStream(join(uploadConfig.directory, file.filename))
        .pipe(csvParser(['title', 'type', 'value', 'category']))
        .on('data', (data: Line) => {
          if (data.title !== 'title') {
            if (
              data.type.trim() !== 'income' &&
              data.type.trim() !== 'outcome'
            ) {
              throw new AppError('invalid type for transaction');
            }
            this.lines.push(data);
          }
        })
        .on('end', async () => {
          const results = [];

          for (const { title, type, value, category } of this.lines) {
            const transaction = await createTransactionService.execute(<
              LineRequest
            >{
              title: title.trim(),
              type: type.trim(),
              value: parseInt(value.trim()),
              category: category.trim(),
            });

            results.push(transaction);
          }

          resolve(results);
        });
    });
  }
}

export default ImportTransactionsService;
