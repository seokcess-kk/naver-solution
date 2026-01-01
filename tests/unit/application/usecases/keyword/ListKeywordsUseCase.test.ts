import { ListKeywordsUseCase } from '@application/usecases/keyword/ListKeywordsUseCase';
import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { Keyword } from '@domain/entities/Keyword';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('ListKeywordsUseCase', () => {
  let useCase: ListKeywordsUseCase;
  let mockKeywordRepository: jest.Mocked<IKeywordRepository>;

  beforeEach(() => {
    mockKeywordRepository = MockFactory.createKeywordRepository();
    useCase = new ListKeywordsUseCase(mockKeywordRepository);
  });

  describe('execute', () => {
    const mockKeywords: Keyword[] = [
      {
        id: 'keyword-1',
        keyword: '강남 맛집',
        createdAt: new Date('2024-01-01'),
        placeKeywords: [],
      } as Keyword,
      {
        id: 'keyword-2',
        keyword: '서울 카페',
        createdAt: new Date('2024-01-02'),
        placeKeywords: [],
      } as Keyword,
      {
        id: 'keyword-3',
        keyword: '홍대 술집',
        createdAt: new Date('2024-01-03'),
        placeKeywords: [],
      } as Keyword,
    ];

    describe('Happy Path', () => {
      beforeEach(() => {
        mockKeywordRepository.findAll.mockResolvedValue({
          data: mockKeywords,
          pagination: {
            page: 1,
            limit: 10,
            total: mockKeywords.length,
            totalPages: 1,
          },
        });
      });

      it('should return all keywords as DTOs', async () => {
        const result = await useCase.execute();

        expect(result.data).toHaveLength(3);
        expect(result.data[0]).toEqual({
          id: 'keyword-1',
          keyword: '강남 맛집',
          createdAt: new Date('2024-01-01'),
        });
        expect(result.data[1]).toEqual({
          id: 'keyword-2',
          keyword: '서울 카페',
          createdAt: new Date('2024-01-02'),
        });
        expect(result.data[2]).toEqual({
          id: 'keyword-3',
          keyword: '홍대 술집',
          createdAt: new Date('2024-01-03'),
        });
        expect(result.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        });
      });

      it('should call keywordRepository.findAll', async () => {
        await useCase.execute();

        expect(mockKeywordRepository.findAll).toHaveBeenCalledTimes(1);
        expect(mockKeywordRepository.findAll).toHaveBeenCalledWith(undefined);
      });

      it('should return DTOs without placeKeywords relation', async () => {
        const result = await useCase.execute();

        result.data.forEach((dto) => {
          expect(dto).not.toHaveProperty('placeKeywords');
          expect(dto).toHaveProperty('id');
          expect(dto).toHaveProperty('keyword');
          expect(dto).toHaveProperty('createdAt');
        });
      });
    });

    describe('Empty Result', () => {
      it('should return empty array when no keywords exist', async () => {
        mockKeywordRepository.findAll.mockResolvedValue({
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        });

        const result = await useCase.execute();

        expect(result.data).toEqual([]);
        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors', async () => {
        const error = new Error('Database connection failed');
        mockKeywordRepository.findAll.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toThrow(error);
      });

      it('should handle database timeout errors', async () => {
        const timeoutError = new Error('Query timeout');
        mockKeywordRepository.findAll.mockRejectedValue(timeoutError);

        await expect(useCase.execute()).rejects.toThrow('Query timeout');
      });
    });

    describe('Large Dataset', () => {
      it('should handle large number of keywords', async () => {
        const largeDataset: Keyword[] = Array.from({ length: 1000 }, (_, i) => ({
          id: `keyword-${i}`,
          keyword: `키워드 ${i}`,
          createdAt: new Date(),
          placeKeywords: [],
        })) as Keyword[];

        mockKeywordRepository.findAll.mockResolvedValue({
          data: largeDataset,
          pagination: {
            page: 1,
            limit: 1000,
            total: 1000,
            totalPages: 1,
          },
        });

        const result = await useCase.execute();

        expect(result.data).toHaveLength(1000);
        expect(result.data[0].id).toBe('keyword-0');
        expect(result.data[999].id).toBe('keyword-999');
      });
    });

    describe('DTO Transformation', () => {
      beforeEach(() => {
        mockKeywordRepository.findAll.mockResolvedValue({
          data: mockKeywords,
          pagination: {
            page: 1,
            limit: 10,
            total: mockKeywords.length,
            totalPages: 1,
          },
        });
      });

      it('should preserve keyword text exactly', async () => {
        const result = await useCase.execute();

        expect(result.data[0].keyword).toBe('강남 맛집');
        expect(result.data[1].keyword).toBe('서울 카페');
        expect(result.data[2].keyword).toBe('홍대 술집');
      });

      it('should preserve timestamps exactly', async () => {
        const result = await useCase.execute();

        expect(result.data[0].createdAt).toEqual(new Date('2024-01-01'));
        expect(result.data[1].createdAt).toEqual(new Date('2024-01-02'));
        expect(result.data[2].createdAt).toEqual(new Date('2024-01-03'));
      });

      it('should preserve keyword IDs exactly', async () => {
        const result = await useCase.execute();

        expect(result.data[0].id).toBe('keyword-1');
        expect(result.data[1].id).toBe('keyword-2');
        expect(result.data[2].id).toBe('keyword-3');
      });
    });
  });
});
