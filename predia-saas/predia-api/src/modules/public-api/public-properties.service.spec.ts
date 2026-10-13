import { cloudinaryVariant } from './public-properties.service';

describe('cloudinaryVariant', () => {
  it('inserta la transformación en URLs de Cloudinary', () => {
    expect(
      cloudinaryVariant(
        'https://res.cloudinary.com/demo/image/upload/v1/predia/t/p/foto.jpg',
        'c_limit,w_1600',
      ),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_limit,w_1600/v1/predia/t/p/foto.jpg',
    );
  });

  it('deja intactas las URLs que no son de Cloudinary', () => {
    const url = 'https://cdn.example.com/image/upload/foto.jpg';
    expect(cloudinaryVariant(url, 'c_limit,w_1600')).toBe(url);
  });
});
