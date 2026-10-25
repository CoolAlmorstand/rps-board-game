import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  SERVER_URL: {
   public: true 
  },
});
