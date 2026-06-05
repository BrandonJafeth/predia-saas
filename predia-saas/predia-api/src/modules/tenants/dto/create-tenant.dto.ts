import {IsString, IsNotEmpty, Matches} from 'class-validator';

export class CreateTenantDto {
    @IsString() @IsNotEmpty()
    name!: string;

    @IsString() @IsNotEmpty()
    @Matches(/^[a-z0-9-]+$/, { message: 'Solo minúsculas, números y guiones' })
    slug!: string;
}
