import { AuthRequest } from "../middlewares/auth.js";
import { Trip } from "../models/Trip.js";
import { GeminiProvider } from "../services/GeminiProvider.js";
import { Response } from "express";

const aiProvider = new GeminiProvider();

export const createTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { destination, numberOfDays, budgetType, interests } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate Itinerary
    const itinerary = await aiProvider.generateItinerary({
      destination,
      numberOfDays,
      budgetType,
      interests,
    });

    const trip = await Trip.create({
      userId: req.user.id,
      destination,
      numberOfDays,
      budgetType,
      interests,
      itinerary,
    });

    res.status(201).json(trip);
  } catch (error: any) {
    console.error("Create trip error:", error);
    res.status(500).json({ error: "Failed to create trip", details: error.message });
  }
};

export const getTrips = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get trips" });
  }
};

export const getTripById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get trip" });
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    
    res.json({ message: "Trip deleted" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete trip" });
  }
};

export const updateTrip = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    
    // Allow updating manual fields if we want, but usually used for minor edits
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
       req.body,
      { new: true }
    );
    
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    
    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update trip" });
  }
};

export const addActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { day, activity } = req.body;
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const dayObj = trip.itinerary.days.find(d => d.day === day);
    if (dayObj) {
      // 1. Add activity
      dayObj.activities.push(activity);
      
      // 2. Adjust budget for adding one activity
      if (trip.itinerary.budget) {
        const budget = trip.itinerary.budget;
        budget.activities = (budget.activities || 0) + 50;
        
        // Recalculate total budget
        budget.total = (budget.flights || 0) + 
                       (budget.accommodation || 0) + 
                       (budget.food || 0) + 
                       (budget.activities || 0) + 
                       (budget.transportation || 0);
      }

      trip.markModified('itinerary');
      await trip.save();
    }
    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add activity" });
  }
};

export const removeActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { day, activityIndex, removeDay } = req.body;
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const dayObj = trip.itinerary.days.find(d => d.day === day);
    if (dayObj) {
      // 1. Remove activity
      dayObj.activities.splice(activityIndex, 1);
      
      // 2. Adjust budget for removing one activity
      if (trip.itinerary.budget) {
        trip.itinerary.budget.activities = Math.max(0, (trip.itinerary.budget.activities || 0) - 50);
      }

      // 3. Remove day if requested
      if (removeDay) {
        const currentDays = trip.numberOfDays;
        
        // Remove the day from array
        trip.itinerary.days = trip.itinerary.days.filter(d => d.day !== day);
        
        // Renumber days
        trip.itinerary.days.forEach((d, idx) => {
          d.day = idx + 1;
        });
        
        // Decrement number of days
        trip.numberOfDays = Math.max(1, currentDays - 1);

        // Adjust day-based budgets
        if (trip.itinerary.budget && currentDays > 1) {
          const budget = trip.itinerary.budget;
          budget.accommodation = Math.max(0, Math.round(budget.accommodation - (budget.accommodation / currentDays)));
          budget.food = Math.max(0, Math.round(budget.food - (budget.food / currentDays)));
          budget.transportation = Math.max(0, Math.round(budget.transportation - (budget.transportation / currentDays)));
        }
      }

      // Recalculate total budget
      if (trip.itinerary.budget) {
        const budget = trip.itinerary.budget;
        budget.total = (budget.flights || 0) + 
                       (budget.accommodation || 0) + 
                       (budget.food || 0) + 
                       (budget.activities || 0) + 
                       (budget.transportation || 0);
      }

      trip.markModified('itinerary');
      trip.markModified('numberOfDays');
      await trip.save();
    }
    res.json(trip);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to remove activity", details: error.message });
  }
};

export const regenerateDay = async (req: AuthRequest, res: Response) => {
  try {
    const { day, instruction } = req.body;
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const dayObjIndex = trip.itinerary.days.findIndex(d => d.day === day);
    if (dayObjIndex === -1) return res.status(404).json({ error: "Day not found" });

    // Store old activities count
    const oldActivitiesCount = trip.itinerary.days[dayObjIndex].activities.length;

    const updatedDay = await aiProvider.regenerateDay({
      destination: trip.destination,
      budgetType: trip.budgetType,
      interests: trip.interests,
      currentDayData: trip.itinerary.days[dayObjIndex],
      userInstruction: instruction
    });

    // Count new activities
    const newActivitiesCount = updatedDay.activities.length;
    const diff = newActivitiesCount - oldActivitiesCount;

    trip.itinerary.days[dayObjIndex] = updatedDay;

    // Adjust activities budget based on count difference
    if (trip.itinerary.budget && diff !== 0) {
      const budget = trip.itinerary.budget;
      budget.activities = Math.max(0, (budget.activities || 0) + (diff * 50));
      
      // Recalculate total budget
      budget.total = (budget.flights || 0) + 
                     (budget.accommodation || 0) + 
                     (budget.food || 0) + 
                     (budget.activities || 0) + 
                     (budget.transportation || 0);
    }

    trip.markModified('itinerary');
    await trip.save();

    res.json(trip);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to regenerate day" });
  }
};
