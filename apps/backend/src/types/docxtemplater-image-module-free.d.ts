declare module 'docxtemplater-image-module-free' {
  interface ImageModuleOptions {
    getImage: (tagValue: unknown, tagName: string) => Buffer;
    getSize: (
      img: Buffer,
      tagValue: unknown,
      tagName: string,
    ) => [number, number];
    centered?: boolean;
  }
  export default class ImageModule {
    constructor(options: ImageModuleOptions);
  }
}
