require('dotenv').config();
import env from 'env-var';

export const PORT = env.get('PORT').default('8090').asPortNumber();
export const KIVSEE_TOOLS_DIR = env.get('KIVSEE_TOOLS_DIR').required().asString();
export const RASP_HOST = env.get('RASP_HOST').default('localhost').asString();
