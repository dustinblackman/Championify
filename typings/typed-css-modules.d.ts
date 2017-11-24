declare module "typed-css-modules" {
  interface Contents {
    formatted: string;
  }

  class DTSCreator {
    create(file_path: string, contents?: string): Promise<Contents>;
  }

  export = DTSCreator;
}
