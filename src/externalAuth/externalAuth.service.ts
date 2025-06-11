import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Roles } from '@prisma/client';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { errorMap } from 'src/lib/errorCodes';
import { PrismaService } from 'src/prisma/prisma.service';
import * as uuid from 'uuid';

import hash from 'src/utils/hash';

@Injectable()
export class ExtenalAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(payload: any) {
    const user = await this.prisma.externalUser.findMany({
      where: { username: payload.username },
    });

    if (!user) {
      return new ApiResponseDto("1000", errorMap[1000])
    }

    const comparePassword = await hash(user[0].password);

    if (!comparePassword) {
      return new HttpException(
        'Username or Password is wrong',
        HttpStatus.BAD_REQUEST,
      );
    }

    const jwtPayload = {
      id: user[0].id,
      name: user[0].name,
      role: user[0].role,
    };

    return {
      access_token: await this.jwtService.signAsync(jwtPayload),
    };
  }

  async signUp(payload: any) {
    const findUser = await this.prisma.externalUser.findMany({
      where: { username: payload.username },
    });

    if (findUser[0]) {
      return new HttpException(
        'Username has been used',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await hash(payload.password);

    const createUser = await this.prisma.externalUser.create({
      data: {
        username: payload.username,
        name: payload.name,
        password: hashedPassword,
        role: Roles.Customer,
        isCustomer: false,
        apiKey: '',
        balance: 0
      },
    });

    return {
      name: createUser.name,
      username: createUser.username,
      role: createUser.role,
    };
  }

  async loginCustomer(payload: any) {
    const user = await this.prisma.customer.findMany({
      where: { username: payload.username },
    });

    if (!user) {
      return new HttpException(
        'Username or Password is wrong',
        HttpStatus.BAD_REQUEST,
      );
    }

    const comparePassword = await hash(user[0].password || '');

    if (!comparePassword) {
      return new HttpException(
        'Username or Password is wrong',
        HttpStatus.BAD_REQUEST,
      );
    }

    const jwtPayload = {
      id: user[0].id,
      name: user[0].name,
      role: Roles.Customer,
    };

    return {
      access_token: await this.jwtService.signAsync(jwtPayload),
    };
  }

   async generateApiKey(username: string) {
      const findUser = await this.prisma.externalUser.findMany({
        where: { username },
      });
  
      if (!findUser) {
        return new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }
  
      const apiKey = uuid.v4(); // Generates a random UUID
  
      const hashApiKey = await hash(apiKey);
  
      await this.prisma.externalUser.update({
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
