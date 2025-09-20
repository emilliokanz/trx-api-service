import { Inject, Injectable, OnModuleInit, Scope, OnModuleDestroy } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { createUserTrackingExtension } from './prisma.extensions';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(){
    super();
  
    // this.$extends(
    //   createUserTrackingExtension(() => {
    //     return {id: this.request.user?.id, role: this.request.user?.role}
    //   })
    // )
  }
  
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect(); 
  }
}
