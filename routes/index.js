import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

/**
  * adds route handlers to app
  * @param {Express} app
  */
function loadRoutes(app) {
  app.get('/status', AppController.status);
  app.get('/stats', AppController.stats);
  app.post('/users', UsersController.postNew);
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);
  app.get('/users/me', AuthController.getMe);
}

export default loadRoutes;
