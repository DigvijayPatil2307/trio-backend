import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createTrip,
  getTrips,
  getTripById,
  deleteTrip,
  updateTrip,
  addActivity,
  removeActivity,
  regenerateDay,
  inviteCompanion
} from "../controllers/tripController.js";

const router = express.Router();

router.route("/")
  .post(protect, createTrip)
  .get(protect, getTrips);

router.route("/:id")
  .get(protect, getTripById)
  .put(protect, updateTrip)
  .delete(protect, deleteTrip);

router.patch("/:id/add-activity", protect, addActivity);
router.patch("/:id/remove-activity", protect, removeActivity);
router.patch("/:id/regenerate-day", protect, regenerateDay);
router.patch("/:id/invite", protect, inviteCompanion);

export default router;
