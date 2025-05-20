import type { Schema, Struct } from '@strapi/strapi';

export interface ImageImageQuestion extends Struct.ComponentSchema {
  collectionName: 'components_image_image_questions';
  info: {
    displayName: 'Image Question';
    icon: 'apps';
  };
  attributes: {
    imageQuestion: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'image.image-question': ImageImageQuestion;
    }
  }
}
