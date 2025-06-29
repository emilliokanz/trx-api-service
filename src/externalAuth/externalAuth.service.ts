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
export class ExternalAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(payload: any) {
    const user = await this.prisma.externalUser.findMany({
      where: { username: payload.username },
      include: {
        ExternalAdminUsers: true
      }
    });

    if (user.length == 0) {
      return new ApiResponseDto(errorMap[1000], null, "1000")
    }

    const comparePassword = await bcrypt.compare(payload.password, user[0].password);

    if (!comparePassword) {
      return new ApiResponseDto(errorMap[1000], null, "1000")
    }

    const jwtPayload : any = {
      id: user[0].id,
      username: user[0].username,
      name: user[0].name,
      role: user[0].role,
    };

    if(user[0].role == 'Customer'){
      jwtPayload.referal = user[0].externalAdminUsersUserId != null;
    }


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
        phoneNumber: payload.phone_number,
        referalCode: payload.referal_code || '',
        apiKey: '',
        balance: 0
      },
    });

    const userData = {
      name: createUser.name,
      username: createUser.username,
      role: createUser.role,
    }

    if (createUser && payload.referal_code) {
      try {
        await this.assignToAdminCustomer(payload.referal_code, createUser.id)
      } catch (error: any) {
        return new ApiResponseDto(errorMap[1005], userData, "1005")
      }
    }

    return new ApiResponseDto("success", userData, "0000")
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

    const user = await this.findUserById(id)

    if(!user.data){
      return user
    }

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

  async checkReferalCode(referalCode: string) {
    const findAdmin = await this.prisma.externalUser.findMany({
      where: {
        referalCode
      }
    })

    if (findAdmin.length == 0) {
      return new ApiResponseDto(errorMap[1005], null, "1005")
    }
    return findAdmin[0]
  }

  async getUserDetail(token: string) {
    const user = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });

    return user
  }


  async assignToAdminCustomer(referalCode: string, userId: number) {
    const admin = await this.checkReferalCode(referalCode)

    if (admin instanceof ApiResponseDto) {
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

    if (!isUserAssigned) {
      return new ApiResponseDto(errorMap[1006], null, "1006")
    }

    const updateUser = await this.prisma.externalUser.update({
      where: {
        id: userId
      }, data: {
        ExternalAdminUsers: {
          create: {
            userId: admin.id
          }
        }
      }
    })

      return new ApiResponseDto("success", updateUser, "0000")
  }

  async findUserById(user_id: number){
    const user = await this.prisma.externalUser.findFirst({
      where: {
        id: user_id
      }
    })

    if(!user){
      return new ApiResponseDto(errorMap[1004], null, "1004")
    }

    return new ApiResponseDto("success", user, "0000")
  }

  async findUserByUsername(username: string){
    const user = await this.prisma.externalUser.findMany({
      where: { username },
    });

    if (!user) {
      return new ApiResponseDto(errorMap[1004], null, "1004")
    }

    return new ApiResponseDto("success", user, "0000")
  }
}
