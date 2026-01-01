export class PlaceStatsResponseDto {
  totalPlaces: number;
  activePlaces: number;
  inactivePlaces: number;

  constructor(totalPlaces: number, activePlaces: number) {
    this.totalPlaces = totalPlaces;
    this.activePlaces = activePlaces;
    this.inactivePlaces = totalPlaces - activePlaces;
  }
}
