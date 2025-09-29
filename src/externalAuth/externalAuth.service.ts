import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExternalUser, Prisma, Roles } from '@prisma/client';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { errorMap } from 'src/lib/errorCodes';
import { PrismaService } from 'src/prisma/prisma.service';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt'

import hash from 'src/utils/hash';
import PaginationIface from 'src/interface/paginationIface';
import { encryptSecret } from 'src/utils/payloadValidation';

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
        asAdmin: true
      }
    });

    if (user.length == 0) {
      return new ApiResponseDto(errorMap[1000], null, "1000")
    }

    const comparePassword = await bcrypt.compare(payload.password, user[0].password);

    if (!comparePassword) {
      return new ApiResponseDto(errorMap[1000], null, "1000")
    }

    const jwtPayload: any = {
      id: user[0].id,
      username: user[0].username,
      name: user[0].name,
      role: user[0].role,
    };

    if (user[0].role == 'Customer') {
      jwtPayload.referal = user[0].externalAdminUsersUserId != null;
    }

    if (user[0].role == 'Admin') {
      jwtPayload.referal = user[0].referalCode != null;
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
        await this.assignAdminCustomer(payload.referal_code, createUser.id)
      } catch (error: any) {
        return new ApiResponseDto(errorMap[1005], userData, "1005")
      }
    }

    return new ApiResponseDto("success", userData, "0000")
  }

  async generateApiKey(user: any, username?: string ) {
    let findUser : ExternalUser | null
    if(username !== undefined && user.role == Roles.SuperAdmin){
      findUser = await this.prisma.externalUser.findFirst({
          where: { username },
      });
    } else {
      findUser = await this.prisma.externalUser.findFirst({
        where: {
          id: user.id
        }
      })
    }


    if (!findUser) {
      throw new HttpException(new ApiResponseDto(errorMap[1004], null, "1004"), HttpStatus.BAD_REQUEST)
    }

    const apiKey = uuid.v4(); // Generates a random UUID

    const hashApiKey = encryptSecret(apiKey);

    await this.prisma.externalUser.update({
      where: { id: findUser.id },
      data: {
        apiKey: hashApiKey,
      },
    });

    return new ApiResponseDto('success', { apiKey }, '0000')
  }

  async generateReferalCode(id: number, referalName: string) {
    const referalCode = uuid.v4()
    if (!referalName) {
      throw new HttpException(new ApiResponseDto(errorMap[4000] + "referal_name", null, "4000"), HttpStatus.BAD_REQUEST)
    }

    const data: Prisma.ExternalUserUpdateInput = { referalName }
    const user = await this.findUserById(id)

    if (!user.data.referalCode) {
      data.referalCode = referalCode
    }

    try {
      const admin = await this.prisma.externalUser.update({
        where: {
          id: user.data.id
        }, data
      })

      return new ApiResponseDto('success', { referal_name: admin.referalName }, "0000")
    } catch (error: any) {

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(
          new ApiResponseDto(errorMap[4009] + 'referal_name', null, "4009"),
          HttpStatus.BAD_REQUEST
        );
      }
      console.log(error)
      throw new HttpException(new ApiResponseDto(errorMap[5000], null, "5000"), HttpStatus.BAD_REQUEST)
    }
  }

  async checkReferalName(referalName: string) {
    const findAdmin = await this.prisma.externalUser.findMany({
      where: {
        referalName: {
          equals: referalName,
          notIn: [''],
          not: null
        }
      }
    })

    if (findAdmin.length == 0) {
      return new ApiResponseDto(errorMap[1005], null, "1005")
    }
    return new ApiResponseDto('success', findAdmin[0], "0000")
  }

  async getUserDetail(token: string) {
    const user = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });

    return user
  }


  async assignAdminCustomer(referalName: string, userId: number) {
    const admin = await this.checkReferalName(referalName)

    if (!admin.data) {
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

    await this.prisma.externalUser.update({
      where: {
        id: userId
      }, data: {
        externalAdminUsersUserId: admin.data.id
      }
    })

    await this.prisma.externalUser.update({
      where: {
        id: admin.data.id
      }, data: {
        asAdmin: {
          create: {
            cust_id: userId,
          }
        }
      }
    })

    return new ApiResponseDto("success", null, "0000")
  }

  async getAdminCustomerList(page: number, size: number, name: string, admin_id: number) {
    let where: Prisma.ExternalUserWhereInput = {
      asCustomer: {
        some: {
          admin_id
        }
      }
    }

    if (name) {
      where = {
        OR: [{ name }, { username: name }],
      }
    }

    const data = await this.prisma.externalUser.findMany({
      skip: (page - 1) * size,
      take: size,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        name: true,
        username: true,
        balance: true,
        email: true,
        phoneNumber: true,
        createdAt: true
      },
      where
    })

    const totalData = await this.prisma.externalUser.count({
      where
    })

    const paginationData: PaginationIface = {
      data,
      totalData,
      page,
      pageLength: Math.ceil(totalData / size)
    };

    return new ApiResponseDto('success', paginationData, '0000');
  }

  async findUserById(user_id: number) {
    const user = await this.prisma.externalUser.findFirst({
      where: {
        id: user_id
      }
    })

    if (!user) {
      return new ApiResponseDto(errorMap[1004], null, "1004")
    }

    return new ApiResponseDto("success", user, "0000")
  }

  async findUserByUsername(username: string) {
    const user = await this.prisma.externalUser.findMany({
      where: { username },
    });

    if (!user) {
      return new ApiResponseDto(errorMap[1004], null, "1004")
    }

    return new ApiResponseDto("success", user, "0000")
  }

}
