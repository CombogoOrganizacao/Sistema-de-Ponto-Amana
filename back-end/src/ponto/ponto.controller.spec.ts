import { Test, TestingModule } from '@nestjs/testing';
import { PontoController } from './ponto.controller';
import { PontoService } from './ponto.service';

describe('PontoController', () => {
  let controller: PontoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PontoController],
      providers: [PontoService],
    }).compile();

    controller = module.get<PontoController>(PontoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
