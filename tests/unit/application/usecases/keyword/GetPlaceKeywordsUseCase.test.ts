import { GetPlaceKeywordsUseCase } from '@application/usecases/keyword/GetPlaceKeywordsUseCase';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Place } from '@domain/entities/Place';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { Keyword } from '@domain/entities/Keyword';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('GetPlaceKeywordsUseCase', () => {
  let useCase: GetPlaceKeywordsUseCase;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new GetPlaceKeywordsUseCase(mockPlaceKeywordRepository, mockPlaceRepository);
  });

  describe('execute', () => {
    const validPlaceId = 'place-123';
    const mockPlace: Place = {
      id: validPlaceId,
      name: 'Test Place',
      naverPlaceId: 'naver-123',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Place;

    const mockPlaceKeywords: PlaceKeyword[] = [
      {
        id: 'pk-1',
        place: mockPlace,
        keyword: { id: 'keyword-1', keyword: '강남 맛집' } as Keyword,
        region: '서울',
        isActive: true,
        createdAt: new Date('2024-01-01'),
      } as PlaceKeyword,
      {
        id: 'pk-2',
        place: mockPlace,
        keyword: { id: 'keyword-2', keyword: '서울 카페' } as Keyword,
        region: null,
        isActive: true,
        createdAt: new Date('2024-01-02'),
      } as PlaceKeyword,
      {
        id: 'pk-3',
        place: mockPlace,
        keyword: { id: 'keyword-3', keyword: '홍대 술집' } as Keyword,
        region: '서울',
        isActive: false,
        createdAt: new Date('2024-01-03'),
      } as PlaceKeyword,
    ];

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceKeywordRepository.findByPlaceId.mockResolvedValue(mockPlaceKeywords);
      });

      it('should return all keywords for a place', async () => {
        const result = await useCase.execute(validPlaceId);

        expect(result).toHaveLength(3);
        expect(result[0].placeId).toBe(validPlaceId);
        expect(result[0].placeName).toBe('Test Place');
        expect(result[0].keyword).toBe('강남 맛집');
        expect(result[0].region).toBe('서울');
        expect(result[0].isActive).toBe(true);
      });

      it('should verify place exists before fetching keywords', async () => {
        await useCase.execute(validPlaceId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(validPlaceId);
      });

      it('should include both active and inactive keywords', async () => {
        const result = await useCase.execute(validPlaceId);

        const activeCount = result.filter((k) => k.isActive).length;
        const inactiveCount = result.filter((k) => !k.isActive).length;

        expect(activeCount).toBe(2);
        expect(inactiveCount).toBe(1);
      });

      it('should include keywords with and without regions', async () => {
        const result = await useCase.execute(validPlaceId);

        const withRegion = result.filter((k) => k.region !== null).length;
        const withoutRegion = result.filter((k) => k.region === null).length;

        expect(withRegion).toBe(2);
        expect(withoutRegion).toBe(1);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('non-existent-place')).rejects.toThrow(NotFoundError);
        await expect(useCase.execute('non-existent-place')).rejects.toThrow(
          'Place with id non-existent-place not found'
        );
      });

      it('should not call findByPlaceId if place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('non-existent-place')).rejects.toThrow();

        expect(mockPlaceKeywordRepository.findByPlaceId).not.toHaveBeenCalled();
      });

      it('should propagate repository errors', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Database connection failed');
        mockPlaceKeywordRepository.findByPlaceId.mockRejectedValue(error);

        await expect(useCase.execute(validPlaceId)).rejects.toThrow(error);
      });
    });

    describe('Empty Result', () => {
      it('should return empty array when place has no keywords', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceKeywordRepository.findByPlaceId.mockResolvedValue([]);

        const result = await useCase.execute(validPlaceId);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('DTO Transformation', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceKeywordRepository.findByPlaceId.mockResolvedValue(mockPlaceKeywords);
      });

      it('should transform to PlaceKeywordResponseDto correctly', async () => {
        const result = await useCase.execute(validPlaceId);

        expect(result[0]).toEqual({
          id: 'pk-1',
          placeId: validPlaceId,
          placeName: 'Test Place',
          keywordId: 'keyword-1',
          keyword: '강남 맛집',
          region: '서울',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        });
      });

      it('should handle null regions in DTO', async () => {
        const result = await useCase.execute(validPlaceId);

        expect(result[1].region).toBeNull();
      });

      it('should preserve all field values exactly', async () => {
        const result = await useCase.execute(validPlaceId);

        result.forEach((dto, index) => {
          expect(dto.id).toBe(mockPlaceKeywords[index].id);
          expect(dto.keywordId).toBe(mockPlaceKeywords[index].keyword.id);
          expect(dto.keyword).toBe(mockPlaceKeywords[index].keyword.keyword);
          expect(dto.region).toBe(mockPlaceKeywords[index].region);
          expect(dto.isActive).toBe(mockPlaceKeywords[index].isActive);
          expect(dto.createdAt).toBe(mockPlaceKeywords[index].createdAt);
        });
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockPlaceKeywordRepository.findByPlaceId.mockResolvedValue(mockPlaceKeywords);
      });

      it('should check place existence before fetching keywords', async () => {
        await useCase.execute(validPlaceId);

        const placeCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const keywordsCall = mockPlaceKeywordRepository.findByPlaceId.mock.invocationCallOrder[0];

        expect(placeCall).toBeLessThan(keywordsCall);
      });
    });

    describe('Edge Cases', () => {
      it('should handle UUID format place IDs', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        mockPlaceRepository.findById.mockResolvedValue({ ...mockPlace, id: uuidPlaceId } as Place);
        mockPlaceKeywordRepository.findByPlaceId.mockResolvedValue([]);

        await useCase.execute(uuidPlaceId);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
        expect(mockPlaceKeywordRepository.findByPlaceId).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle very long place names', async () => {
        const longName = 'A'.repeat(500);
        const placeWithLongName = { ...mockPlace, name: longName };
        const placeKeywordsWithLongName = mockPlaceKeywords.map((pk) => ({
          ...pk,
          place: placeWithLongName,
        }));
        mockPlaceRepository.findById.mockResolvedValue(placeWithLongName as Place);
        mockPlaceKeywordRepository.findByPlaceId.mockResolvedValue(placeKeywordsWithLongName);

        const result = await useCase.execute(validPlaceId);

        expect(result[0].placeName).toBe(longName);
      });
    });
  });
});
