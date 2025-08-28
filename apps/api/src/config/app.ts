// Configurações gerais da aplicação
export const appConfig = {
  port: parseInt(process.env.PORT || "8001"),
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
};

export default appConfig;
