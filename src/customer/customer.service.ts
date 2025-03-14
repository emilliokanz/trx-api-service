import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import hash from 'src/utils/hash';
import * as uuid from 'uuid';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async addUser(username: string) {
    const findUser = await this.prisma.customer.findMany({
      where: { username },
    });

    if (findUser.length > 0) {
      return new HttpException('User already exist', HttpStatus.BAD_REQUEST);
    }

    const createUser = await this.prisma.customer.create({
      data: { username: username, balance: 0, apiKey: '' },
    });

    return {
      message: 'created',
      data: createUser,
    };
  }

  async updateUserBalance(balance: number, username: string) {
    const findUser = await this.prisma.customer.findMany({
      where: { username },
    });

    if (!findUser) {
      return new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    const updateUser = await this.prisma.customer.update({
      where: { id: findUser[0].id },
      data: {
        balance,
      },
    });

    return {
      message: 'updated',
      data: updateUser,
    };
  }

  async generateApiKey(username: string) {
    const findUser = await this.prisma.customer.findMany({
      where: { username },
    });

    if (!findUser) {
      return new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    const apiKey = uuid.v4(); // Generates a random UUID

    const hashApiKey = await hash(apiKey);

    await this.prisma.customer.update({
      where: { id: findUser[0].id },
      data: {
        apiKey: hashApiKey,
      },
    });

    return {
      message: 'updated',
      data: { apiKey },
    };
  }
}
