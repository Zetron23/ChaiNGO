    // my-app-backend/routes/projectRoutes.js
    const express = require('express');
    // Import the new controller function
    const { createProject, getMyProjects, completeMilestone, getActiveProjects } = require('../controllers/projectController');
    const { protect, restrictTo } = require('../middleware/authMiddleware');

    const router = express.Router();

    // --- Project Routes ---

    // GET /api/projects - Get all active projects (for donor view) - Public
    router.get('/', getActiveProjects);

    // POST /api/projects - Create a new project (Requires logged-in NGO)
    router.post('/', protect, restrictTo('NGO'), createProject);

    // GET /api/projects/my-projects - Get projects for the logged-in NGO
    router.get('/my-projects', protect, restrictTo('NGO'), getMyProjects);

    // PUT /api/projects/:projectId/milestones/:milestoneId/complete - NGO marks milestone as complete/resubmit
    router.put('/:projectId/milestones/:milestoneId/complete', protect, restrictTo('NGO'), completeMilestone);


    // TODO: Add routes for getting single project, updating, deleting etc.
    // Example: router.get('/:projectId', getProjectById); // Could be public
    // Example: router.put('/:projectId', protect, restrictTo('NGO'), updateProject);
    // Example: router.delete('/:projectId', protect, restrictTo('NGO'), deleteProject);

    module.exports = router;
    