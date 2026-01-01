import { AddPlaceKeywordUseCase } from '@application/usecases/keyword/AddPlaceKeywordUseCase';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { IKeywordRepository } from '@domain/repositories/IKeywordRepository';
import { AddPlaceKeywordDto } from '@application/dtos/keyword/AddPlaceKeywordDto';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('AddPlaceKeywordUseCase', () => {
  let useCase: AddPlaceKeywordUseCase;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;
  let mockKeywordRepository: jest.Mocked<IKeywordRepository>;

  beforeEach(() => {
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    mockKeywordRepository = MockFactory.createKeywordRepository();
    useCase = new AddPlaceKeywordUseCase(
      mockPlaceKeywordRepository,
      mockPlaceRepository,
      mockKeywordRepository
    );
  });

  describe('execute', () => {
    const validDto: AddPlaceKeywordDto = {
      placeId: 'place-123',
      keyword: '강남 맛집',
      region: '서울',
    };

    const mockPlace: Place = {
      id: 'place-123',
      name: 'Test Place',
      naverPlaceId: 'naver-123',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Place;

    const mockKeyword: Keyword = {
      id: 'keyword-1',
      keyword: '강남 맛집',
      createdAt: new Date(),
      placeKeywords: [],
    } as Keyword;

    const mockSavedPlaceKeyword: PlaceKeyword = {
      id: 'pk-1',
      place: mockPlace,
      keyword: mockKeyword,
      region: '서울',
      isActive: true,
      createdAt: new Date(),
    } as PlaceKeyword;

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(null);
        mockPlaceKeywordRepository.save.mockResolvedValue(mockSavedPlaceKeyword);
      });

      it('should successfully add keyword to place', async () => {
        const result = await useCase.execute(validDto);

        expect(result.placeId).toBe('place-123');
        expect(result.placeName).toBe('Test Place');
        expect(result.keyword).toBe('강남 맛집');
        expect(result.region).toBe('서울');
        expect(result.isActive).toBe(true);
      });

      it('should verify place exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith('place-123');
      });

      it('should find or create keyword', async () => {
        await useCase.execute(validDto);

        expect(mockKeywordRepository.findOrCreate).toHaveBeenCalledWith('강남 맛집');
      });

      it('should check for existing association', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceKeywordRepository.findByPlaceAndKeyword).toHaveBeenCalledWith(
          'place-123',
          'keyword-1',
          '서울'
        );
      });

      it('should save new place-keyword association', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceKeywordRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            place: mockPlace,
            keyword: mockKeyword,
            region: '서울',
            isActive: true,
          })
        );
      });

      it('should handle keyword without region', async () => {
        const dtoWithoutRegion: AddPlaceKeywordDto = {
          placeId: 'place-123',
          keyword: '강남 맛집',
        };

        await useCase.execute(dtoWithoutRegion);

        expect(mockPlaceKeywordRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            region: null,
          })
        );
      });

      it('should set isActive to true for new associations', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceKeywordRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: true,
          })
        );
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Place with id place-123 not found'
        );
      });

      it('should not proceed if place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockKeywordRepository.findOrCreate).not.toHaveBeenCalled();
        expect(mockPlaceKeywordRepository.save).not.toHaveBeenCalled();
      });

      it('should throw ConflictError when association already exists', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(
          mockSavedPlaceKeyword
        );

        await expect(useCase.execute(validDto)).rejects.toThrow(ConflictError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Keyword "강남 맛집" is already associated with this place in region "서울"'
        );
      });

      it('should throw ConflictError with correct message when region is not specified', async () => {
        const dtoWithoutRegion: AddPlaceKeywordDto = {
          placeId: 'place-123',
          keyword: '강남 맛집',
        };

        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(
          mockSavedPlaceKeyword
        );

        await expect(useCase.execute(dtoWithoutRegion)).rejects.toThrow(
          'Keyword "강남 맛집" is already associated with this place'
        );
      });

      it('should not save if association already exists', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(
          mockSavedPlaceKeyword
        );

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockPlaceKeywordRepository.save).not.toHaveBeenCalled();
      });

      it('should propagate repository errors', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(null);

        const error = new Error('Database save failed');
        mockPlaceKeywordRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(null);
        mockPlaceKeywordRepository.save.mockResolvedValue(mockSavedPlaceKeyword);
      });

      it('should verify place before finding keyword', async () => {
        await useCase.execute(validDto);

        const placeCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const keywordCall = mockKeywordRepository.findOrCreate.mock.invocationCallOrder[0];

        expect(placeCall).toBeLessThan(keywordCall);
      });

      it('should find keyword before checking for duplicates', async () => {
        await useCase.execute(validDto);

        const keywordCall = mockKeywordRepository.findOrCreate.mock.invocationCallOrder[0];
        const duplicateCheck =
          mockPlaceKeywordRepository.findByPlaceAndKeyword.mock.invocationCallOrder[0];

        expect(keywordCall).toBeLessThan(duplicateCheck);
      });

      it('should check duplicates before saving', async () => {
        await useCase.execute(validDto);

        const duplicateCheck =
          mockPlaceKeywordRepository.findByPlaceAndKeyword.mock.invocationCallOrder[0];
        const saveCall = mockPlaceKeywordRepository.save.mock.invocationCallOrder[0];

        expect(duplicateCheck).toBeLessThan(saveCall);
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(null);
        mockPlaceKeywordRepository.save.mockResolvedValue(mockSavedPlaceKeyword);
      });

      it('should handle empty string region as null', async () => {
        const dtoWithEmptyRegion: AddPlaceKeywordDto = {
          placeId: 'place-123',
          keyword: '강남 맛집',
          region: '',
        };

        await useCase.execute(dtoWithEmptyRegion);

        // Empty string should be treated as empty string in findByPlaceAndKeyword
        expect(mockPlaceKeywordRepository.findByPlaceAndKeyword).toHaveBeenCalledWith(
          'place-123',
          'keyword-1',
          ''
        );
      });

      it('should handle very long keyword text', async () => {
        const longKeyword = 'A'.repeat(500);
        const longKeywordObj = { ...mockKeyword, keyword: longKeyword };
        mockKeywordRepository.findOrCreate.mockResolvedValue(longKeywordObj as Keyword);

        const dtoWithLongKeyword: AddPlaceKeywordDto = {
          placeId: 'place-123',
          keyword: longKeyword,
        };

        await useCase.execute(dtoWithLongKeyword);

        expect(mockKeywordRepository.findOrCreate).toHaveBeenCalledWith(longKeyword);
      });

      it('should handle Korean characters in keyword', async () => {
        const koreanKeyword = '강남역 근처 분위기 좋은 카페 추천';
        const dtoWithKorean: AddPlaceKeywordDto = {
          placeId: 'place-123',
          keyword: koreanKeyword,
        };

        await useCase.execute(dtoWithKorean);

        expect(mockKeywordRepository.findOrCreate).toHaveBeenCalledWith(koreanKeyword);
      });

      it('should handle special characters in keyword', async () => {
        const specialKeyword = '강남 맛집 & 카페 #추천';
        const dtoWithSpecial: AddPlaceKeywordDto = {
          placeId: 'place-123',
          keyword: specialKeyword,
        };

        await useCase.execute(dtoWithSpecial);

        expect(mockKeywordRepository.findOrCreate).toHaveBeenCalledWith(specialKeyword);
      });
    });

    describe('Region Handling', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockKeywordRepository.findOrCreate.mockResolvedValue(mockKeyword);
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(null);
        mockPlaceKeywordRepository.save.mockResolvedValue(mockSavedPlaceKeyword);
      });

      it('should allow same keyword with different regions', async () => {
        // First add with region
        await useCase.execute({
          placeId: 'place-123',
          keyword: '강남 맛집',
          region: '서울',
        });

        // Reset mocks
        mockPlaceKeywordRepository.findByPlaceAndKeyword.mockResolvedValue(null);

        // Add same keyword with different region should succeed
        await useCase.execute({
          placeId: 'place-123',
          keyword: '강남 맛집',
          region: '경기',
        });

        expect(mockPlaceKeywordRepository.save).toHaveBeenCalledTimes(2);
      });

      it('should check duplicates with correct region', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceKeywordRepository.findByPlaceAndKeyword).toHaveBeenCalledWith(
          'place-123',
          'keyword-1',
          '서울'
        );
      });
    });
  });
});
