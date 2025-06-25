import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Roles } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import hash from 'src/utils/hash';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(payload: any) {
    const user = await this.prisma.user.findMany({
      where: { username: payload.username },
    });

    if (!user) {
      return new HttpException(
        'Username or Password is wrong',
        HttpStatus.BAD_REQUEST,
      );
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
    const findUser = await this.prisma.user.findMany({
      where: { username: payload.username },
    });

    if (findUser[0]) {
      return new HttpException(
        'Username has been used',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await hash(payload.password);

    const createUser = await this.prisma.user.create({
      data: {
        username: payload.username,
        name: payload.name,
        password: hashedPassword,
        role: Roles.Admin,
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

  async signUpCustomer(payload: any) {
    const findUser = await this.prisma.customer.findMany({
      where: { username: payload.username },
    });

    if (findUser[0]) {
      return new HttpException(
        'Username has been used',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await hash(payload.password);

    const createUser = await this.prisma.customer.create({
      data: {
        username: payload.username,
        name: payload.name,
        password: hashedPassword,
        balance: 0,
        apiKey: ''
      },
    });

    return {
      name: createUser.name,
      username: createUser.username,
    };
  }

  async getUserDetail(token:string){
    const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

    return payload
  }
}
