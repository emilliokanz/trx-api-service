import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Roles } from '@prisma/client';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { errorMap } from 'src/lib/errorCodes';
import { PrismaService } from 'src/prisma/prisma.service';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt'

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

    console.log(user, "user")

    if (user.length == 0) {
      return new ApiResponseDto(errorMap[1000], null, "1000")
    }

    const comparePassword = await bcrypt.compare(payload.password, user[0].password);

    if (!comparePassword) {
      return new ApiResponseDto(errorMap[1000], null, "1000")
    }

    const jwtPayload = {
      id: user[0].id,
      name: user[0].name,
      role: user[0].role,
    };


    return new ApiResponseDto("success",  {access_token: await this.jwtService.signAsync(jwtPayload)}, "0000")
  }

  async signUp(payload: any) {
    const findUser = await this.prisma.externalUser.findMany({
      where: { username: payload.username },
    });

    if (findUser[0]) {
      return new ApiResponseDto(errorMap[1003], null, "1003")
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
      return new ApiResponseDto(errorMap[1000], null, "1003")
    }

    const comparePassword = await hash(user[0].password || '');

    if (!comparePassword) {
      return new ApiResponseDto(errorMap[1000], null, "1003")
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
        return new ApiResponseDto(errorMap[1004], null, "1004")
      }
  
      const apiKey = uuid.v4(); // Generates a random UUID
  
      const hashApiKey = await hash(apiKey);
  
      await this.prisma.externalUser.update({
        where: { id: findUser[0].id },
        data: {
          apiKey: hashApiKey,
        },
      });

      return new ApiResponseDto('success',{ apiKey }, '0000')
    }
}
