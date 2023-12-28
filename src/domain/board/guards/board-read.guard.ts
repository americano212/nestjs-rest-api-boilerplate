import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { BoardService } from '../providers';
import { AuthService, Payload } from 'src/auth';
import { GuardType } from '../enums';
import { Reflector } from '@nestjs/core';
import { TYPE_KEY } from '../decorator';

@Injectable()
export class BoardGuard implements CanActivate {
  constructor(
    private readonly board: BoardService,
    private readonly auth: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const guardType = this.reflector.get<GuardType>(TYPE_KEY, context.getHandler());

    const { params, headers } = context.switchToHttp().getRequest<Request>();

    const boardName = params['board_name'];

    let boardRequiredRoles: string[] = [];
    if (guardType === GuardType.READ)
      boardRequiredRoles = await this.getBoardReadRequiredRoles(boardName);
    if (guardType === GuardType.WRITE)
      boardRequiredRoles = await this.getBoardWriteRequiredRoles(boardName);

    if (!boardRequiredRoles.length) return true;

    const headerAuthorization = headers.authorization;
    if (!headerAuthorization) return false;
    const userRoles = await this.getUserRoles(headerAuthorization);

    return boardRequiredRoles.every((role) => userRoles.includes(role));
  }

  private async getBoardReadRequiredRoles(boardName: string): Promise<string[]> {
    const { board_read_roles } = await this.board.findByBoardName(boardName);
    return board_read_roles;
  }

  private async getBoardWriteRequiredRoles(boardName: string): Promise<string[]> {
    const { board_write_roles } = await this.board.findByBoardName(boardName);
    return board_write_roles;
  }

  private async getUserRoles(headerAuthorization: string): Promise<string[]> {
    const jwtToken = headerAuthorization.split('Bearer ')[1];
    const payload: Payload | null = this.auth.jwtVerify(jwtToken);
    if (!payload) return [];
    return payload.roles ? payload.roles : [];
  }
}
