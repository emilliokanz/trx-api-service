import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import PaginationIface from 'src/interface/paginationIface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  async createOwner(name: string) {
    const findOwner = await this.findOwnerByName(name);

    if (findOwner) {
      return new HttpException('Owner already exist', HttpStatus.BAD_REQUEST);
    }

    return await this.prisma.owner.create({
      data: {
        name,
        balance: 0,
      },
    });
  }

  async updateOwnerBalance(id: number, balance: number) {
    await this.findOwnerById(id);

    const owner = await this.prisma.owner.update({
      where: { id },
      data: {
        balance,
      },
    });

    return owner;
  }

  async findOwnerByName(name: string) {
    const findOwner = this.prisma.owner.findMany({
      where: {
        name,
      },
    });

    return findOwner[0];
  }

  async findOwnerById(id: number) {
    const findOwner = this.prisma.owner.findUnique({
      where: {
        id,
      },
    });

    return findOwner;
  }

  async findOwners(page: number, take: number) {
    const data = await this.prisma.owner.findMany({
      take,
      skip: page - 1,
    });

    const totalData = await this.findTotalOwner();

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / take),
    };

    return paginationData;
  }

  async getAllOwners(){
    return await this.prisma.owner.findMany()
  }

  async divideOwnerProfit(profit: number) {
    const owners = await this.getAllOwners()
    if (owners.length > 0) {
      owners.forEach(async(x) => {
        if(x.percentage){
          await this.prisma.owner.update({
            where: {
              id: x.id
            },
            data: {
              balance: {increment: Math.floor(profit * (x.percentage / 100))},
            },
          });
        }
      })
    }

    return null;
  }

  async decrementOwnerProfit(profit: number) {
    const owners = await this.getAllOwners()
    if (owners.length > 0) {
      owners.forEach(async(x) => {
        if(x.percentage){
          await this.prisma.owner.update({
            where: {
              id: x.id
            },
            data: {
              balance: {decrement: profit * (x.percentage / 100)},
            },
          });
        }
      })
    }

    return null;
  }

  async findTotalOwner() {
    const totalData = await this.prisma.owner.count();
    return totalData;
  }
  
}
