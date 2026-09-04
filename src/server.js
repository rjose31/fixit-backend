require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

// Importamos los modelos aquí para que Sequelize registre las
// asociaciones (User.hasMany(RefreshToken), etc.) antes del sync/arranque.
require('./models/user.model');
require('./models/refreshToken.model');
require('./models/categoria.model');
require('./models/proveedor.model');

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');

    // ⚠️ IMPORTANTE PARA EL ESTUDIANTE:
    // `sync({ alter: true })` es cómodo en desarrollo (ajusta las
    // tablas automáticamente a los modelos), pero JAMÁS se usa así en
    // producción -- puede borrar o alterar datos de forma destructiva.
    // En producción se usan migraciones explícitas (sequelize-cli).
    // Lo veremos formalmente en la Semana 3.
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Modelos sincronizados con la base de datos.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor FixIt corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
