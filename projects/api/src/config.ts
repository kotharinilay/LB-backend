
class Config {

    PORT: any = process.env.PORT || 8080;

    DB_HOST: string = process.env.DB_HOST || 'localhost';
    DB_USER: string = process.env.DB_USER || '';
    DB_PASSWORD: string = process.env.DB_PASSWORD || '';
    DB_NAME: string = process.env.DB_NAME || '';

}

export default new Config()
