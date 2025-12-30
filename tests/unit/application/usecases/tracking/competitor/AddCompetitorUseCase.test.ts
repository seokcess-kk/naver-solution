import { AddCompetitorUseCase } from '@application/usecases/tracking/competitor/AddCompetitorUseCase';
import { AddCompetitorDto } from '@application/dtos/tracking/competitor/AddCompetitorDto';
import { ICompetitorRepository } from '@domain/repositories/ICompetitorRepository';
import { IPlaceRepository } from '@domain/repositories/IPlaceRepository';
import { Competitor } from '@domain/entities/Competitor';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { NotFoundError, ConflictError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('AddCompetitorUseCase', () => {
  let useCase: AddCompetitorUseCase;
  let mockCompetitorRepository: jest.Mocked<ICompetitorRepository>;
  let mockPlaceRepository: jest.Mocked<IPlaceRepository>;

  beforeEach(() => {
    mockCompetitorRepository = MockFactory.createCompetitorRepository();
    mockPlaceRepository = MockFactory.createPlaceRepository();
    useCase = new AddCompetitorUseCase(mockCompetitorRepository, mockPlaceRepository);
  });

  describe('execute', () => {
    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      places: [],
      notificationSettings: [],
      refreshTokens: [],
    };

    const mockPlace: Place = {
      id: 'place-123',
      user: mockUser,
      naverPlaceId: 'naver-123',
      name: 'Test Restaurant',
      category: 'Korean Restaurant',
      address: 'Seoul, Korea',
      naverPlaceUrl: 'https://naver.com/place/123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      placeKeywords: [],
      reviews: [],
      reviewHistories: [],
      competitors: [],
      notificationSettings: [],
      notificationLogs: [],
    };

    const validDto: AddCompetitorDto = {
      placeId: 'place-123',
      competitorNaverPlaceId: 'competitor-naver-456',
      competitorName: 'Competitor Restaurant',
      category: 'Japanese Restaurant',
    };

    const mockCompetitor: Competitor = {
      id: 'competitor-123',
      place: mockPlace,
      competitorNaverPlaceId: 'competitor-naver-456',
      competitorName: 'Competitor Restaurant',
      category: 'Japanese Restaurant',
      isActive: true,
      createdAt: new Date(),
      competitorSnapshots: [],
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
        mockCompetitorRepository.save.mockResolvedValue(mockCompetitor);
      });

      it('should successfully add competitor with valid data', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockCompetitor.id);
        expect(result.placeId).toBe(mockPlace.id);
        expect(result.competitorNaverPlaceId).toBe(validDto.competitorNaverPlaceId);
        expect(result.competitorName).toBe(validDto.competitorName);
        expect(result.category).toBe(validDto.category);
        expect(result.isActive).toBe(true);
      });

      it('should validate Place exists', async () => {
        await useCase.execute(validDto);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(validDto.placeId);
      });

      it('should check for duplicate competitor', async () => {
        await useCase.execute(validDto);

        expect(mockCompetitorRepository.findByPlaceAndNaverId).toHaveBeenCalledWith(
          validDto.placeId,
          validDto.competitorNaverPlaceId
        );
      });

      it('should save Competitor with correct data', async () => {
        await useCase.execute(validDto);

        expect(mockCompetitorRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            place: mockPlace,
            competitorNaverPlaceId: validDto.competitorNaverPlaceId,
            competitorName: validDto.competitorName,
            category: validDto.category,
            isActive: true,
          })
        );
      });

      it('should return CompetitorResponseDto with relations', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('competitorNaverPlaceId');
        expect(result).toHaveProperty('competitorName');
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('placeName');
      });

      it('should include placeName from relations', async () => {
        const result = await useCase.execute(validDto);

        expect(result.placeName).toBe(mockPlace.name);
      });
    });

    describe('Error Cases - Validation', () => {
      it('should throw NotFoundError when Place does not exist', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(NotFoundError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Place with id ${validDto.placeId} not found`
        );
      });

      it('should throw ConflictError when competitor already exists', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(mockCompetitor);

        await expect(useCase.execute(validDto)).rejects.toThrow(ConflictError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          `Competitor with naverPlaceId ${validDto.competitorNaverPlaceId} already exists for this place`
        );
      });
    });

    describe('Error Cases - Repository Errors', () => {
      it('should propagate repository errors when finding Place', async () => {
        const error = new Error('Database connection failed');
        mockPlaceRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when checking duplicate', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        const error = new Error('Failed to check duplicate');
        mockCompetitorRepository.findByPlaceAndNaverId.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving Competitor', async () => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
        const error = new Error('Failed to save competitor');
        mockCompetitorRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Optional Fields', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
      });

      it('should handle competitor without category', async () => {
        const dtoWithoutCategory: AddCompetitorDto = {
          ...validDto,
          category: undefined,
        };
        const competitorWithoutCategory = { ...mockCompetitor, category: null };
        mockCompetitorRepository.save.mockResolvedValue(competitorWithoutCategory);

        const result = await useCase.execute(dtoWithoutCategory);

        expect(result.category).toBeNull();
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
        mockCompetitorRepository.save.mockResolvedValue(mockCompetitor);
      });

      it('should validate Place before checking duplicate', async () => {
        await useCase.execute(validDto);

        const findPlaceCall = mockPlaceRepository.findById.mock.invocationCallOrder[0];
        const checkDuplicateCall =
          mockCompetitorRepository.findByPlaceAndNaverId.mock.invocationCallOrder[0];

        expect(findPlaceCall).toBeLessThan(checkDuplicateCall);
      });

      it('should check duplicate before saving', async () => {
        await useCase.execute(validDto);

        const checkDuplicateCall =
          mockCompetitorRepository.findByPlaceAndNaverId.mock.invocationCallOrder[0];
        const saveCall = mockCompetitorRepository.save.mock.invocationCallOrder[0];

        expect(checkDuplicateCall).toBeLessThan(saveCall);
      });

      it('should not check duplicate if Place not found', async () => {
        mockPlaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockCompetitorRepository.findByPlaceAndNaverId).not.toHaveBeenCalled();
      });

      it('should not save if duplicate exists', async () => {
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(mockCompetitor);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockCompetitorRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
        mockCompetitorRepository.save.mockResolvedValue(mockCompetitor);
      });

      it('should handle different Place ID formats', async () => {
        const uuidPlaceId = '550e8400-e29b-41d4-a716-446655440000';
        const dtoWithUuid: AddCompetitorDto = {
          ...validDto,
          placeId: uuidPlaceId,
        };

        await useCase.execute(dtoWithUuid);

        expect(mockPlaceRepository.findById).toHaveBeenCalledWith(uuidPlaceId);
      });

      it('should handle maximum length competitor name (200 chars)', async () => {
        const longName = 'A'.repeat(200);
        const dtoWithLongName: AddCompetitorDto = {
          ...validDto,
          competitorName: longName,
        };

        await useCase.execute(dtoWithLongName);

        expect(mockCompetitorRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            competitorName: longName,
          })
        );
      });

      it('should handle maximum length category (50 chars)', async () => {
        const longCategory = 'B'.repeat(50);
        const dtoWithLongCategory: AddCompetitorDto = {
          ...validDto,
          category: longCategory,
        };

        await useCase.execute(dtoWithLongCategory);

        expect(mockCompetitorRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            category: longCategory,
          })
        );
      });
    });

    describe('isActive Default Value', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
        mockCompetitorRepository.save.mockResolvedValue(mockCompetitor);
      });

      it('should set isActive to true by default', async () => {
        await useCase.execute(validDto);

        expect(mockCompetitorRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: true,
          })
        );
      });

      it('should return isActive as true in response', async () => {
        const result = await useCase.execute(validDto);

        expect(result.isActive).toBe(true);
      });
    });

    describe('Response DTO Mapping', () => {
      beforeEach(() => {
        mockPlaceRepository.findById.mockResolvedValue(mockPlace);
        mockCompetitorRepository.findByPlaceAndNaverId.mockResolvedValue(null);
        mockCompetitorRepository.save.mockResolvedValue(mockCompetitor);
      });

      it('should include all Competitor fields in response', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('placeId');
        expect(result).toHaveProperty('competitorNaverPlaceId');
        expect(result).toHaveProperty('competitorName');
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('isActive');
        expect(result).toHaveProperty('createdAt');
      });

      it('should map placeId correctly', async () => {
        const result = await useCase.execute(validDto);

        expect(result.placeId).toBe(mockPlace.id);
      });
    });
  });
});
