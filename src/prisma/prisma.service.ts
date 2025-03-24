import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { createUserTrackingExtension } from './prisma.extensions';

@Injectable({scope: Scope.REQUEST})
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(@Inject(REQUEST) private readonly request: any){
    super();
  
    const extendedClient = new PrismaClient().$extends(
      createUserTrackingExtension(() => {
        return {id: this.request.user?.id, role: this.request.user?.role}
      })
    )

    Object.assign(this, extendedClient);
  }
  
  async onModuleInit() {
    await this.$connect();
  }


}
