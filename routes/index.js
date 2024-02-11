import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

function loadRoutes(app) {
  app.get('/status', AppController.status);
  app.get('/stats', AppController.stats);
  app.post('/users', UsersController.postNew);
}

export default loadRoutes;
