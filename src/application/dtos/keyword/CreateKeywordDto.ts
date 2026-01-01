import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateKeywordDto {
  @IsString()
  @MinLength(1, { message: 'Keyword must not be empty' })
  @MaxLength(100, { message: 'Keyword must not exceed 100 characters' })
  keyword: string;
}
