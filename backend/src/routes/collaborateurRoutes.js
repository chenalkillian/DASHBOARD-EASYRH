const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getAll, create, getById, update, remove } = require('../controllers/collaborateurController');

const CONTRATS_VALIDES = ['CDI', 'CDD', 'Stage', 'Alternance'];
const ROLES_VALIDES = ['RH', 'Manager', 'Collaborateur'];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const postCollaborateurRules = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire'),
  body('poste').trim().notEmpty().withMessage('Le poste est obligatoire'),
  body('service').trim().notEmpty().withMessage('Le service est obligatoire'),
  body('date_embauche')
    .notEmpty()
    .withMessage("La date d'embauche est obligatoire")
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("La date d'embauche doit être valide (format ISO)"),
  body('contrat')
    .notEmpty()
    .withMessage('Le contrat est obligatoire')
    .isIn(CONTRATS_VALIDES)
    .withMessage(`Le contrat doit être parmi : ${CONTRATS_VALIDES.join(', ')}`),
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'email est obligatoire")
    .isEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe temporaire est obligatoire')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

const putCollaborateurRules = [
  body('nom').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('prenom').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('poste').optional().trim().notEmpty().withMessage('Le poste ne peut pas être vide'),
  body('service').optional().trim().notEmpty().withMessage('Le service ne peut pas être vide'),
  body('date_embauche')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("La date d'embauche doit être valide (format ISO)"),
  body('contrat')
    .optional()
    .isIn(CONTRATS_VALIDES)
    .withMessage(`Le contrat doit être parmi : ${CONTRATS_VALIDES.join(', ')}`),
  body('role')
    .optional()
    .isIn(ROLES_VALIDES)
    .withMessage(`Le rôle doit être parmi : ${ROLES_VALIDES.join(', ')}`),
];

// Protégées RH uniquement
router.use(authenticate, authorize('RH'));

router.get('/', getAll);
router.post('/', postCollaborateurRules, validate, create);
router.get('/:id', getById);
router.put('/:id', putCollaborateurRules, validate, update);
router.delete('/:id', remove);

module.exports = router;
