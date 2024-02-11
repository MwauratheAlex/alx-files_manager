import AppController from '../controllers/AppController';

function loadRoutes(app) {
  app.get('/status', AppController.status);
  app.get('/stats', AppController.stats);
}

export default loadRoutes;
