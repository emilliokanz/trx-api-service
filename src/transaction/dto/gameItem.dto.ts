import { IsNumber, IsString } from "class-validator";

export class GameItemDto {
    @IsString()
    idItem: number;
  
    @IsString()
    serverName: string;
  
    @IsString()
    gameName: string;
  
    @IsString()
    groupName: string;
  
    @IsString()
    itemName: string;
  
    @IsNumber()
    stock: number;
  
    @IsNumber()
    minOrder: number;
  
    @IsNumber()
    price: number;
  }