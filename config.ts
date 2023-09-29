require('dotenv').config();
import env from 'env-var';

export const PORT = env.get('PORT').default('8090').asPortNumber();
export const RASP_HOST = env.get('RASP_HOST').default('localhost').asString();
export const BACK_TIMEOUT_MINS = env.get('BACK_TIMEOUT_MINS').default('5').asIntPositive();
