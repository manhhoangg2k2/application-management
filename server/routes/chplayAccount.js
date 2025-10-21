// server/routes/chplayAccounts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const chplayController = require('../controllers/chplayAccountController');

// Chỉ Admin được phép CRUD tài khoản CHPlay
router.route('/')
    .get(protect, authorize('admin'), chplayController.getCHPlayAccounts)
    .post(protect, authorize('admin'), chplayController.createCHPlayAccount);

router.route('/:id')
    .get(protect, chplayController.getCHPlayAccount)
    .put(protect, authorize('admin'), chplayController.updateCHPlayAccount)
    .delete(protect, authorize('admin'), chplayController.deleteCHPlayAccount);

module.exports = router;
