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
  ) { }

  async login(payload: any) {
    const user = await this.prisma.externalUser.findMany({
      where: { username: payload.username },
    });

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


    return new ApiResponseDto("success", { access_token: await this.jwtService.signAsync(jwtPayload) }, "0000")
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
        isCustomer: true,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        referalCode: payload.referalCode || '',
        apiKey: '',
        balance: 0
      },
    });

    if (createUser && payload.referalCode !== '') {
      try {
        await this.addToAdminUser(payload.referalCode, createUser.id)
      } catch (error: any) {
        return new ApiResponseDto(errorMap[1004], null, "1004")
      }
    }

    return {
      name: createUser.name,
      username: createUser.username,
      role: createUser.role,
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

    return new ApiResponseDto('success', { apiKey }, '0000')
  }

  async generateReferalCode(id: number) {
    const referalCode = uuid.v4()

    const user = await this.prisma.externalUser.findMany({
      where: {
        id
      }
    })


    try {
      const updateAdmin = await this.prisma.externalUser.update({
        where: {
          id: user[0].id
        }, data: {
          referalCode
        }
      })

      return new ApiResponseDto('success', updateAdmin, "0000")
    } catch (error: any) {
      return new ApiResponseDto(errorMap[5000], null, "5000")
    }
  }

  async addToAdminUser(referalCode: string, customerId: number) {

    const findAdmin = this.checkReferalCode(referalCode)


    await this.prisma.externalAdminUsers.create({
      data: {
        userId: findAdmin[0].id,
        customers: {
          connect: {
            id: customerId
          }
        }
      }
    })
  }

  async checkReferalCode(referalCode: string) {
    const findAdmin = await this.prisma.externalUser.findMany({
      where: {
        referalCode
      }
    })

    if (findAdmin.length == 0) {
      return new ApiResponseDto(errorMap[1005], null, "1005")
    }
    return findAdmin
  }

  async getUserDetail(token:string){
    const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

    return payload
  }

  async assignToAdminUser(referalCode: string, userId: number){
    const admin = await this.checkReferalCode(referalCode)

    if(admin instanceof ApiResponseDto){
      return admin
    }

    const isUserAssigned = await this.prisma.externalUser.findFirst({
      where: {
        id: userId,
        AND: {
          externalAdminUsersUserId: null
        }
      }
    })

    if(!isUserAssigned){
      return new ApiResponseDto(errorMap[1006], null, "1006")
    }

    const updateUser = await this.prisma.externalUser.update({
      where: {
        id: userId
      }, data: {
        externalAdminUsersUserId: admin[0].id
      }
    })

    return updateUser
  }
}
