import { RemovePlaceKeywordUseCase } from '@application/usecases/keyword/RemovePlaceKeywordUseCase';
import { IPlaceKeywordRepository } from '@domain/repositories/IPlaceKeywordRepository';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { NotFoundError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('RemovePlaceKeywordUseCase', () => {
  let useCase: RemovePlaceKeywordUseCase;
  let mockPlaceKeywordRepository: jest.Mocked<IPlaceKeywordRepository>;

  beforeEach(() => {
    mockPlaceKeywordRepository = MockFactory.createPlaceKeywordRepository();
    useCase = new RemovePlaceKeywordUseCase(mockPlaceKeywordRepository);
  });

  describe('execute', () => {
    const validPlaceKeywordId = 'pk-123';

    const mockPlaceKeyword: PlaceKeyword = {
      id: validPlaceKeywordId,
      place: {
        id: 'place-1',
        name: 'Test Place',
      } as Place,
      keyword: {
        id: 'keyword-1',
        keyword: '강남 맛집',
      } as Keyword,
      region: '서울',
      isActive: true,
      createdAt: new Date(),
    } as PlaceKeyword;

    describe('Happy Path', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockPlaceKeywordRepository.delete.mockResolvedValue(undefined);
      });

      it('should successfully remove place-keyword association', async () => {
        await useCase.execute(validPlaceKeywordId);

        expect(mockPlaceKeywordRepository.delete).toHaveBeenCalledWith(validPlaceKeywordId);
      });

      it('should verify place-keyword exists before deleting', async () => {
        await useCase.execute(validPlaceKeywordId);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(validPlaceKeywordId);
      });

      it('should not return any value', async () => {
        const result = await useCase.execute(validPlaceKeywordId);

        expect(result).toBeUndefined();
      });

      it('should call delete exactly once', async () => {
        await useCase.execute(validPlaceKeywordId);

        expect(mockPlaceKeywordRepository.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Cases', () => {
      it('should throw NotFoundError when place-keyword does not exist', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundError);
        await expect(useCase.execute('non-existent-id')).rejects.toThrow(
          'PlaceKeyword with id non-existent-id not found'
        );
      });

      it('should not call delete when place-keyword not found', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('non-existent-id')).rejects.toThrow();

        expect(mockPlaceKeywordRepository.delete).not.toHaveBeenCalled();
      });

      it('should propagate repository find errors', async () => {
        const error = new Error('Database connection failed');
        mockPlaceKeywordRepository.findById.mockRejectedValue(error);

        await expect(useCase.execute(validPlaceKeywordId)).rejects.toThrow(error);
      });

      it('should propagate repository delete errors', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        const error = new Error('Delete operation failed');
        mockPlaceKeywordRepository.delete.mockRejectedValue(error);

        await expect(useCase.execute(validPlaceKeywordId)).rejects.toThrow(error);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockPlaceKeywordRepository.delete.mockResolvedValue(undefined);
      });

      it('should find place-keyword before deleting', async () => {
        await useCase.execute(validPlaceKeywordId);

        const findCall = mockPlaceKeywordRepository.findById.mock.invocationCallOrder[0];
        const deleteCall = mockPlaceKeywordRepository.delete.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(deleteCall);
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockPlaceKeywordRepository.delete.mockResolvedValue(undefined);
      });

      it('should handle UUID format IDs', async () => {
        const uuidId = '550e8400-e29b-41d4-a716-446655440000';
        const pkWithUuid = { ...mockPlaceKeyword, id: uuidId };
        mockPlaceKeywordRepository.findById.mockResolvedValue(pkWithUuid as PlaceKeyword);

        await useCase.execute(uuidId);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(uuidId);
        expect(mockPlaceKeywordRepository.delete).toHaveBeenCalledWith(uuidId);
      });

      it('should handle active place-keywords', async () => {
        const activePk = { ...mockPlaceKeyword, isActive: true };
        mockPlaceKeywordRepository.findById.mockResolvedValue(activePk as PlaceKeyword);

        await expect(useCase.execute(validPlaceKeywordId)).resolves.not.toThrow();
      });

      it('should handle inactive place-keywords', async () => {
        const inactivePk = { ...mockPlaceKeyword, isActive: false };
        mockPlaceKeywordRepository.findById.mockResolvedValue(inactivePk as PlaceKeyword);

        await expect(useCase.execute(validPlaceKeywordId)).resolves.not.toThrow();
      });

      it('should handle place-keywords with null region', async () => {
        const pkWithoutRegion = { ...mockPlaceKeyword, region: null };
        mockPlaceKeywordRepository.findById.mockResolvedValue(pkWithoutRegion as PlaceKeyword);

        await expect(useCase.execute(validPlaceKeywordId)).resolves.not.toThrow();
      });
    });

    describe('Idempotency', () => {
      it('should fail if trying to delete same place-keyword twice', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockPlaceKeywordRepository.delete.mockResolvedValue(undefined);

        // First delete succeeds
        await useCase.execute(validPlaceKeywordId);

        // Second attempt should fail (place-keyword not found)
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(validPlaceKeywordId)).rejects.toThrow(NotFoundError);
      });
    });

    describe('Data Integrity', () => {
      beforeEach(() => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(mockPlaceKeyword);
        mockPlaceKeywordRepository.delete.mockResolvedValue(undefined);
      });

      it('should not modify place-keyword object before deletion', async () => {
        await useCase.execute(validPlaceKeywordId);

        // Only findById and delete should be called, no save or update
        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalled();
        expect(mockPlaceKeywordRepository.delete).toHaveBeenCalled();
        expect((mockPlaceKeywordRepository as any).save).not.toHaveBeenCalled();
        expect((mockPlaceKeywordRepository as any).update).not.toHaveBeenCalled();
      });

      it('should use exact ID passed to execute', async () => {
        const exactId = 'exact-pk-id-123';
        const pkWithId = { ...mockPlaceKeyword, id: exactId };
        mockPlaceKeywordRepository.findById.mockResolvedValue(pkWithId as PlaceKeyword);

        await useCase.execute(exactId);

        expect(mockPlaceKeywordRepository.findById).toHaveBeenCalledWith(exactId);
        expect(mockPlaceKeywordRepository.delete).toHaveBeenCalledWith(exactId);
      });
    });

    describe('Error Messages', () => {
      it('should include place-keyword ID in error message', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        const specificId = 'specific-pk-id-456';
        await expect(useCase.execute(specificId)).rejects.toThrow(
          `PlaceKeyword with id ${specificId} not found`
        );
      });

      it('should throw NotFoundError with correct type', async () => {
        mockPlaceKeywordRepository.findById.mockResolvedValue(null);

        try {
          await useCase.execute('some-id');
          fail('Should have thrown NotFoundError');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundError);
        }
      });
    });
  });
});
